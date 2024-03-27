// for exports
import DDBMonster from "./parser/DDBMonster.js";
import DDBMonsterFactory from "./parser/DDBMonsterFactory.js";
import { parseSpells } from "./muncher/spells.js";
import { parseItems } from "./muncher/items.js";
import { parseTransports } from "./muncher/vehicles.js";
import { updateWorldMonsters, resetCompendiumActorImages, parseCritters } from "./muncher/tools.js";
import DDBEncounterMunch from "./apps/DDBEncounterMunch.js";
import DDBEncounters from "./parser/DDBEncounters.js";
import { generateAdventureConfig, downloadAdventureConfig } from "./muncher/adventure.js";
import { updateDDBCharacter } from "./updater/character.js";
import DDBCharacterManager, { importCharacter, importCharacterById } from "./apps/DDBCharacterManager.js";
import { checkCobalt } from "./lib/Secrets.js";
// import { base64Check } from "./lib/base64Check.js";
import { getFeats } from "./muncher/feats/feats.js";
import DDBMacros from "./effects/DDBMacros.js";
import Iconizer from "./lib/Iconizer.js";
import { importCacheLoad } from "./lib/DDBReferenceLinker.js";
import { getNPCImage } from "./muncher/importMonster.js";
import PatreonHelper from "./lib/PatreonHelper.js";
import CompendiumHelper from "./lib/CompendiumHelper.js";
import FileHelper from "./lib/FileHelper.js";
import { DirectoryPicker } from "./lib/DirectoryPicker.js";
import MuncherSettings from "./lib/MuncherSettings.js";
import DDBProxy from "./lib/DDBProxy.js";
import DDBCompanion from "./parser/companions/DDBCompanion.js";
import { DDBCompendiumFolders } from "./lib/DDBCompendiumFolders.js";
import DDBCompanionFactory from "./parser/companions/DDBCompanionFactory.js";
import SETTINGS from "./settings.js";
import DICTIONARY from "./dictionary.js";
import logger from "./logger.js";
import NameMatcher from "./lib/NameMatcher.js";
import OriginFixer from "./lib/OriginFixer.js";
import DDBEffectHelper from "./effects/DDBEffectHelper.js";
import DDBItemImporter from "./lib/DDBItemImporter.js";
import DialogHelper from "./lib/DialogHelper.js";
import utils from "./lib/utils.js";
import DDBHelper from "./lib/DDBHelper.js";
import { calculatePrice, updateItemPrices } from "./muncher/prices.js";
import DDBCampaigns from "./lib/DDBCampaigns.js";
import ChrisPremadesHelper from "./effects/external/ChrisPremadesHelper.js";
import ExternalAutomations from "./effects/external/ExternalAutomations.js";

function resetSecrets() {
  game.settings.set("ddb-importer", "cobalt-cookie-local", false);
  game.settings.set("ddb-importer", "cobalt-cookie", "");
  game.settings.set("ddb-importer", "campaign-id", "");
}

// eslint-disable-next-line no-unused-vars
function migrateAllCompendiums(value, key, map) {
  if (!value.locked) game.dnd5e.migrations.migrateCompendium(value);
}

function migrateCompendiums() {
  const compendiumNames = CompendiumHelper.getCompendiumNames();
  game.packs.filter((pack) => compendiumNames.includes(pack.collection)).forEach(migrateAllCompendiums);
}

function debugStart() {
  CONFIG.debug.ddbimporter.record = true;
}

function debugStop() {
  CONFIG.debug.ddbimporter.download();
}

function testFunction(testName) {
  logger.debug(`generating test function: ${testName}`, testName);
  const print = (...params) => {
    logger.warn(`test function "${testName}" called with params`, { params });
  };
  return print;
}

function simpleTest(...params) {
  logger.warn(`running simple test with params`, { params });
}

export function registerApi() {
  const API = {
    migrateCompendiums,
    compendiums: {
      migrateCompendiums,
      DDBCompendiumFolders,
      getCompendiumLabel: CompendiumHelper.getCompendiumLabel,
      getCompendiumType: CompendiumHelper.getCompendiumType,
      getCompendiumNames: CompendiumHelper.getCompendiumNames,
      deleteDefaultCompendiums: CompendiumHelper.deleteDefaultCompendiums,
    },
    patreon: {
      checkPatreon: PatreonHelper.checkPatreon,
      getPatreonTier: PatreonHelper.getPatreonTier,
      getPatreonUser: PatreonHelper.getPatreonUser,
      calculateAccessMatrix: PatreonHelper.calculateAccessMatrix,
      setPatreonTier: PatreonHelper.setPatreonTier,
      fetchPatreonTier: PatreonHelper.fetchPatreonTier,
      getPatreonValidity: PatreonHelper.getPatreonValidity,
    },
    lib: {
      CompendiumHelper,
      ChrisPremadesHelper,
      DDBCampaigns,
      DDBCharacterManager,
      DDBCompanion,
      DDBCompanionFactory,
      DDBCompendiumFolders,
      DDBEffectHelper,
      DDBEncounterMunch,
      DDBEncounters,
      DDBHelper,
      DDBItemImporter,
      DDBMacros,
      DDBMonster,
      DDBMonsterFactory,
      DDBProxy,
      DialogHelper,
      DirectoryPicker,
      FileHelper,
      MuncherSettings,
      NameMatcher,
      OriginFixer,
    },
    settings: {
      muncherSettings: MuncherSettings.getMuncherSettings,
      characterSettings: MuncherSettings.getCharacterImportSettings,
    },

    // base64Check: base64Check,
    checkCobalt,
    resetProxy: DDBProxy.resetProxy,
    resetSecrets,

    generateAdventureConfig,
    downloadAdventureConfig,

    importCharacter,
    importCharacterById,

    parseCritters,
    parseTransports,
    parseFeats: getFeats,
    parseItems,
    parseSpells,

    prices: {
      generateXgtePrices: updateItemPrices,
      calculateXgtePrice: calculatePrice,
    },

    updateDDBCharacter,
    updateWorldMonsters,

    getIconPath: Iconizer.iconPath,
    iconPath: Iconizer.iconPath,
    generateIcon: Iconizer.generateIcon,

    importCacheLoad,
    getNPCImage,
    resetCompendiumActorImages,

    generateItemMacroFlag: DDBMacros.generateItemMacroFlag,
    EffectHelper: DDBEffectHelper,
    DialogHelper,
    effects: {
      helpers: DDBEffectHelper,
      ChrisPremadesHelper,
      addChrisEffectsToActorDocuments: ExternalAutomations.addChrisEffectsToActorDocuments,
      addDDBIEffectsToActorDocuments: DDBEffectHelper.addDDBIEffectsToActorDocuments,
      addDDBIEffectToDocument: DDBEffectHelper.addDDBIEffectToDocument,
      // these are now in DDBEffectHelper, wrapped here for historical reasons
      addSaveAdvantageToTarget: DDBEffectHelper.addSaveAdvantageToTarget,
      attachSequencerFileToTemplate: DDBEffectHelper.attachSequencerFileToTemplate,
      checkCollision: DDBEffectHelper.checkCollision,
      checkJB2a: DDBEffectHelper.checkJB2a,
      checkTargetInRange: DDBEffectHelper.checkTargetInRange,
      configureCustomAAForCondition: DDBEffectHelper.configureCustomAAForCondition,
      findContainedTokensInTemplate: DDBEffectHelper.findContainedTokensInTemplate,
      findEffect: DDBEffectHelper.findEffect,
      findEffects: DDBEffectHelper.findEffects,
      getCantripDice: DDBEffectHelper.getCantripDice,
      getHighestAbility: DDBEffectHelper.getHighestAbility,
      getRemainingDuration: DDBEffectHelper.getRemainingDuration,
      isRangedWeaponAttack: DDBEffectHelper.isRangedWeaponAttack,
      requirementsSatisfied: DDBEffectHelper.requirementsSatisfied,
      selectTargetsWithinX: DDBEffectHelper.selectTargetsWithinX,
      wait: DDBEffectHelper.wait,
    },
    executeDDBMacro: DDBMacros.executeDDBMacro,
    // macro tools
    macros: {
      createMacro: DDBMacros.createMacro,
      executeMacro: DDBMacros.executeDDBMacro,
      getMacroFunction: DDBMacros.getMacroFunction,
      loadMacroFile: DDBMacros.loadMacroFile,
      macros: DDBMacros.MACROS,
      getMacro: DDBMacros.getMacro,
    },
    chris: {
      generateEffect: ExternalAutomations.applyChrisPremadeEffect,
      generateEffects: ExternalAutomations.applyChrisPremadeEffects,
      adjustActor: ExternalAutomations.addChrisEffectsToActorDocuments,
    },
    debug: {
      start: debugStart,
      stop: debugStop,
      test: testFunction,
      simpleTest: simpleTest,
      utils,
    },
    DICTIONARY,
  };

  globalThis['DDBImporter'] = API;
  game.modules.get(SETTINGS.MODULE_ID).api = API;
  game.modules.get(SETTINGS.MODULE_ID).DICTIONARY = DICTIONARY;
}
