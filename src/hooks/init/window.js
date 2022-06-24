// for exports
import { parseMonsters } from "../../muncher/monster/monster.js";
import { parseSpells } from "../../muncher/spells.js";
import { parseItems } from "../../muncher/items.js";
import { parseCritters, fixCritters } from "../../muncher/monsters.js";
import { updateWorldMonsters, resetCompendiumActorImages } from "../../muncher/tools.js";
import { migrateExistingCompendium, createCompendiumFolderStructure } from "../../muncher/compendiumFolders.js";
import { parseEncounters, DDBEncounterMunch } from "../../muncher/encounters.js";
import { generateAdventureConfig } from "../../muncher/adventure.js";
import { updateDDBCharacter } from "../../character/update.js";
import { importCharacter, importCharacterById } from "../../character/import.js";
import { getPatreonTier, getPatreonTiers, setPatreonTier, checkPatreon, getCompendiumLabel, getCompendiumType } from "../../muncher/utils.js";
import { checkCobalt } from "../../lib/Secrets.js";
import { base64Check } from "../../lib/Base64Check.js";
import { getFeats } from "../../muncher/feats/feats.js";
import { getCompendiumNames } from "../ready/checkCompendiums.js";
import { loadMacroFile, generateItemMacroFlag, createMacro, executeDDBMacro, MACROS } from "../../effects/macros.js";
import { iconPath } from "../../icons/index.js";
import { loadSRDRules, importCacheLoad } from "../../parser/templateStrings.js";
import { getNPCImage } from "../../muncher/importMonster.js";

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
}

function migrateCompendiums() {
  const compendiumNames = getCompendiumNames();
  game.packs
    .filter((pack) => compendiumNames.includes(pack.collection))
    .forEach(migrateAllCompendiums);
}

export function registerWindow() {
  window.DDBImporter = {
    base64Check: base64Check,
    checkCobalt,
    checkPatreon,
    createCompendiumFolderStructure,
    createMacro,
    DDBEncounterMunch,
    encounterMunch: DDBEncounterMunch,
    executeDDBMacro,
    generateAdventureConfig,
    generateItemMacroFlag,
    getPatreonTier,
    getPatreonTiers,
    importCharacter,
    importCharacterById,
    loadMacroFile,
    migrateCompendiums,
    migrateExistingCompendiumToCompendiumFolders: migrateExistingCompendium,
    parseCritters,
    parseEncounters,
    parseFeats: getFeats,
    parseItems,
    parseMonsters,
    parseSpells,
    resetProxy,
    resetSecrets,
    setPatreonTier,
    updateDDBCharacter,
    updateWorldMonsters,
    getIconPath: iconPath,
    iconPath,
    loadSRDRules,
    importCacheLoad,
    fixCritters,
    macros: MACROS,
    getNPCImage,
    resetCompendiumActorImages,
    getCompendiumLabel,
    getCompendiumType,
  };
}
