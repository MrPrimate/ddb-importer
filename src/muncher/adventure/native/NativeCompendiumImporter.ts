import { CompendiumHelper, logger } from "../../../lib/_module";
import { SETTINGS } from "../../../config/_module";
import { createDDBCompendium } from "../../../hooks/ready/checkCompendiums";

/**
 * Copies the imported world journals + tables into the DDB Journals / DDB Tables
 * compendiums (gated by `adventure-policy-add-to-compendiums`), mirroring
 * AdventureMunch. The compendium copies' internal @UUID links are repointed to
 * the compendium versions-  but ONLY for docs we imported (targeted), so links
 * to anything else stay world links. World docs are never modified.
 */

const JOURNAL_SHEET = "ddb-importer.DDBJournalSheet";

// Repoint @UUID[JournalEntry.<id> / @UUID[RollTable.<id> to the compendium pack,
// but only when <id> belongs to an imported doc. The link tail is preserved.
function repointRefs(
  html: string,
  journalIds: Set<string>,
  tableIds: Set<string>,
  jPackId: string,
  tPackId: string,
): string {
  if (!html) return html;
  return html
    .replace(/@UUID\[JournalEntry\.([A-Za-z0-9]{16})/g,
      (m, id) => (journalIds.has(id) ? `@UUID[Compendium.${jPackId}.JournalEntry.${id}` : m))
    .replace(/@UUID\[RollTable\.([A-Za-z0-9]{16})/g,
      (m, id) => (tableIds.has(id) ? `@UUID[Compendium.${tPackId}.RollTable.${id}` : m));
}

// Create the given folder docs inside the pack (keeping ids so each doc's
// `folder` resolves in-compendium). Skips folders already present.
async function createFoldersInPack(pack: any, folderDocs: any[]): Promise<void> {
  const existing = new Set(pack.folders.map((f: any) => f._id));
  const toCreate = folderDocs.filter((f) => !existing.has(f._id));
  if (toCreate.length > 0) {
    await Folder.createDocuments(foundry.utils.deepClone(toCreate), { pack: pack.metadata.id, keepId: true });
  }
}

/**
 * Scenes are intentionally NOT copied to a compendium - they live in the world
 * only. Compendium re-import would break note → journal and token → monster links
 * (Foundry doesn't resolve cross-pack note targets cleanly), so scene folders
 * here are also ignored.
 *
 * @param folders deterministic folder docs (JournalEntry + RollTable types
 *   are copied to the matching packs; Scene-type folders are dropped).
 */
export async function importToCompendiums(journals: any[], tables: any[], folders: any[]): Promise<void> {
  // ensure the Journals + Tables compendiums exist
  for (const title of ["Journals", "Tables"]) {
    const comp = SETTINGS.COMPENDIUMS.find((c: any) => c.title === title);
    if (comp) await createDDBCompendium(comp);
  }
  const journalPack = CompendiumHelper.getCompendiumType("journal", false);
  const tablePack = CompendiumHelper.getCompendiumType("table", false);
  if (!journalPack || !tablePack) {
    logger.warn("Native compendium import: journal/table compendium unavailable; skipping");
    return;
  }
  await journalPack.getIndex();
  await tablePack.getIndex();
  const jPackId = journalPack.metadata.id;
  const tPackId = tablePack.metadata.id;

  const journalIds = new Set<string>(journals.map((j) => j._id));
  const tableIds = new Set<string>(tables.map((t) => t._id));

  // folders, split by pack type (Scene-type folders dropped - no scene compendium)
  await createFoldersInPack(journalPack, folders.filter((f) => f.type === "JournalEntry"));
  await createFoldersInPack(tablePack, folders.filter((f) => f.type === "RollTable"));

  // journals → compendium copies (repoint refs, keep world docs untouched via clone)
  const jToCreate: any[] = [];
  for (const journal of journals) {
    if (journalPack.index.has(journal._id)) continue;
    const clone = foundry.utils.deepClone(journal);
    foundry.utils.setProperty(clone, "flags.core.sheetClass", JOURNAL_SHEET);
    for (const page of clone.pages ?? []) {
      if (page.type === "text" && page.text?.content) {
        page.text.content = repointRefs(page.text.content, journalIds, tableIds, jPackId, tPackId);
      }
    }
    jToCreate.push(clone);
  }
  if (jToCreate.length) {
    await JournalEntry.createDocuments(jToCreate, { pack: jPackId, keepId: true, keepEmbeddedIds: true });
  }

  // tables → compendium copies (repoint result-text refs)
  const tToCreate: any[] = [];
  for (const table of tables) {
    if (tablePack.index.has(table._id)) continue;
    const clone = foundry.utils.deepClone(table);
    for (const result of clone.results ?? []) {
      if (result.text) result.text = repointRefs(result.text, journalIds, tableIds, jPackId, tPackId);
    }
    tToCreate.push(clone);
  }
  if (tToCreate.length) {
    await RollTable.createDocuments(tToCreate, { pack: tPackId, keepId: true, keepEmbeddedIds: true });
  }

  logger.info(`Native compendium import: ${jToCreate.length} journals, ${tToCreate.length} tables`);
}
