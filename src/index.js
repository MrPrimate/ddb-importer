import {
  init,
  onReady,
  onceReady,
  renderSidebarTab,
  renderItemSheet,
  renderJournalSheet,
} from "./hooks.js";
import extendSceneNavigationContext from "./hooks/getSceneNavigationContext/extendSceneNavigationContext.js";

// register hooks
Hooks.once("init", init);
Hooks.once("ready", onceReady);
Hooks.on("ready", onReady);
Hooks.on("renderSidebarTab", renderSidebarTab);
Hooks.on("renderJournalSheet", renderJournalSheet);
Hooks.on("renderItemSheet", renderItemSheet);
Hooks.on("getSceneNavigationContext", extendSceneNavigationContext);
Hooks.on("getSceneDirectoryEntryContext", extendSceneNavigationContext);
