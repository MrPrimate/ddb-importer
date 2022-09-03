import logger from "./logger.js";

// init hooks
import setupLogging from "./hooks/init/setupLogging.js";
import { registerWindow } from "./hooks/init/window.js";
import { chatHooks } from "./hooks/init/chatHooks.js";

// ready hooks
import registerSheets from "./hooks/ready/registerSheets.js";
import checkCompendiums from "./hooks/ready/checkCompendiums.js";
import registerGameSettings from "./hooks/ready/registerGameSettings.js";
import { itemSheets } from "./hooks/ready/items.js";
import checkVersion from "./hooks/ready/checkVersion.js";
import { loadDDBConfig } from "./hooks/ready/ddbConfig.js";

// monster muncher
import { earlySettings } from "./hooks/renderMuncher/earlySettings.js";
import { addMuncher } from "./hooks/renderMuncher/addMuncher.js";
import { addEncounterMuncher } from "./hooks/renderMuncher/addEncounterMuncher.js";

// socket messaging
import { onSocketMessage } from "./hooks/socket/onSocketMessage.js";

// image hooks
import { linkTables } from "./hooks/renderJournalSheet/linkTables.js";
import { linkImages } from "./hooks/renderJournalSheet/linkImages.js";
import adventureFlags from "./hooks/renderJournalSheet/adventure.js";
import { showReadAlouds } from "./hooks/renderJournalSheet/linkReadAlouds.js";

import registerNotifications from "./lib/Notification.js";

import { activateUpdateHooks } from "./character/update.js";


// foundry is initializing
export function init() {
  setupLogging();
  registerWindow();
  chatHooks();
  logger.info("Init");
}

// foundry is ready
export function onceReady() {
  // register the game settings
  registerGameSettings();

  // check for valid compendiums
  checkCompendiums();

  // notificaitons
  registerNotifications();

  // delay the startup just a tiny little bit
  setTimeout(() => {
    // register the D&DBeyond Button on the character sheets
    registerSheets();
    itemSheets();
    checkVersion();
    loadDDBConfig();
    activateUpdateHooks();

  }, 500);
}

export function onReady() {
  game.socket.on("module.ddb-importer", (data) => {
    if (data.sender === game.user.data._id) {
      return;
    }

    const sender = game.users.get(data.sender);
    delete data.sender;
    onSocketMessage(sender, data);
  });
}

export function renderSidebarTab(app, html) {
  earlySettings();
  addEncounterMuncher(app, html);
  addMuncher(app, html);
}

export function renderItemSheet(sheet, html) {
  linkTables("item", html);
  // link images disabled un v10
  // linkImages(html);
}

export function renderJournalSheet(sheet, html, data) {
  if (data.cssClass !== "editable") {
    linkTables("journal", html);
    linkImages(html, data);
    showReadAlouds(html, data);
  }
  adventureFlags(sheet, html, data);
}
