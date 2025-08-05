import { CompendiumHelper, logger } from "../../../lib/_module.mjs";

async function updateJournalSheetToDDB(sheet, { force = false, sheetClass = "ddb-importer.DDBJournalSheet" } = {}) {
  if (force || sheet.flags?.core?.sheetClass !== sheetClass) {
    logger.info("Updating journal sheet", sheet);
    await sheet.update({
      flags: {
        core: {
          sheetClass,
        },
      },
    });
  }
}

export async function migrateJournalsToDDBSheet(force = false) {
  for (const journalEntry of game.journal) {
    logger.debug("Checking world journal sheet", journalEntry);
    if (!journalEntry.flags?.ddb) continue;
    await updateJournalSheetToDDB(journalEntry, { force });
  }

  const journalCompendium = CompendiumHelper.getCompendiumType("JournalEntry");
  await journalCompendium.getIndex({ fields: ["name", "flags.ddb", "flags.core.sheetClass"] });

  for (const i of journalCompendium.index) {
    logger.debug("Checking compendium journal sheet", i);
    if (!i.flags?.ddb) continue;
    const doc = await journalCompendium.getDocument(i._id);
    if (!doc) continue;
    await updateJournalSheetToDDB(doc, { force });
  }

}
