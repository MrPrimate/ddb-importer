import utils from "../utils.js";
import logger from "../logger.js";

export async function checkMacroFolder() {
  const version = (game.version ?? game.data.version);
  const v9 = utils.versionCompare(version, "9.0") >= 0;
  if (v9) {
    const macroFolder = game.folders.find((folder) => folder.data.name === "DDB Macros" && folder.data.type === "Macro");

    if (!macroFolder) {
      await Folder.create({
        color: "#FF0000",
        name: "DDB Macros",
        parent: null,
        type: "Macro"
      });
    }
  }

}

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

async function createGMMacro(name, content, img) {
  const macroFolder = game.folders.find((folder) => folder.data.name === "DDB Macros" && folder.data.type === "Macro");

  const data = {
    "name": name,
    "type": "script",
    "img": img,
    "scope": "global",
    "command": content,
    "folder": macroFolder ? macroFolder.id : undefined,
    "flags": {
      "advanced-macros": {
        "runAsGM": true
      },
    }
  };

  const existingMacro = game.macros.find((m) => m.name == name);

  if (existingMacro) {
    data._id = existingMacro.id;
    await existingMacro.update(data);
  } else {
    await Macro.create(data);
  }

}

export async function createGMMacros() {
  await checkMacroFolder();
  const gmMacroText = await loadMacroFile("gm", "darkness.js");
  await createGMMacro("Darkness (DDB - GM)", gmMacroText, "systems/dnd5e/icons/skills/shadow_10.jpg");
}
