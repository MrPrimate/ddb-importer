import {
  init,
  onReady,
  onceReady,
  renderJournalSheet,
  renderJournalEntryPageSheet,
  renderCompendiumTab,
} from "./hooks.mjs";
import extendSceneNavigationContext from "./hooks/navigationContext/extendSceneNavigationContext.js";
import { getHeaderControlsJournalEntrySheetButtons, getJournalSheet5eHeaderButtons } from "./hooks/renderJournalSheet/adventure.js";

// register hooks
Hooks.once("init", init);
Hooks.once("ready", onceReady);
Hooks.on("ready", onReady);
Hooks.on("renderCompendiumDirectory", renderCompendiumTab);
Hooks.on("renderJournalPageSheet", renderJournalSheet);
Hooks.on("renderJournalEntryPageSheet", renderJournalEntryPageSheet);
Hooks.on("getSceneNavigationContext", extendSceneNavigationContext);
Hooks.on("getSceneContextOptions", extendSceneNavigationContext);
Hooks.on("getSceneDirectoryEntryContext", extendSceneNavigationContext);
Hooks.on("getJournalSheet5eHeaderButtons", getJournalSheet5eHeaderButtons);
Hooks.on("getHeaderControlsJournalEntrySheet", getHeaderControlsJournalEntrySheetButtons);

// console.warn("SILENT MODE FOR DEBUG");
// const includeRgx = new RegExp("/module/ddb-importer/");
// CONFIG.compatibility.includePatterns.push(includeRgx);

// Hooks.on("ddb-importer.characterProcessDataComplete", (data) => {
//   console.warn("HOOK Importer: Character import complete", data);
// });

// Hooks.on("ddb-importer.monsterAddToCompendiumComplete", (data) => {
//   console.warn("HOOK Importer: Monster import complete", data);
// });

// Hooks.on(`ddb-importer.itemsCompendiumUpdateComplete`, (data) => {
//   console.warn(`HOOK Importer: Item compendium update complete`, data);
// });
