// for exports
import { lib, config } from "./_module";
import DDBMonster from "./parser/DDBMonster";
import DDBMonsterFactory from "./parser/DDBMonsterFactory";
import { parseSpells } from "./muncher/spells";
import DDBItemsImporter from "./muncher/DDBItemsImporter";
import { updateWorldMonsters, resetCompendiumActorImages, parseCritters, parseTransports } from "./muncher/tools";
import DDBSelectiveMonsterUpdate from "./apps/DDBSelectiveMonsterUpdate";
import DDBEncounterFactory from "./parser/DDBEncounterFactory";
import { generateAdventureConfig, downloadAdventureConfig } from "./muncher/adventure";
import { updateDDBCharacter } from "./updater/character";
import DDBCharacterManager from "./apps/DDBCharacterManager";
import { External, DDBEffectHelper, AuraAutomations } from "./effects/_module";
import DDBCompanion2014 from "./parser/companions/DDBCompanion2014";
import DDBCompanionFactory from "./parser/companions/DDBCompanionFactory";
import { calculatePrice, updateItemPrices } from "./muncher/prices";
import DDBSummonsManager from "./parser/companions/DDBSummonsManager";
import * as Enrichers from "./parser/enrichers/_module";
import * as Activities from "./parser/activities/_module";
import * as ParserLib from "./parser/lib/_module";
import DDBSummonsInterface from "./parser/companions/DDBSummonsInterface";
import { isEqual, uniq } from "../vendor/lowdash/_module.mjs";
import DDBCharacterImporter from "./muncher/DDBCharacterImporter";
import DDBDebugger from "./apps/DDBDebugger";
import AdventureMunch from "./muncher/adventure/AdventureMunch";
import { DDBMonsterDamage } from "./parser/monster/features/DDBMonsterDamage";
import DDBMonsterFeature from "./parser/monster/features/DDBMonsterFeature";
import { createStorage } from "./hooks/ready/storage";
import DDBKeyChangeDialog from "./apps/DDBKeyChangeDialog";
import { migrateJournalsToDDBSheet } from "./hooks/ready/migration/migration_5_6_0_journals";
import { migration } from "./hooks/ready/migraton";
import SpellListFactory from "./parser/spells/SpellListFactory";
import DDBSpellListFactory from "./parser/spells/DDBSpellListFactory";
import DDBMuleHandler from "./muncher/DDBMuleHandler";
import DDBCharacter from "./parser/DDBCharacter";
import DDBVehicle from "./parser/DDBVehicle";
import DDBVehicleFactory from "./parser/DDBVehicleFactory";
import DDBPartyInventoryImporter from "./muncher/DDBPartyInventoryImporter";
import DDBPartyInventory from "./muncher/DDBPartyInventory";
import DDBPartySync from "./apps/DDBPartySync";
// import { libWrapper } from "../vendor/libwrapper/shim";

function resetSecrets() {
  game.settings.set("ddb-importer", "cobalt-cookie-local", false);
  game.settings.set("ddb-importer", "cobalt-cookie", "");
  game.settings.set("ddb-importer", "campaign-id", "");
}


function migrateAllCompendiums(value, _key, _map) {
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

async function updateFoundryCharacters(debug = false) {
  for (const actor of game.actors.values()) {
    const ddbImported = "ddbimporter" in actor.flags;
    if (ddbImported && actor.type === "character") {
      lib.logger.info(`Updating ${actor.name} from DDB`);
      if (debug) lib.logger.error(`Importing ${actor.name} from DDB`, { actor });
      await DDBCharacterImporter.importCharacter({ actor });
    }
  }
}

async function updateDDBCharacters(debug = false) {
  for (const actor of game.actors.values()) {
    const ddbImported = "ddbimporter" in actor.flags;
    if (ddbImported && actor.type === "character") {
      lib.logger.info(`Updating ${actor.name} to DDB`);
      if (debug) lib.logger.error(`Updating ${actor.name} to DDB`, { actor });
      await updateDDBCharacter(actor);
    }
  }
}

export function registerApi() {
  const API = {
    // libWrapper,
    migrations: {
      migrateCompendiums,
      migrateJournalsToDDBSheet,
      migration,
    },
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
    apps: {
      DDBDebugger,
      DDBCharacterManager,
      AdventureMunch: AdventureMunch,
      DDBKeyChangeDialog: DDBKeyChangeDialog,
      DDBDebug: lib.DDBDebug,
      DDBPartySync,
    },
    lib: {
      CPRHelper: External.ChrisPremadesHelper,
      ChrisPremadesHelper: External.ChrisPremadesHelper,
      CompendiumHelper: lib.CompendiumHelper,
      DDBCampaigns: lib.DDBCampaigns,
      DDBPartyInventory,
      DDBCompanion2014,
      DDBCompanionFactory,
      DDBCharacter: DDBCharacter,
      // Companions,
      DDBCompendiumFolders: lib.DDBCompendiumFolders,
      DDBSimpleMacro: lib.DDBSimpleMacro,
      DDBEffectHelper,
      DDBEncounterFactory,
      DDBSources: lib.DDBSources,
      DDBItemImporter: lib.DDBItemImporter,
      DDBMacros: lib.DDBMacros,
      DDBMonster,
      DDBMonsterFactory,
      DDBVehicle,
      DDBVehicleFactory,
      DDBMonsterFeature,
      DDBMonsterDamage,
      DDBProxy: lib.DDBProxy,
      DDBSummonsManager,
      DDBSummonsInterface,
      DialogHelper: lib.DialogHelper,
      FileHelper: lib.FileHelper,
      MuncherSettings: lib.MuncherSettings,
      NameMatcher: lib.NameMatcher,
      OriginFixer: lib.OriginFixer,
      Crosshairs: lib.Crosshairs,
      Enrichers,
      Activities,
      ParserLib,
      DDBDebug: lib.DDBDebug,
      SpellLists: {
        SpellListFactory,
        DDBSpellListFactory,
      },
      RuleFactory: ParserLib.DDBRuleJournalFactory,
      DDBMuleHandler,
    },
    settings: {
      muncherSettings: lib.MuncherSettings.getMuncherSettings,
      characterSettings: lib.MuncherSettings.getCharacterImportSettings,
    },

    checkCobalt: lib.Secrets.checkCobalt,
    resetProxy: lib.DDBProxy.resetProxy,
    getDDBUserData: lib.Secrets.getUserData,
    resetSecrets,

    generateAdventureConfig,
    downloadAdventureConfig,

    importCharacter: DDBCharacterImporter.importCharacter, // imports an actor
    importCharacterById: DDBCharacterImporter.importCharacterById, // imports and actor by id
    updateDDBCharacter, // updates an actor back to ddb

    // bulk update
    updateAllPCs: {
      foundry: updateFoundryCharacters,
      ddb: updateDDBCharacters,
    },

    parse: {
      monsters: parseCritters,
      vehicles: parseTransports,
      items: DDBItemsImporter.fetchAndImportItems,
      spells: parseSpells,
    },

    party: {
      pullInventory: DDBPartyInventoryImporter.pull,
      moveItemToParty: DDBPartyInventoryImporter.moveItemToParty,
      moveItemToCharacter: DDBPartyInventoryImporter.moveItemToCharacter,
      deleteItem: DDBPartyInventoryImporter.deleteItem,
      findOrCreateActor: DDBPartyInventoryImporter.findOrCreatePartyActor,
      applyToActor: DDBPartyInventoryImporter.applyToActor,
      Importer: DDBPartyInventoryImporter,
      openSync: DDBPartySync.open,
      Sync: DDBPartySync,
    },

    prices: {
      generateXgtePrices: updateItemPrices,
      calculateXgtePrice: calculatePrice,
    },

    updateWorldMonsters,
    DDBSelectiveMonsterUpdate,

    getIconPath: lib.Iconizer.iconPath,
    iconPath: lib.Iconizer.iconPath,
    generateIcon: lib.Iconizer.generateIcon,

    importCacheLoad: ParserLib.DDBReferenceLinker.importCacheLoad,
    resetCompendiumActorImages,
    createStorage,

    generateItemMacroFlag: lib.DDBMacros.generateItemMacroFlag,
    EffectHelper: DDBEffectHelper,
    DialogHelper: lib.DialogHelper,
    effects: {
      helpers: DDBEffectHelper,
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
      AuraAutomations,
    },
    executeDDBMacro: lib.DDBMacros.executeDDBMacro,
    // macro tools
    macros: {
      createMacro: lib.DDBMacros.createMacro,
      executeMacro: lib.DDBMacros.executeDDBMacro,
      getMacroFunction: lib.DDBMacros.getMacroFunction,
      loadMacroFile: lib.DDBMacros.loadMacroFile,
      getMacro: lib.DDBMacros.getMacro,
      executeSimpleMacro: lib.DDBSimpleMacro.execute,
    },
    debug: {
      start: debugStart,
      stop: debugStop,
      test: testFunction,
      simpleTest: simpleTest,
      utils: lib.utils,
      lib,
      importCacheLoad: ParserLib.DDBReferenceLinker.importCacheLoad,
      lowdash: {
        isEqual,
        uniq,
      },
    },
    DICTIONARY: config.DICTIONARY,
    SETTINGS: config.SETTINGS,
  };

  globalThis["DDBImporter"] = API;
  game.modules.get(config.SETTINGS.MODULE_ID).api = API;
  game.modules.get(config.SETTINGS.MODULE_ID).DICTIONARY = config.DICTIONARY;
}
