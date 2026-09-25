import {
  init,
  setup,
  onReady,
  onceReady,
  renderJournalSheet,
  renderJournalEntryPageSheet,
  renderCompendiumTab,
  getSceneControlButtons,
  itemsCompendiumUpdateComplete,
  characterProcessDataComplete,
} from "./hooks";
import extendSceneNavigationContext from "./hooks/navigationContext/extendSceneNavigationContext";
import addMetaDataIndicators from "./hooks/renderSceneDirectory/metaDataIndicator";
import { getHeaderControlsJournalEntrySheetButtons, getJournalSheet5eHeaderButtons } from "./hooks/renderJournalSheet/adventure";
import activateMetaNote from "./hooks/canvas/activateMetaNote";


export const setAllRenderFlags = () => {
  canvas.notes?.setAllRenderFlags({ refreshState: true });
};

Hooks.on<"canvasReady">("canvasReady", setAllRenderFlags);

// register hooks
Hooks.once<"init">("init", init);
Hooks.once<"setup">("setup", setup);
Hooks.once<"ready">("ready", onceReady);
Hooks.on<"ready">("ready", onReady);
Hooks.on<"renderCompendiumDirectory">("renderCompendiumDirectory", renderCompendiumTab);
Hooks.on<"renderJournalPageSheet">("renderJournalPageSheet", renderJournalSheet);
Hooks.on<"renderJournalEntryPageSheet">("renderJournalEntryPageSheet", renderJournalEntryPageSheet);
Hooks.on<"getSceneNavigationContext">("getSceneNavigationContext", extendSceneNavigationContext);
Hooks.on<"getSceneContextOptions">("getSceneContextOptions", extendSceneNavigationContext);
Hooks.on<"getSceneDirectoryEntryContext">("getSceneDirectoryEntryContext", extendSceneNavigationContext);
Hooks.on<"renderSceneDirectory">("renderSceneDirectory", addMetaDataIndicators);
Hooks.on<"getJournalSheet5eHeaderButtons">(
  "getJournalSheet5eHeaderButtons",
  getJournalSheet5eHeaderButtons,
);
Hooks.on<"getHeaderControlsJournalEntrySheet">(
  "getHeaderControlsJournalEntrySheet",
  getHeaderControlsJournalEntrySheetButtons,
);
Hooks.on<"activateNote">("activateNote", activateMetaNote);
Hooks.on<"getSceneControlButtons">("getSceneControlButtons", getSceneControlButtons);
Hooks.on<"ddb-importer.itemsCompendiumUpdateComplete">(
  "ddb-importer.itemsCompendiumUpdateComplete",
  itemsCompendiumUpdateComplete,
);
Hooks.on<"ddb-importer.characterProcessDataComplete">(
  "ddb-importer.characterProcessDataComplete",
  characterProcessDataComplete,
);

// console.warn("SILENT MODE FOR DEBUG");
// const includeRgx = new RegExp("/module/ddb-importer/");
// CONFIG.compatibility.includePatterns.push(includeRgx);

// Hooks.on("ddb-importer.monsterAddToCompendiumComplete", (data) => {
//   console.warn("HOOK Importer: Monster import complete", data);
// });

// Hooks.on(`ddb-importer.itemsCompendiumUpdateComplete`, (data) => {
//   console.warn(`HOOK Importer: Item compendium update complete`, data);
// });
