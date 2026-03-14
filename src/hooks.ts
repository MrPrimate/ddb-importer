import "./hooks/init/extendClasses";
import { logger, Logger, Notifications } from "./lib/_module";

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
import welcomeMessage from "./hooks/ready/welcomeMessage";
import { migration } from "./hooks/ready/migraton";
import { multiSelectHover } from "./hooks/ready/multiSelectHover";
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
  logger.info("Init complete");
}

// foundry is ready
export async function onceReady() {
  // register the game settings
  await registerGameSettings();

  // await createStorage();

  // check for valid compendiums
  await checkCompendiums();
  DDBEnhancers.loadEnhancers();
  multiSelectHover();

  // notifications
  Notifications.registerNotifications();
  loadDDBConfig();

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

export function renderCompendiumTab(app, html, _data) {
  html = html instanceof HTMLElement ? html : html[0];
  addMuncher(app, html);
}

export function renderJournalSheet(sheet, html, data) {
  if (data.cssClass !== "editable") {
    const enableReadAloudsForAllContent = game.settings.get("ddb-importer", "show-read-alouds-all-content");
    if (sheet.document.flags?.ddb || enableReadAloudsForAllContent) {
      showReadAlouds(html, data);
    }
  }
  adventureFlags(sheet, html, data);
}

export function renderJournalEntryPageSheet(sheet, html, data) {
  if (sheet.options.mode === "view") {
    const enableReadAloudsForAllContent = game.settings.get("ddb-importer", "show-read-alouds-all-content");
    if (sheet.document.flags?.ddb || enableReadAloudsForAllContent) {
      showReadAlouds(html, data);
    }

    adventureFlags(sheet, html, data);
  }
}

