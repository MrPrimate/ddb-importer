import { CompendiumHelper, logger } from "../../../lib/_module";

async function updateJournalSheetToDDB(sheet: any, { force = false, sheetClass = "ddb-importer.DDBJournalSheet" } = {}) {
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
  if (!journalCompendium) {
    logger.warn("Unable to find DDB journal compendium, skipping journal sheet migration");
    return;
  }
  await journalCompendium.getIndex({ fields: ["name", "flags.ddb", "flags.core.sheetClass"] });

  for (const i of journalCompendium.index) {
    logger.debug("Checking compendium journal sheet", i);
    if (!foundry.utils.getProperty(i, "flags.ddb")) continue;
    const doc = await journalCompendium.getDocument(i._id);
    if (!doc) continue;
    await updateJournalSheetToDDB(doc, { force });
  }

}
