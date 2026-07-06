import { DDBAdventureImporter } from "../../apps/DDBAdventureImporter";
import { SETTINGS } from "../../config/_module";

export default function () {
  const registerSheet = foundry.applications?.apps?.DocumentSheetConfig;
  registerSheet.registerSheet(Adventure as unknown as Parameters<typeof registerSheet.registerSheet>[0], SETTINGS.MODULE_ID, DDBAdventureImporter as unknown as Parameters<typeof registerSheet.registerSheet>[2], {
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
