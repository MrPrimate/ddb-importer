import utils from "./utils.js";

import EventPort from "./messaging/index.js";
// import OutgoingCommunication from "./messaging/outgoing.js";

// init hooks
import setupLogging from "./hooks/init/setupLogging.js";

// ready hooks
import registerSheets from "./hooks/ready/registerSheets.js";
import checkCompendiums from "./hooks/ready/checkCompendiums.js";
import registerGameSettings from "./hooks/ready/registerGameSettings.js";

// other hooks
import addFolderLabel from "./hooks/renderSidebarTab/addFolderLabel.js";
// import showPopup from "./popup.js";
import checkVersion from "./hooks/init/checkVersion.js";
import displayConnectionIndicator from "./hooks/renderPlayerList/displayConnectionIndicator.js";

// renderNoteConfig
import addNumberedIcons from "./hooks/renderNoteConfig/addNumberedIcons.js";

// socket messaging
import onSocketMessage from "./hooks/socket/onSocketMessage.js";

// monster muncher
import addMonsterMuncher from "./hooks/renderMonsterMuncher/addMonsterMuncher.js";


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

  // check for the running version
  checkVersion();

  // delay the startup just a tiny little bit
  setTimeout(() => {
    utils.log("Starting EventPort", "messaging");
    let port = new EventPort();
    port.start();

    // let com = OutgoingCommunication(port);

    // register the D&DBeyond Button on the character sheets
    registerSheets();

    // send a notification to dndbeyond that it should update the actor data
    // Hooks.on("preUpdateActor", com.updateActorHP);

    // showPopup();//.then(() => tutorialSetup());
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
  addMonsterMuncher(app, html);
}

export function renderPlayerList(app, html) {
  displayConnectionIndicator(app, html);
}

export function renderNoteConfig(app, html, data) {
  addNumberedIcons(app, html, data);
}


