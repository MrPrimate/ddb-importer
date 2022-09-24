// for exports
import { parseMonsters } from "../../muncher/monster/monster.js";
import { parseSpells } from "../../muncher/spells.js";
import { parseItems } from "../../muncher/items.js";
import { parseCritters, fixCritters } from "../../muncher/monsters.js";
import { parseTransports } from "../../muncher/vehicles.js";
import { updateWorldMonsters, resetCompendiumActorImages } from "../../muncher/tools.js";
import { migrateExistingCompendium, createCompendiumFolderStructure } from "../../muncher/compendiumFolders.js";
import { parseEncounters, DDBEncounterMunch } from "../../muncher/encounters.js";
import { generateAdventureConfig } from "../../muncher/adventure.js";
import { updateDDBCharacter } from "../../character/update.js";
import { importCharacter, importCharacterById } from "../../character/import.js";
import { checkCobalt } from "../../lib/Secrets.js";
import { base64Check } from "../../utils/base64Check.js";
import { getFeats } from "../../muncher/feats/feats.js";
import { loadMacroFile, generateItemMacroFlag, createMacro, executeDDBMacro, MACROS } from "../../effects/macros.js";
import { iconPath } from "../../icons/index.js";
import { loadSRDRules, importCacheLoad } from "../../utils/templateStrings.js";
import { getNPCImage } from "../../muncher/importMonster.js";
import PatreonHelper from "../../utils/patreon.js";
import CompendiumHelper from "../../utils/compendiums.js";
import MuncherSettings from "../../muncher/MuncherSettings.js";

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
  const compendiumNames = CompendiumHelper.getCompendiumNames();
  game.packs
    .filter((pack) => compendiumNames.includes(pack.collection))
    .forEach(migrateAllCompendiums);
}

export function registerWindow() {
  window.DDBImporter = {
    base64Check: base64Check,
    checkCobalt,
    checkPatreon: PatreonHelper.checkPatreon,
    createCompendiumFolderStructure,
    createMacro,
    DDBEncounterMunch,
    encounterMunch: DDBEncounterMunch,
    executeDDBMacro,
    generateAdventureConfig,
    generateItemMacroFlag,
    getPatreonTier: PatreonHelper.getPatreonTier,
    getPatreonTiers: PatreonHelper.getPatreonTiers,
    importCharacter,
    importCharacterById,
    loadMacroFile,
    migrateCompendiums,
    migrateExistingCompendiumToCompendiumFolders: migrateExistingCompendium,
    parseCritters,
    parseTransports,
    parseEncounters,
    parseFeats: getFeats,
    parseItems,
    parseMonsters,
    parseSpells,
    resetProxy,
    resetSecrets,
    setPatreonTier: PatreonHelper.setPatreonTier,
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
    getCompendiumLabel: CompendiumHelper.getCompendiumLabel,
    getCompendiumType: CompendiumHelper.getCompendiumType,
    getCompendiumNames: CompendiumHelper.getCompendiumNames,
    deleteDefaultCompendiums: CompendiumHelper.deleteDefaultCompendiums,
    muncherSettings: MuncherSettings.getMuncherSettings,
    characterSettings: MuncherSettings.getCharacterImportSettings,
  };
}
