import "./hooks/init/extendClasses.js";
import { logger, Logger, Notifications } from "./lib/_module.mjs";

// init hooks
import { registerApi } from "./api.mjs";
import { chatHooks } from "./hooks/init/chatHooks.js";
import adventureImporter from "./hooks/init/adventureImporter.js";
import { registerJournalSheet } from "./hooks/renderJournalSheet/DDBJournalSheet.js";

// ready hooks
import registerSheets from "./hooks/ready/registerSheets.js";
import checkCompendiums from "./hooks/ready/checkCompendiums.js";
import registerGameSettings from "./hooks/ready/registerGameSettings.js";
import { itemSheets } from "./hooks/ready/items.js";
import checkVersion from "./hooks/ready/checkVersion.js";
import { loadDDBConfig } from "./hooks/ready/ddbConfig.js";
import { anchorInjection } from "./hooks/ready/anchorInjection.js";
import { setupUpdateCreatedOrigins } from "./hooks/ready/originFixing.js";
import DDBEffectHooks from "./hooks/init/DDBEffectHooks.js";

// monster muncher
import { earlySettings } from "./hooks/init/settings.js";
import { addMuncher } from "./hooks/renderMuncher/addMuncher.js";

// socket messaging
import { setupSockets } from "./hooks/socket/sockets.js";

// image hooks
import { linkTables } from "./hooks/renderJournalSheet/linkTables.js";
import { linkImages } from "./hooks/renderJournalSheet/linkImages.js";
import { adventureFlags } from "./hooks/renderJournalSheet/adventure.js";
import { showReadAlouds } from "./hooks/renderJournalSheet/linkReadAlouds.js";

import { activateUpdateHooks } from "./updater/character.js";
import { registerCustomEnrichers } from "./hooks/ready/enrichers.js";
import addActivitiesHooks from "./hooks/macroActivity/loadActivity.js";
import { DDBEnhancers } from "./effects/_module.mjs";
import { addTattooConsumable } from "./hooks/tattoo/main.mjs";
import welcomeMessage from "./hooks/ready/welcomeMessage.js";
import { migration } from "./hooks/init/migraton.js";
// import { createStorage } from "./hooks/ready/storage.mjs";

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

export function renderItemSheet(sheet, html) {
  linkTables("item", html);
  // link images disabled un v10
  // linkImages(html);
}

export function renderJournalSheet(sheet, html, data) {
  if (data.cssClass !== "editable") {
    if (sheet.document.flags?.ddb) {
      linkTables("journal", html);
      linkImages(html, data);
    }

    const enableReadAloudsForAllContent = game.settings.get("ddb-importer", "show-read-alouds-all-content");
    if (sheet.document.flags?.ddb || enableReadAloudsForAllContent) {
      showReadAlouds(html, data);
    }
  }
  adventureFlags(sheet, html, data);
}

export function renderJournalEntryPageSheet(sheet, html, data) {
  if (sheet.options.mode === "view") {
    if (sheet.document.flags?.ddb) {
      linkTables("journal", html);
      linkImages(html, data);
    }

    const enableReadAloudsForAllContent = game.settings.get("ddb-importer", "show-read-alouds-all-content");
    if (sheet.document.flags?.ddb || enableReadAloudsForAllContent) {
      showReadAlouds(html, data);
    }
  }
  adventureFlags(sheet, html, data);
}

