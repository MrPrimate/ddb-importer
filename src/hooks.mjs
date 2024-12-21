import "./hooks/init/extendClasses.js";
import { logger, Logger, Notifications } from "./lib/_module.mjs";

// init hooks
import { registerApi } from "./api.mjs";
import { chatHooks } from "./hooks/init/chatHooks.js";
import adventureImporter from "./hooks/init/adventureImporter.js";

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
import { addEncounterMuncher } from "./hooks/renderMuncher/addEncounterMuncher.js";

// socket messaging
import { setupSockets } from "./hooks/socket/sockets.js";

// image hooks
import { linkTables } from "./hooks/renderJournalSheet/linkTables.js";
import { linkImages } from "./hooks/renderJournalSheet/linkImages.js";
import adventureFlags from "./hooks/renderJournalSheet/adventure.js";
import { showReadAlouds } from "./hooks/renderJournalSheet/linkReadAlouds.js";

import { activateUpdateHooks } from "./updater/character.js";
import { registerCustomEnrichers } from "./hooks/ready/enrichers.js";
import DDBSummonsManager from "./parser/companions/DDBSummonsManager.mjs";
import addActivitiesHooks from "./hooks/macroActivity/loadActivity.js";
import { DDBEnhancers } from "./effects/_module.mjs";

// foundry is initializing
export function init() {
  earlySettings();
  Logger.setupLogger();
  registerApi();
  chatHooks();
  adventureImporter();
  logger.info("Init complete");
  DDBEffectHooks.loadHooks();
  registerCustomEnrichers();
  addActivitiesHooks();
}

// foundry is ready
export async function onceReady() {
  // register the game settings
  await registerGameSettings();

  // check for valid compendiums
  await checkCompendiums();
  DDBEnhancers.loadEnhancers();
  await DDBSummonsManager.generateFixedSummons();

  // notifications
  Notifications.registerNotifications();
  loadDDBConfig();

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
  logger.info("OnceReady complete");
}

export function onReady() {
  setupSockets();
}

export function renderCompendiumTab(app, [html], _data) {
  addMuncher(app, html);
}

export function renderScenesTab(app, [html], _data) {
  addEncounterMuncher(app, html);
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
