// for exports
import { parseMonsters } from "../../muncher/monster/monster.js";
import { parseSpells } from "../../muncher/spells.js";
import { parseItems } from "../../muncher/items.js";
import { parseCritters } from "../../muncher/monsters.js";
import { generateAdventureConfig } from "../../muncher/adventure.js";
import { updateDDBCharacter } from "../../character/update.js";
import { getPatreonTier, getPatreonTiers, setPatreonTier, checkPatreon } from "../../muncher/utils.js";
import { checkCobalt } from "../../lib/Secrets.js";

function resetSecrets() {
  game.settings.set("ddb-importer", "cobalt-cookie-local", false);
  game.settings.set("ddb-importer", "cobalt-cookie", "");
  game.settings.set("ddb-importer", "campaign-id", "");
}

function resetProxy() {
  game.settings.set("ddb-importer", "api-endpoint", "https://proxy.ddb.mrprimate.co.uk");
  game.settings.set("ddb-importer", "custom-proxy", false);
}

// eslint-disable-next-line no-unused-vars
function migrateAllCompendiums(value, key, map) {
  if (!value.locked) game.dnd5e.migrations.migrateCompendium(value);
  game.dnd5e.migrations.migrateCompendium(value);
}

function migrateCompendiums() {
  game.packs.forEach(migrateAllCompendiums);
}

export function registerWindow() {
  window.DDBImporter = {
    parseCritters,
    parseMonsters,
    parseSpells,
    parseItems,
    generateAdventureConfig,
    migrateCompendiums,
    resetProxy,
    resetSecrets,
    updateDDBCharacter,
    getPatreonTier,
    getPatreonTiers,
    setPatreonTier,
    checkPatreon,
    checkCobalt,
  };
}
