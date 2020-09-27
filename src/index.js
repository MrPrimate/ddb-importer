import {
  init,
  onReady,
  onceReady,
  renderSidebarTab,
  renderJournalSheet,
  renderPLayerList,
  renderNoteConfig,
} from "./hooks.js";
import extendSceneNavigationContext from "./hooks/getSceneNavigationContext/extendSceneNavigationContext.js";

CONFIG.debug.hooks = false;
// register hooks
Hooks.once("init", init);
Hooks.once("ready", onceReady);
Hooks.on("ready", onReady);
Hooks.on("renderSidebarTab", renderSidebarTab);
Hooks.on("renderJournalSheet", renderJournalSheet);
Hooks.on("getSceneNavigationContext", extendSceneNavigationContext);
Hooks.on("renderPlayerList", renderPLayerList);
Hooks.on("renderNoteConfig", renderNoteConfig);
