import utils from "../utils.js";
import logger from "../logger.js";

export function configureDependencies() {
  // allow item use macros on items
  let midiQOLSettings = game.settings.get("midi-qol", "ConfigSettings");
  if (!midiQOLSettings.allowUseMacro) {
    midiQOLSettings.allowUseMacro = true;
    game.settings.set("midi-qol", "ConfigSettings", midiQOLSettings);
  }

  // if dfreds status effects not added, add them
  let convenientEffectStatusSettings = game.settings.get("dfreds-convenient-effects", "modifyStatusEffects");
  if (!convenientEffectStatusSettings || convenientEffectStatusSettings === "none") {
    game.settings.set("dfreds-convenient-effects", "modifyStatusEffects", "add");
  }

  return true;
}

export async function loadMacroFile(type, fileName) {
  logger.debug(`Getting macro for ${type} ${fileName}`);
  const fileExists = await utils.fileExists(`[data] modules/ddb-importer/macros/${type}s`, fileName);

  let data;
  if (fileExists) {
    const url = await utils.getFileUrl(`[data] modules/ddb-importer/macros/${type}s`, fileName);
    const response = await fetch(url, { method: "GET" });
    data = await response.text();
  }
  return data;
}

export function generateMacroFlags(document, macroText) {
  return {
    macro: {
      data: {
        name: document.name,
        type: "script",
        scope: "global",
        command: macroText,
      },
      options: {},
      apps: {},
      compendium: null,
    },
  };
}

export function generateMacroChange(macroValues, priority = 20) {
  return {
    key: "macro.itemMacro",
    value: macroValues,
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: priority,
  };
}
