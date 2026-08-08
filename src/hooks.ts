import "./hooks/init/extendClasses";
import { logger, Logger, Notifications, utils } from "./lib/_module";

// init hooks
import { registerApi } from "./api";
import { chatHooks } from "./hooks/init/chatHooks";
import adventureImporter from "./hooks/init/adventureImporter";
import { registerJournalSheet } from "./hooks/renderJournalSheet/DDBJournalSheet";

// ready hooks
import registerSheets from "./hooks/ready/registerSheets";
import checkCompendiums from "./hooks/ready/checkCompendiums";
import registerGameSettings from "./hooks/ready/registerGameSettings";
import { itemSheets } from "./hooks/ready/items";
import checkVersion from "./hooks/ready/checkVersion";
import { loadDDBConfig } from "./hooks/ready/ddbConfig";
import { anchorInjection } from "./hooks/ready/anchorInjection";
import { setupUpdateCreatedOrigins } from "./hooks/ready/originFixing";
import DDBEffectHooks from "./hooks/init/DDBEffectHooks";

// monster muncher
import { earlySettings } from "./hooks/init/settings";
import { addMuncher } from "./hooks/renderMuncher/addMuncher";
import { addStickerBrowserControl } from "./hooks/getSceneControlButtons/addStickerBrowser";

// socket messaging
import { setupSockets } from "./hooks/socket/sockets";

// image hooks
import { adventureFlags } from "./hooks/renderJournalSheet/adventure";
import { showReadAlouds } from "./hooks/renderJournalSheet/linkReadAlouds";

import { activateUpdateHooks } from "./updater/character";
import { registerCustomEnrichers } from "./hooks/ready/enrichers";
import addActivitiesHooks from "./hooks/macroActivity/loadActivity";
import { DDBEnhancers } from "./effects/_module";
import { addTattooConsumable } from "./hooks/tattoo/main";
import { registerTokenizer2FrameLoader } from "./hooks/init/tokenizer2Frames";
import welcomeMessage from "./hooks/ready/welcomeMessage";
import { migration } from "./hooks/ready/migraton";
import { multiSelectHover } from "./hooks/ready/multiSelectHover";
import { DDBToolProficiencies } from "./lib/_module";
// import { createStorage } from "./hooks/ready/storage";

// foundry is initializing
export function init() {
  earlySettings();
  Logger.setupLogger();
  registerJournalSheet();
  registerApi();
  chatHooks();
  adventureImporter();
  DDBEffectHooks.loadHooks();
  registerCustomEnrichers();
  addActivitiesHooks();
  addTattooConsumable();
  registerTokenizer2FrameLoader();
  logger.info("Init complete");
}

// foundry has localized the system config, but nothing has rendered yet
export function setup() {
  DDBToolProficiencies.registerDictionaryTools();
  logger.info("Setup complete");
}

// foundry is ready
export async function onceReady() {
  // register the game settings
  await registerGameSettings();

  // await createStorage();

  // check for valid compendiums
  await checkCompendiums();
  await DDBToolProficiencies.syncCompendiumItems();
  DDBEnhancers.loadEnhancers();
  multiSelectHover();

  // notifications
  Notifications.registerNotifications();
  await loadDDBConfig();

  await migration();

  // delay the startup just a tiny little bit
  setTimeout(() => {
    checkVersion();
    // register the D&DBeyond Button on the character sheets
    registerSheets();
    itemSheets();
    setupUpdateCreatedOrigins();
    activateUpdateHooks();
  }, 500);

  anchorInjection();
  welcomeMessage();
  logger.info("OnceReady complete");
}

export function onReady() {
  setupSockets();
}

export const renderCompendiumTab: Hooks.Function<"renderCompendiumDirectory"> = (app, html) => {
  addMuncher(app, html);
};

export const getSceneControlButtons: Hooks.Function<"getSceneControlButtons"> = (controls) => {
  addStickerBrowserControl(controls);
};

// a munch may have brought in real items for tools we only had stubs for
// so relink and clear the stubs out
export const itemsCompendiumUpdateComplete: Hooks.Function<"ddb-importer.itemsCompendiumUpdateComplete"> = () => {
  DDBToolProficiencies.syncCompendiumItems().catch((error: unknown) => {
    logger.warn("Unable to sync D&D Beyond tool compendium items after an item import", { error });
  });
};

export const renderJournalSheet: Hooks.Function<"renderJournalPageSheet"> = (sheet, html, data) => {
  if (foundry.utils.getProperty(data, "cssClass") !== "editable") {
    const enableReadAloudsForAllContent = utils.getSetting<boolean>("show-read-alouds-all-content");
    if (sheet.document.flags?.ddb || enableReadAloudsForAllContent) {
      showReadAlouds(html, data);
    }
  }
  adventureFlags(sheet, html[0], data);
};

export const renderJournalEntryPageSheet: Hooks.Function<"renderJournalEntryPageSheet"> = (sheet, html, data) => {
  if (sheet.options.mode === "view") {
    const enableReadAloudsForAllContent = utils.getSetting<boolean>("show-read-alouds-all-content");
    if (sheet.document.flags?.ddb || enableReadAloudsForAllContent) {
      showReadAlouds(html, data);
    }

    adventureFlags(sheet, html, data);
  }
};

