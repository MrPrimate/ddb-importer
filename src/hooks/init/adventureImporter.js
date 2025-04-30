import { DDBAdventureImporter } from "../../apps/DDBAdventureImporter.js";
import { SETTINGS } from "../../config/_module.mjs";

export default function () {
  const registerSheet = foundry.applications?.apps?.DocumentSheetConfig ?? DocumentSheetConfig;
  registerSheet.registerSheet(Adventure, SETTINGS.MODULE_ID, DDBAdventureImporter, {
    label: "DDB Adventure Importer",
  });

  // Hooks.on("renderJournalSheet", (app, html) => {
  //   const journal = app.document;
  //   if (journal.getFlag(SETTINGS.FLAG_NAME, SETTINGS.ADVENTURE_FLAG)) html[0].classList.add(SETTINGS.ADVENTURE_CSS);
  // });

  // Hooks.on("renderJournalPageSheet", (app, html) => {
  //   const journal = app.document.parent;
  //   if (journal.getFlag(SETTINGS.FLAG_NAME, SETTINGS.ADVENTURE_FLAG)) html[0].classList.add(SETTINGS.ADVENTURE_CSS);
  // });

}
