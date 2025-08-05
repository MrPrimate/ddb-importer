import logger from "../../lib/Logger.mjs";
import { migrateJournalsToDDBSheet } from "./migration/migration_5_6_0_journals.js";

const SCHEMA_VERSION = "6.5.0";


export function registerSettings () {
  game.settings.register("ddb-importer", "data-version", {
    scope: 'world',
    config: false,
    type: String,
    default: '0.0.0',
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

  const dataVersion = game.settings.get("ddb-importer", "data-version");
  if (foundry.utils.isNewerVersion("6.5.0", dataVersion)) {
    logger.info("Migrating DDB Journal Data");
    await migrateJournalsToDDBSheet(false);
    logger.info("Migration complete");
  }

  if (dataVersion !== SCHEMA_VERSION) {
    await setCurrentVersion();
  }

}
