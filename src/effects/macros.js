import logger from "../logger.js";
import FileHelper from "../lib/FileHelper.js";
import SETTINGS from "../settings.js";
import { checkJB2a, createJB2aActors } from "./helpers.js";

export async function checkMacroFolder() {
  const macroFolder = game.folders.find((folder) => folder.name === "DDB Macros" && folder.type === "Macro");

  if (!macroFolder) {
    await Folder.create({
      color: "#FF0000",
      name: "DDB Macros",
      parent: null,
      type: "Macro"
    });
  }
}

export async function configureDependencies() {
  // allow item use macros on items
  if (game.modules.get("midi-qol")?.active) {
    let midiQOLSettings = game.settings.get("midi-qol", "ConfigSettings");
    if (!midiQOLSettings.allowUseMacro) {
      midiQOLSettings.allowUseMacro = true;
      game.settings.set("midi-qol", "ConfigSettings", midiQOLSettings);
    }
  } else {
    logger.error("Midi-QOL needs to be installed for effects");
    ui.notifications.warn("Midi-QOL needs to be installed for effects");
  }

  const useCEConditions = game.settings.get(SETTINGS.MODULE_ID, "apply-conditions-with-ce");
  // if dfreds status effects not added, add them
  if (game.modules.get("dfreds-convenient-effects")?.active && useCEConditions) {
    const convenientEffectStatusSettings = game.settings.get("dfreds-convenient-effects", "modifyStatusEffects");
    if (!convenientEffectStatusSettings || convenientEffectStatusSettings === "none") {
      game.settings.set("dfreds-convenient-effects", "modifyStatusEffects", "add");
    }
  } else if (useCEConditions) {
    logger.error("Convenient Effects needs to be installed for effects");
    ui.notifications.warn("Convenient Effects needs to be installed for effects");
  }

  if (game.modules.get("itemacro")?.active) {
    const itemMacroSheet = game.settings.get("itemacro", "charsheet");
    if (itemMacroSheet) {
      game.settings.set("itemacro", "charsheet", false);
    }
  } else if (isNewerVersion(11, game.version)) {
    logger.error("Item Macro is recommended to be installed for effects");
    ui.notifications.warn("Item Macro is recommended to be installed for effects");
  }

  if (game.modules.get("warpgate")?.active && checkJB2a(true, true, false)) {
    await createJB2aActors("Dancing Lights", "Dancing light");
  }

  return true;
}

export async function loadMacroFile(type, fileName, forceLoad = false, forceDDB = false) {
  const embedMacros = game.settings.get("ddb-importer", "embed-macros");
  logger.debug(`Getting macro for ${type} ${fileName}`);
  const fileExists = forceLoad || (typeof ForgeVTT !== "undefined" && ForgeVTT?.usingTheForge)
    ? true
    : await FileHelper.fileExists(`[data] modules/ddb-importer/macros/${type}s`, fileName);

  let data;
  if (fileExists && (forceLoad || embedMacros) && !forceDDB) {
    const url = await FileHelper.getFileUrl(`[data] modules/ddb-importer/macros/${type}s`, fileName);
    const response = await fetch(url, { method: "GET" });
    data = await response.text();
  } else if (fileExists && (!embedMacros || forceDDB)) {
    data = `
// Execute DDB Importer dynamic macro
if (isNewerVersion(11, game.version)) {
  return game.modules.get("ddb-importer")?.api.macro.executeMacro("${type}", "${fileName}", ...args);
} else {
  return game.modules.get("ddb-importer")?.api.macro.executeMacro("${type}", "${fileName}", scope);
}
`;
  } else if (!fileExists) {
    data = "// Unable to load the macro file";
  }
  return data;
}

export function generateItemMacroFlag(document, macroText) {
  const data = {
    macro: {
      name: document.name,
      type: "script",
      scope: "global",
      command: macroText,
    },
  };
  setProperty(document, "flags.itemacro", data);
  return document;
}

export function generateMacroChange(macroValues, { priority = 20, keyPostfix = "" } = {}) {
  const macroKey = "macro.itemMacro";
  return {
    key: `${macroKey}${keyPostfix}`,
    value: macroValues,
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: priority,
  };
}

function generateMidiOnUseMacroFlagValue(macroType, macroName, triggerPoints = []) {
  const useDDBFunctions = false;
  const valueContent = (useDDBFunctions) ? `function.DDBImporter.macros.getMacro("${macroType}","${macroName}")` : "ItemMacro";
  return triggerPoints.map((t) => `[${t}]${valueContent}`).join(",");
}

export function setMidiOnUseMacroFlag(document, macroType, macroName, triggerPoints = []) {
  const value = generateMidiOnUseMacroFlagValue(macroType, macroName, triggerPoints);
  setProperty(document, "flags.midi-qol.onUseMacroName", value);
}

export function generateOnUseMacroChange({ macroPass, macroType = null, macroName = null, priority = 20, document = null } = {}) {
  const useDDBFunctions = false;
  const docMacroName = (document && !useDDBFunctions) ? `.${document.name}` : "";
  const valueContent = (useDDBFunctions)
    ? `function.DDBImporter.macros.getMacro("${macroType}","${macroName}")`
    : `ItemMacro${docMacroName},${macroPass}`;

  return {
    key: "flags.midi-qol.onUseMacroName",
    value: valueContent,
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: priority,
  };
}

export async function createMacro({ name, content, img, isGM, isTemp }) {
  const macroFolder = isTemp
    ? undefined
    : game.folders.find((folder) => folder.name === "DDB Macros" && folder.type === "Macro");

  const data = {
    "name": name,
    "type": "script",
    "img": img ? img : "icons/svg/dice-target.svg",
    "scope": "global",
    "command": content,
    "folder": macroFolder ? macroFolder.id : undefined,
    "flags": {
      "advanced-macros": {
        "runAsGM": isGM,
        "runForSpecificUser": "",
      },
    }
  };

  const existingMacro = game.macros.find((m) => m.name == name);
  if (existingMacro) data._id = existingMacro.id;
  const macro = existingMacro
    ? existingMacro.update(data)
    : new CONFIG.Macro.documentClass(data, { displaySheet: false, temporary: isTemp });

  return macro;

}

export const MACROS = {
  WORLD: {
    DARKNESS_GM: {
      name: "Darkness (DDB - GM)",
      type: "gm",
      file: "darkness.js",
      isGM: true,
      img: "icons/magic/unholy/orb-glowing-yellow-purple.webp",
      world: true,
    },
    CHILL_TOUCH: {
      name: "Chill Touch (Target effect)",
      type: "spell",
      file: "chillTouchWorld.js",
      isGM: false,
      img: "icons/magic/fire/flame-burning-hand-purple.webp",
      world: true,
    },
  },
  ACTIVE_AURAS: {
    AA_ONLY: {
      name: "Active Aura Only (Generic)",
      type: "generic",
      file: "activeAuraOnly.js",
      isGM: false,
      img: null,
      world: true,
    },
    AA_ON_ENTRY: {
      name: "Active Aura Damage and Condition On Entry (Generic)",
      type: "generic",
      file: "activeAuraDamageAndConditionOnEntry.js",
      isGM: false,
      img: null,
      world: true,
    },
    AA_CONDITION_ON_ENTRY: {
      name: "Active Aura Condition On Entry (Generic)",
      type: "generic",
      file: "activeAuraConditionOnEntry.js",
      isGM: false,
      img: null,
      world: true,
    },
    AA_DAMAGE_ON_ENTRY: {
      name: "Active Aura Damage On Entry (Generic)",
      type: "generic",
      file: "activeAuraDamageOnEntry.js",
      isGM: false,
      img: null,
      world: true,
    },
  },
};

export async function createWorldMacros() {
  if (game.user.isGM) {
    await checkMacroFolder();

    for (const macro of Object.values([].concat(MACROS.WORLD, MACROS.ACTIVE_AURAS)).filter((m) => m.world)) {
      // eslint-disable-next-line no-await-in-loop
      const macroFile = await loadMacroFile(macro.type, macro.file, true);
      if (macroFile) {
        // eslint-disable-next-line no-await-in-loop
        await createMacro({ name: macro.name, content: macroFile, img: macro.img, isGM: macro.isGM, isTemp: false });
      }
    }
  }
}


async function getMacroBody(type, fileName) {
  const macroText = await loadMacroFile(type, fileName, true);
  if (!macroText) {
    ui.notifications.error(`Unable to load macro (${type}) ${fileName}`);
    logger.warn(`Unable to load macro (${type}) ${fileName}`);
    throw new Error(`Unable to load macro (${type}) ${fileName}`);
  }
  return macroText;
}

async function loadDDBMacroToConfig(type, name, fileName) {
  const macroText = await getMacroBody(type, fileName);
  const macro = await createMacro({ name: `${type} ${fileName}`, content: macroText, img: null, isGM: false, isTemp: true });
  setProperty(CONFIG.DDBI.MACROS, `${type}.${name}`, macro);
  logger.debug(`Macro (${type}) ${fileName} loaded from file into cache`, macro);
  return macro;
}


export async function getMacro(type, name) {
  const strippedName = name.split(".js")[0]; // sanitise name
  const fileName = `${strippedName}.js`;
  const macro = CONFIG.DDBI.MACROS[type]?.[strippedName] ?? (await loadDDBMacroToConfig(type, strippedName, fileName));
  return macro;
}

export async function executeDDBMacro(type, name, ...params) {
  const macro = await getMacro(type, name);
  logger.debug(`Calling (${type}) macro "${name}" with spread params`, ...params);
  return macro.execute(...params);
}

export function getMacroFunction(type, name) {
  const macroFunction = async (...params) => {
    const macro = await getMacro(type, name);
    return macro.execute(...params);
  };
  return macroFunction;
}
