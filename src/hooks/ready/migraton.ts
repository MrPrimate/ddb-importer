import logger from "../../lib/Logger";
import { utils } from "../../lib/_module";
import { migrateJournalsToDDBSheet } from "./migration/migration_5_6_0_journals";

const SCHEMA_VERSION = "7.5.5";


export function registerSettings () {
  game.settings.register("ddb-importer", "data-version", {
    scope: "world",
    config: false,
    type: String,
    default: "0.0.0",
  });
}


async function setCurrentVersion() {
  await game.settings.set("ddb-importer", "data-version", SCHEMA_VERSION);
}

export async function migration() {

  registerSettings();

  if (!game.user.isGM) {
    return;
  }

  const dataVersion = utils.getSetting<string>("data-version");
  if (foundry.utils.isNewerVersion("6.5.0", dataVersion)) {
    logger.info("Migrating DDB Journal Data");
    await migrateJournalsToDDBSheet(false);
    logger.info("Migration complete");
  }

  if (foundry.utils.isNewerVersion("7.5.5", dataVersion)) {
    // Numeric species IDs cannot distinguish species from subraces.
    const selectedSpecies = utils.getSetting<unknown[]>("munching-policy-character-species");
    await game.settings.set("ddb-importer", "munching-policy-character-species", []);
    if (selectedSpecies.length > 0) {
      ui.notifications.info("DDB Importer: saved species selections have been reset. Select species again before munching; an empty selection imports all enabled sources.");
    }
  }

  if (dataVersion !== SCHEMA_VERSION) {
    await setCurrentVersion();
  }

}
