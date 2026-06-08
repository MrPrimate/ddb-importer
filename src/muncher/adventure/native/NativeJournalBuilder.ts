import { logger } from "../../../lib/_module";
import NativeIdFactory from "./NativeIdFactory";
import { buildDdbFlags } from "./NativeShared";
// ProcessedRow + ItemNotify are declared globally in ./types.d.ts.

const JOURNAL_SORT = 1000;

// Custom DDB journal sheet, applied via the core sheetClass flag, matches
// AdventureMunch sets on import so journals render with the DDB book styling.
const DDB_JOURNAL_SHEET = "ddb-importer.DDBJournalSheet";

function makeFlags(row: ProcessedRow, bookCode: string, themeCss?: string | null): any {
  const ddb = buildDdbFlags({
    ddbId: row.id,
    bookCode,
    slug: row.slug,
    contentChunkId: row.contentChunkId,
    cobaltId: row.cobaltId,
    parentId: row.parentId,
  });
  if (themeCss) ddb.themeCss = themeCss;
  return { ddb };
}

function makePage(row: ProcessedRow, id: string, flags: any): any {
  return {
    _id: id,
    name: row.title,
    type: "text",
    title: { show: false, level: row.level },
    text: { format: 1, content: row.content },
    video: { controls: true, volume: 0.5 },
    image: {},
    src: null,
    sort: 0,
    ownership: { default: -1 },
    flags,
  };
}

/**
 * Port of the journals-relevant parts of JournalFactory.js + Journal.js.
 *
 * - A row with a `cobaltId` is a chapter → its own JournalEntry (forceAdd).
 * - A row with neither cobaltId nor parentId is a standalone → its own JournalEntry.
 * - A row with a `parentId` (and no cobaltId) is a section → its page is appended to
 *   the chapter JournalEntry whose `cobaltId === parentId`.
 *
 * Returns an array of JournalEntry document objects (each with `pages`).
 */
export function buildJournals(
  rows: ProcessedRow[],
  folderId: string,
  bookCode: string,
  idFactory: NativeIdFactory,
  notify?: ItemNotify,
  themeCss?: string | null,
): any[] {
  const journals: any[] = [];

  const isSection = (row: ProcessedRow) =>
    row.parentId !== null && Number.isInteger(row.parentId) && row.cobaltId === null;

  // Pass 1: chapters + standalones become their own JournalEntry.
  for (let rowNum = 0; rowNum < rows.length; rowNum++) {
    const row = rows[rowNum];
    notify?.(rowNum + 1, rows.length, "Building journal entries");
    if (isSection(row)) continue;

    const flags = makeFlags(row, bookCode, themeCss);
    const _id = idFactory.getId(NativeIdFactory.makeKey({
      docType: "JournalEntry",
      ddbId: row.id,
      cobaltId: row.cobaltId,
      parentId: row.parentId,
      name: row.title,
    }));
    // chapters/top-level entries get a linkId pointing at themselves
    if (row.parentId === null) flags.ddb.linkId = _id;

    const journal = {
      _id,
      name: row.title,
      folder: folderId,
      sort: JOURNAL_SORT + row.id,
      ownership: { default: 0 },
      flags: { ...flags, core: { sheetClass: DDB_JOURNAL_SHEET } },
      pages: [makePage(row, _id, structuredClone(flags))],
    };
    journals.push(journal);
  }

  // Pass 2: sections append their page to the matching chapter.
  for (const row of rows) {
    if (!isSection(row)) continue;

    const parent = journals.find((j) => j.flags.ddb.cobaltId === row.parentId);
    if (!parent) {
      logger.warn(`Native adventure: no parent chapter (cobaltId=${row.parentId}) for section "${row.title}" - page dropped`);
      continue;
    }

    const flags = makeFlags(row, bookCode, themeCss);
    const pageId = idFactory.getId(NativeIdFactory.makeKey({
      docType: "JournalEntry",
      ddbId: row.id,
      cobaltId: row.cobaltId,
      parentId: row.parentId,
      name: row.title,
    }));
    const page = makePage(row, pageId, flags);
    if (page.name !== parent.name) page.title.show = true;
    parent.pages.push(page);
  }

  return journals;
}
