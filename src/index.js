import {
  init,
  onReady,
  onceReady,
  renderSidebarTab,
  renderPLayerList,
  renderNoteConfig,
} from "./hooks.js";

CONFIG.debug.hooks = false;
// register hooks
Hooks.once("init", init);
Hooks.once("ready", onceReady);
Hooks.on("ready", onReady);
Hooks.on("renderSidebarTab", renderSidebarTab);
Hooks.on("renderPlayerList", renderPLayerList);
Hooks.on("renderNoteConfig", renderNoteConfig);
