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

export async function loadMacroFile(type, fileName, forceLoad = false) {
  const embedMacros = game.settings.get("ddb-importer", "embed-macros");
  logger.debug(`Getting macro for ${type} ${fileName}`);
  const fileExists = forceLoad
    ? true
    : await utils.fileExists(`[data] modules/ddb-importer/macros/${type}s`, fileName);

  let data;
  if (fileExists && (forceLoad || embedMacros)) {
    const url = await utils.getFileUrl(`[data] modules/ddb-importer/macros/${type}s`, fileName);
    const response = await fetch(url, { method: "GET" });
    data = await response.text();
  } else if (fileExists && !embedMacros) {
    data = `// Execute DDB Importer dynamic macro\nDDBImporter.executeDDBMacro("${type}", "${fileName}", ...args);`;
  }
  return data;
}

export function generateItemMacroFlag(document, macroText) {
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

export async function createMacro({ name, content, img, isGM, isTemp }) {
  const macroFolder = isTemp
    ? undefined
    : game.folders.find((folder) => folder.data.name === "DDB Macros" && folder.data.type === "Macro");

  const data = {
    "name": name,
    "type": "script",
    "img": img ? img : "icons/svg/dice-target.svg",
    "scope": "global",
    "command": content,
    "folder": macroFolder ? macroFolder.id : undefined,
    "flags": {
      "advanced-macros": {
        "runAsGM": isGM
      },
    }
  };

  const existingMacro = game.macros.find((m) => m.name == name);
  if (existingMacro) data._id = existingMacro.id;
  const macro = existingMacro
    ? existingMacro.update(data)
    : Macro.create(data, {
      temporary: isTemp,
      displaySheet: false,
    });

  return macro;

}

async function createGMMacro(name, content, img) {
  return createMacro({ name, content, img, isGM: true, isTemp: false });
}

export async function createGMMacros() {
  await checkMacroFolder();
  const gmMacroText = await loadMacroFile("gm", "darkness.js");
  await createGMMacro("Darkness (DDB - GM)", gmMacroText, "systems/dnd5e/icons/skills/shadow_10.jpg");
}


export async function executeDDBMacro(type, fileName, ...params) {
  if (!fileName.endsWith(".js")) fileName = `${fileName}.js`;
  let macro = CONFIG.DDBI.MACROS[type]?.[fileName];
  if (!macro) {
    const macroText = await loadMacroFile(type, fileName, true);
    if (!macroText) {
      ui.notifications.error(`Unable to load macro (${type}) ${fileName}`);
      logger.warn(`Unable to load macro (${type}) ${fileName}`);
      throw new Error(`Unable to load macro (${type}) ${fileName}`);
    }

    // eslint-disable-next-line require-atomic-updates
    macro = await createMacro({ name: `${type} ${fileName}`, content: macroText, img: null, isGM: false, isTemp: true });
    // eslint-disable-next-line require-atomic-updates
    CONFIG.DDBI.MACROS[type][fileName] = macro;
    logger.debug(`Macro (${type}) ${fileName} loaded`, macro);
  }

  logger.debug(`Calling (${type}) ${fileName} with params`, ...params);
  macro.execute(...params);
}
