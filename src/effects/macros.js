import logger from "../logger.js";
import FileHelper from "../lib/FileHelper.js";
import SETTINGS from "../settings.js";

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

export function configureDependencies() {
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
      game.settings.get("itemacro", "charsheet", false);
    }
  } else {
    logger.error("Item Macro needs to be installed for effects");
    ui.notifications.warn("Item Macro needs to be installed for effects");
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
    data = `// Execute DDB Importer dynamic macro\nreturn game.modules.get("ddb-importer")?.api.executeDDBMacro("${type}", "${fileName}", ...args);`;
  } else if (!fileExists) {
    data = "// Unable to load the macro file";
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

export function generateMacroChange(macroValues, priority = 20, local = false) {
  const macroKey = local ? "macro.itemMacro.local" : "macro.itemMacro";
  return {
    key: macroKey,
    value: macroValues,
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
    : Macro.create(data, {
      temporary: isTemp,
      displaySheet: false,
    });

  return macro;

}

export const MACROS = {
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
  }
};

export async function createGMMacros() {
  if (game.user.isGM) {
    await checkMacroFolder();

    for (const macro of Object.values(MACROS).filter((m) => m.world)) {
      // eslint-disable-next-line no-await-in-loop
      const macroFile = await loadMacroFile(macro.type, macro.file, true);
      if (macroFile) {
        // eslint-disable-next-line no-await-in-loop
        await createMacro({ name: macro.name, content: macroFile, img: macro.img, isGM: macro.isGM, isTemp: false });
      }
    }
  }
}

export async function executeDDBMacro(type, fileName, ...params) {
  if (!fileName.endsWith(".js")) fileName = `${fileName}.js`;
  const strippedName = fileName.split(".js")[0];
  let macro = CONFIG.DDBI.MACROS[type]?.[strippedName];
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
    setProperty(CONFIG.DDBI.MACROS, `${type}.${strippedName}`, macro);
    logger.debug(`Macro (${type}) ${fileName} loaded from file into cache`, macro);
  }

  logger.debug(`Calling (${type}) ${fileName} with params`, ...params);
  return macro.execute(...params);
}
