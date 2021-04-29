import utils from "./utils.js";

// import EventPort from "./messaging/index.js";

// init hooks
import setupLogging from "./hooks/init/setupLogging.js";

// ready hooks
import registerSheets from "./hooks/ready/registerSheets.js";
import checkCompendiums from "./hooks/ready/checkCompendiums.js";
import registerGameSettings from "./hooks/ready/registerGameSettings.js";
import { itemSheets } from "./hooks/ready/items.js";

// other hooks
import addFolderLabel from "./hooks/renderSidebarTab/addFolderLabel.js";

// socket messaging
import onSocketMessage from "./hooks/socket/onSocketMessage.js";

// monster muncher
import { addMuncher } from "./hooks/renderMuncher/addMuncher.js";

// image hooks
import linkImages from "./hooks/renderJournalSheet/linkImages.js";
import adventureFlags from "./hooks/renderJournalSheet/adventure.js";

import registerNotifications from "./lib/Notification.js";


// foundry is initializing
export function init() {
  setupLogging();
  utils.log("Init");
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
    // utils.log("Starting EventPort", "messaging");
    // let port = new EventPort();
    // port.start();

    // let com = OutgoingCommunication(port);

    // register the D&DBeyond Button on the character sheets
    registerSheets();
    itemSheets();

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
  addFolderLabel(html);
  addMuncher(app, html);
}

// eslint-disable-next-line no-unused-vars
export function renderJournalSheet(sheet, html, data) {
  linkImages(html);
  adventureFlags(sheet, html, data);
}
