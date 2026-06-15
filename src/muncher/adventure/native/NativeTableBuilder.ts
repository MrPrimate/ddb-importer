import { logger, utils } from "../../../lib/_module";
import { parseTable, getHeadings } from "../../../../vendor/parseTable";
import { buildTable, buildNestedTables, findDiceColumns, guessTableName, parseNestedDiceTable } from "../../../parser/lib/DDBTable";
import NativeIdFactory from "./NativeIdFactory";
import { makeFolderData } from "./NativeFolderBuilder";
import { buildDdbFlags } from "./NativeShared";
// ProcessedRow, TableHint + ItemNotify are declared globally in ./types.d.ts.

const TABLE_SORT = 100000;
const FOLDER_SORT = 4000;

/**
 * Parses `<table>` elements from journal HTML into world RollTable docs (reusing
 * DDBTable's buildTable + helpers), files them in nested per-chapter folders, and
 * appends `@UUID[RollTable.<id>]{Open RollTable …}` links into the journal content
 * so the DDB sheet shows a Roll button.
 *
 * Folders are deterministic doc objects (not created here) so the same folder id
 * can be created in the world and/or a compendium with `keepId`. Only chapters
 * with tables get a folder (no empty folders). Returns the collected folder docs.
 *
 * Only tables with dice columns become RollTables (matches the muncher).
 */
export async function buildTables(
  rows: ProcessedRow[],
  bookName: string,
  bookCode: string,
  idFactory: NativeIdFactory,
  tableHints: Map<string, TableHint> = new Map<string, TableHint>(),
  notify?: ItemNotify,
): Promise<{ tables: I5eTableData[]; folders: I5eFolderData[]; updatedContentById: Map<number, string> }> {
  const tables: I5eTableData[] = [];
  const updatedContentById = new Map<number, string>();

  // chapter title lookup (chapter rows carry a cobaltId)
  const titleByCobalt = new Map<number, string>();
  for (const row of rows) {
    if (row.cobaltId !== null) titleByCobalt.set(row.cobaltId, row.title);
  }

  // Deterministic RollTable folder docs, built lazily (only when a table needs
  // them). `sorting: "m"` so the compendium/world list keeps the sort order.
  const folders = new Map<string, I5eFolderData>();
  const folderId = (key: string) =>
    idFactory.getId(NativeIdFactory.makeKey({ docType: "Folder", cobaltId: -1, name: key }));

  const ensureMaster = (): string => {
    const id = folderId(`RollTable:${bookName}`);
    if (!folders.has(id)) {
      folders.set(id, makeFolderData({
        _id: id, name: bookName, type: "RollTable", cobaltId: -1, bookCode, sort: FOLDER_SORT,
      }));
    }
    return id;
  };
  const ensureChapter = (key: number): string => {
    const masterId = ensureMaster();
    const id = folderId(`RollTable:${bookName}:chapter:${key}`);
    if (!folders.has(id)) {
      folders.set(id, makeFolderData({
        _id: id, name: titleByCobalt.get(key) ?? `Chapter ${key}`, type: "RollTable",
        cobaltId: key, bookCode, folder: masterId, sort: FOLDER_SORT + key,
      }));
    }
    return id;
  };

  // Folder id for a table: the chapter folder (or master), or a hinted `folderName` subfolder under it.
  const resolveFolderId = (row: ProcessedRow, folderName?: string): string => {
    const key = row.cobaltId ?? row.parentId;
    const chapterId = key === null ? ensureMaster() : ensureChapter(key);
    if (!folderName) return chapterId;
    const id = folderId(`RollTable:${bookName}:chapter:${key}:named:${folderName}`);
    if (!folders.has(id)) {
      folders.set(id, makeFolderData({
        _id: id, name: folderName, type: "RollTable", cobaltId: key, bookCode, folder: chapterId, sort: FOLDER_SORT,
      }));
    }
    return id;
  };

  for (let rowNum = 0; rowNum < rows.length; rowNum++) {
    const row = rows[rowNum];
    notify?.(rowNum + 1, rows.length, "Parsing tables");
    const linksByChunk = new Map<string, { id: string; name: string }[]>();
    const doc = utils.htmlToDoc(row.sourceHtml);
    const tableNodes = doc.querySelectorAll("table");

    for (let tableNum = 0; tableNum < tableNodes.length; tableNum++) {
      const node = tableNodes[tableNum];
      try {
        const diceKeys: string[] = findDiceColumns(node);
        if (diceKeys.length === 0) continue; // only dice tables → RollTables

        const parsed = parseTable(node) as I5eParsedTable;
        const keys: string[] = getHeadings(node);
        const contentChunkId = node.getAttribute("data-content-chunk-id");
        const hint = contentChunkId ? tableHints.get(contentChunkId) : undefined;

        // name: hint wins over the DOM-heading guess
        let nameGuess: string;
        if (hint?.tableName) {
          nameGuess = hint.tableName;
        } else {
          nameGuess = guessTableName(row.title, doc, tableNum);
          if (nameGuess.split(" ").length > 5 && diceKeys.length === 1 && keys.length === 2) {
            nameGuess = keys[1];
          } else if (nameGuess.trim() === "") {
            nameGuess = keys[1] ?? "Unnamed Table";
          }
        }

        const tableFolderId = resolveFolderId(row, hint?.folderName);

        // Assign deterministic id, folder, sort, ownership + ddb flags in place.
        const finalizeTable = (table: I5eTableData): string => {
          table._id = idFactory.getId(NativeIdFactory.makeKey({
            docType: "RollTable",
            ddbId: row.id,
            cobaltId: row.cobaltId,
            parentId: row.parentId,
            contentChunkId,
            name: table.name,
          }));
          table.folder = tableFolderId;
          table.sort = TABLE_SORT + row.id;
          table.ownership = { default: 0 };
          table.flags = {
            ...(table.flags ?? {}),
            ddb: buildDdbFlags({
              ddbId: row.id,
              bookCode,
              slug: row.slug,
              contentChunkId,
              cobaltId: row.cobaltId,
              parentId: row.parentId,
            }),
          };
          return table._id;
        };

        const registerJournalLink = (table: I5eTableData) => {
          if (!contentChunkId) return;
          const list = linksByChunk.get(contentChunkId) ?? [];
          list.push({ id: table._id!, name: table.name! });
          linksByChunk.set(contentChunkId, list);
        };

        // Nested dice tables (a primary die selecting per-row sub-tables) become
        // a parent RollTable whose results link to one child RollTable each.
        const nested = parseNestedDiceTable(node);
        if (nested) {
          const { parent, children } = buildNestedTables({
            parse: nested,
            tableName: nameGuess,
            parentName: row.title,
          });
          children.forEach((child, i) => {
            if (!child) return;
            const childId = finalizeTable(child);
            tables.push(child);
            const result = parent.results![i];
            result.description = `${result.description} @UUID[RollTable.${childId}]{${child.name}}`;
          });
          finalizeTable(parent);
          tables.push(parent);
          registerJournalLink(parent); // children are reached through the parent
          continue;
        }

        const built: I5eTableData[] = buildTable({
          parsedTable: parsed,
          keys,
          diceKeys,
          tableName: nameGuess,
          parentName: row.title,
          html: row.sourceHtml,
        });
        if (built.length === 0) continue;

        for (const table of built) {
          finalizeTable(table);
          tables.push(table);
          registerJournalLink(table);
        }
      } catch (error) {
        logger.warn(`NativeTableBuilder: failed table in "${row.title}": ${(error as Error).message}`);
      }
    }

    // Append roll links after the matching tables in the final page content.
    if (linksByChunk.size > 0) {
      const contentDoc = utils.htmlToDoc(row.content);
      contentDoc.querySelectorAll("table").forEach((node) => {
        const chunkId = node.getAttribute("data-content-chunk-id");
        const links = chunkId ? linksByChunk.get(chunkId) : undefined;
        if (!links) return;
        for (const { id, name } of links) {
          node.insertAdjacentHTML("afterend", `<div id="table-link">@UUID[RollTable.${id}]{Open RollTable ${name}}</div>`);
        }
      });
      updatedContentById.set(row.id, contentDoc.body.innerHTML.replace(/\s+/g, " "));
    }
  }

  logger.info(`NativeTableBuilder: built ${tables.length} RollTables in ${folders.size} folders`);
  return { tables, folders: [...folders.values()], updatedContentById };
}
