import {
  init,
  onReady,
  onceReady,
  renderSidebarTab,
  renderJournalSheet,
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
Hooks.on("getSceneDirectoryEntryContext", extendSceneNavigationContext);
