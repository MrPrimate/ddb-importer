import {
  init,
  onReady,
  onceReady,
  renderItemSheet,
  renderJournalSheet,
  renderJournalEntryPageSheet,
  renderScenesTab,
  renderCompendiumTab,
} from "./hooks.mjs";
import extendSceneNavigationContext from "./hooks/navigationContext/extendSceneNavigationContext.js";
import { getJournalSheet5eHeaderButtons } from "./hooks/renderJournalSheet/adventure.js";

// register hooks
Hooks.once("init", init);
Hooks.once("ready", onceReady);
Hooks.on("ready", onReady);
Hooks.on("renderSceneDirectory", renderScenesTab);
Hooks.on("renderCompendiumDirectory", renderCompendiumTab);
Hooks.on("renderJournalPageSheet", renderJournalSheet);
Hooks.on("renderJournalEntryPageSheet", renderJournalEntryPageSheet);
Hooks.on("renderItemSheet", renderItemSheet);
Hooks.on("getSceneNavigationContext", extendSceneNavigationContext);
Hooks.on("getSceneDirectoryEntryContext", extendSceneNavigationContext);
Hooks.on("getJournalSheet5eHeaderButtons", getJournalSheet5eHeaderButtons)

// console.warn("SILENT MODE FOR DEBUG");
// const includeRgx = new RegExp("/module/ddb-importer/");
// CONFIG.compatibility.includePatterns.push(includeRgx);
