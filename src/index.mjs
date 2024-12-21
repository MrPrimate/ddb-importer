import {
  init,
  onReady,
  onceReady,
  renderItemSheet,
  renderJournalSheet,
  renderScenesTab,
  renderCompendiumTab,
} from "./hooks.mjs";
import extendSceneNavigationContext from "./hooks/navigationContext/extendSceneNavigationContext.js";

// register hooks
Hooks.once("init", init);
Hooks.once("ready", onceReady);
Hooks.on("ready", onReady);
Hooks.on("renderSceneDirectory", renderScenesTab);
Hooks.on("renderCompendiumDirectory", renderCompendiumTab);
Hooks.on("renderJournalPageSheet", renderJournalSheet);
Hooks.on("renderItemSheet", renderItemSheet);
Hooks.on("getSceneNavigationContext", extendSceneNavigationContext);
Hooks.on("getSceneDirectoryEntryContext", extendSceneNavigationContext);

// console.warn("SILENT MODE FOR DEBUG");
// const includeRgx = new RegExp("/module/ddb-importer/");
// CONFIG.compatibility.includePatterns.push(includeRgx);
