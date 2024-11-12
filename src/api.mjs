// for exports
import { lib, config } from "./_module.mjs";
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
import { getFeats } from "./muncher/feats/feats.js";
import DDBMacros from "./effects/DDBMacros.js";
import { getNPCImage } from "./muncher/importMonster.js";
import DDBCompanion from "./parser/companions/DDBCompanion.js";
import DDBCompanionFactory from "./parser/companions/DDBCompanionFactory.js";
import DDBEffectHelper from "./effects/DDBEffectHelper.js";
import { calculatePrice, updateItemPrices } from "./muncher/prices.js";
import ChrisPremadesHelper from "./effects/external/ChrisPremadesHelper.js";
import ExternalAutomations from "./effects/external/ExternalAutomations.js";
import DDBSimpleMacro from "./effects/DDBSimpleMacro.js";
import DDBSummonsManager from "./parser/companions/DDBSummonsManager.js";
import * as Enrichers from "./parser/enrichers/_module.mjs";

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
  const compendiumNames = lib.CompendiumHelper.getCompendiumNames();
  game.packs.filter((pack) => compendiumNames.includes(pack.collection)).forEach(migrateAllCompendiums);
}

function debugStart() {
  CONFIG.debug.ddbimporter.record = true;
}

function debugStop() {
  CONFIG.debug.ddbimporter.download();
}

function testFunction(testName) {
  lib.logger.debug(`generating test function: ${testName}`, testName);
  const print = (...params) => {
    lib.logger.warn(`test function "${testName}" called with params`, { params });
  };
  return print;
}

function simpleTest(...params) {
  lib.logger.warn(`running simple test with params`, { params });
}

async function updateFoundryCharacters() {
  for (const actor of game.actors.values()) {
    const ddbImported = 'ddbimporter' in actor.flags;
    if (ddbImported && actor.type === "character") {
      lib.logger.info(`Updating ${actor.name} to DDB`);
      await importCharacter(actor);
    }
  }
}

async function updateDDBCharacters() {
  for (const actor of game.actors.values()) {
    const ddbImported = 'ddbimporter' in actor.flags;
    if (ddbImported && actor.type === "character") {
      lib.logger.info(`Updating ${actor.name} to DDB`);
      await updateDDBCharacter(actor);
    }
  }
}

export function registerApi() {
  const API = {
    migrateCompendiums,
    compendiums: {
      migrateCompendiums,
      DDBCompendiumFolders: lib.DDBCompendiumFolders,
      getCompendiumLabel: lib.CompendiumHelper.getCompendiumLabel,
      getCompendiumType: lib.CompendiumHelper.getCompendiumType,
      getCompendiumNames: lib.CompendiumHelper.getCompendiumNames,
      deleteDefaultCompendiums: lib.CompendiumHelper.deleteDefaultCompendiums,
    },
    patreon: {
      checkPatreon: lib.PatreonHelper.checkPatreon,
      getPatreonTier: lib.PatreonHelper.getPatreonTier,
      getPatreonUser: lib.PatreonHelper.getPatreonUser,
      calculateAccessMatrix: lib.PatreonHelper.calculateAccessMatrix,
      setPatreonTier: lib.PatreonHelper.setPatreonTier,
      fetchPatreonTier: lib.PatreonHelper.fetchPatreonTier,
      getPatreonValidity: lib.PatreonHelper.getPatreonValidity,
    },
    lib: {
      ChrisPremadesHelper,
      CompendiumHelper: lib.CompendiumHelper,
      DDBCampaigns: lib.DDBCampaigns,
      DDBCharacterManager,
      DDBCompanion,
      DDBCompanionFactory,
      DDBCompendiumFolders: lib.DDBCompendiumFolders,
      DDBSimpleMacro,
      DDBEffectHelper,
      DDBEncounterMunch,
      DDBEncounters,
      DDBHelper: lib.DDBHelper,
      DDBItemImporter: lib.DDBItemImporter,
      DDBMacros,
      DDBMonster,
      DDBMonsterFactory,
      DDBProxy: lib.DDBProxy,
      DDBSummonsManager,
      DialogHelper: lib.DialogHelper,
      DirectoryPicker: lib.DirectoryPicker,
      FileHelper: lib.FileHelper,
      MuncherSettings: lib.MuncherSettings,
      NameMatcher: lib.NameMatcher,
      OriginFixer: lib.OriginFixer,
      Crosshairs: lib.Crosshairs,
      Enrichers,
    },
    settings: {
      muncherSettings: lib.MuncherSettings.getMuncherSettings,
      characterSettings: lib.MuncherSettings.getCharacterImportSettings,
    },

    // base64Check: base64Check,
    checkCobalt: lib.Secrets.checkCobalt,
    resetProxy: lib.DDBProxy.resetProxy,
    resetSecrets,

    generateAdventureConfig,
    downloadAdventureConfig,

    importCharacter, // imports an actor
    importCharacterById, // imports and actor by id
    updateDDBCharacter, // updates an actor back to ddb

    // bulk update
    updateAllPCs: {
      foundry: updateFoundryCharacters,
      ddb: updateDDBCharacters,
    },

    parse: {
      monsters: parseCritters,
      vehicles: parseTransports,
      feats: getFeats,
      items: parseItems,
      spells: parseSpells,
    },

    prices: {
      generateXgtePrices: updateItemPrices,
      calculateXgtePrice: calculatePrice,
    },

    updateWorldMonsters,

    getIconPath: lib.Iconizer.iconPath,
    iconPath: lib.Iconizer.iconPath,
    generateIcon: lib.Iconizer.generateIcon,

    importCacheLoad: lib.DDBReferenceLinker.importCacheLoad,
    getNPCImage,
    resetCompendiumActorImages,

    generateItemMacroFlag: DDBMacros.generateItemMacroFlag,
    EffectHelper: DDBEffectHelper,
    DialogHelper: lib.DialogHelper,
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
      executeSimpleMacro: DDBSimpleMacro.execute,
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
      utils: lib.utils,
      lib,
      importCacheLoad: lib.DDBReferenceLinker.importCacheLoad,
    },
    DICTIONARY: config.DICTIONARY,
  };

  globalThis['DDBImporter'] = API;
  game.modules.get(config.SETTINGS.MODULE_ID).api = API;
  game.modules.get(config.SETTINGS.MODULE_ID).DICTIONARY = config.DICTIONARY;
}