import "./hooks/init/extendClasses.js";
import logger, { setupLogger } from "./logger.js";

// init hooks
import { registerApi } from "./api.js";
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
import DDBEffectHooks from "./effects/DDBEffectHooks.js";

// monster muncher
import { earlySettings } from "./hooks/renderMuncher/earlySettings.js";
import { addMuncher } from "./hooks/renderMuncher/addMuncher.js";
import { addEncounterMuncher } from "./hooks/renderMuncher/addEncounterMuncher.js";

// socket messaging
import { setupSockets } from "./hooks/socket/sockets.js";

// image hooks
import { linkTables } from "./hooks/renderJournalSheet/linkTables.js";
import { linkImages } from "./hooks/renderJournalSheet/linkImages.js";
import adventureFlags from "./hooks/renderJournalSheet/adventure.js";
import { showReadAlouds } from "./hooks/renderJournalSheet/linkReadAlouds.js";

import registerNotifications from "./lib/Notification.js";

import { activateUpdateHooks } from "./updater/character.js";
import { registerCustomEnrichers } from "./hooks/ready/enrichers.js";
import DDBSummonsManager from "./parser/companions/DDBSummonsManager.js";


// foundry is initializing
export function init() {
  earlySettings();
  setupLogger();
  registerApi();
  chatHooks();
  adventureImporter();
  logger.info("Init complete");
  DDBEffectHooks.loadHooks();
  registerCustomEnrichers();
}

// foundry is ready
export async function onceReady() {
  // register the game settings
  await registerGameSettings();

  // check for valid compendiums
  checkCompendiums().then(() => {
    DDBSummonsManager.generateFixedSummons();
  });

  // notificaitons
  registerNotifications();
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

export function renderSidebarTab(app, html) {
  addEncounterMuncher(app, html);
  addMuncher(app, html);
}

export function renderItemSheet(sheet, html) {
  linkTables("item", html);
  // link images disabled un v10
  // linkImages(html);
}

export function renderJournalSheet(sheet, html, data) {
  if (data.cssClass !== "editable" && sheet.document.flags?.ddb) {
    linkTables("journal", html);
    linkImages(html, data);
    showReadAlouds(html, data);
  }
  adventureFlags(sheet, html, data);
}
