import {
  init,
  onReady,
  onceReady,
  renderSidebarTab,
  renderPlayerList,
  renderNoteConfig,
} from "./hooks.js";

CONFIG.debug.hooks = false;
// register hooks
Hooks.once("init", init);
Hooks.once("ready", onceReady);
Hooks.on("ready", onReady);
Hooks.on("renderSidebarTab", renderSidebarTab);
Hooks.on("renderPlayerList", renderPlayerList);
Hooks.on("renderNoteConfig", renderNoteConfig);
