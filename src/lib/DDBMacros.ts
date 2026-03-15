import { SETTINGS } from "../config/_module";
import { logger, FileHelper, utils } from "../lib/_module";

type TDDBImporterDocument = TAll5eItemDocuments | TAll5eActorDocuments;

export default class DDBMacros {

  static MACROS = {
    WORLD: {
      // DARKNESS_GM: {
      //   name: "Darkness (DDB - GM)",
      //   type: "gm",
      //   file: "darkness.js",
      //   isGM: true,
      //   img: "icons/magic/unholy/orb-glowing-yellow-purple.webp",
      //   world: true,
      // },
      // CHILL_TOUCH: {
      //   name: "Chill Touch (Target effect)",
      //   type: "spell",
      //   file: "chillTouchWorld.js",
      //   isGM: false,
      //   img: "icons/magic/fire/flame-burning-hand-purple.webp",
      //   world: true,
      // },
    },
    ACTIVE_AURAS: {
    //   AA_ONLY: {
    //     name: "Active Aura Only (Generic)",
    //     type: "generic",
    //     file: "activeAuraOnly.js",
    //     isGM: false,
    //     img: null,
    //     world: true,
    //   },
    //   AA_ON_ENTRY: {
    //     name: "Active Aura Damage and Condition On Entry (Generic)",
    //     type: "generic",
    //     file: "activeAuraDamageAndConditionOnEntry.js",
    //     isGM: false,
    //     img: null,
    //     world: true,
    //   },
    //   AA_CONDITION_ON_ENTRY: {
    //     name: "Active Aura Condition On Entry (Generic)",
    //     type: "generic",
    //     file: "activeAuraConditionOnEntry.js",
    //     isGM: false,
    //     img: null,
    //     world: true,
    //   },
    //   AA_DAMAGE_ON_ENTRY: {
    //     name: "Active Aura Damage On Entry (Generic)",
    //     type: "generic",
    //     file: "activeAuraDamageOnEntry.js",
    //     isGM: false,
    //     img: null,
    //     world: true,
    //   },
    },
  };

  static async checkMacroFolder() {
    const macroFolder = game.folders.find((folder) => folder.name === "DDB Macros" && folder.type === "Macro");

    if (!macroFolder) {
      await Folder.create({
        color: "#FF0000",
        name: "DDB Macros",
        parent: null,
        type: "Macro",
      } as any);
    }
  }

  static async configureDependencies(): Promise<boolean> {
    if (!game.user.isGM) return false;
    // allow item use macros on items
    if (game.modules.get("midi-qol")?.active) {
      const midiQOLSettings = game.settings.get("midi-qol", "ConfigSettings") as Record<string, any>;
      if (!midiQOLSettings.allowUseMacro) {
        midiQOLSettings.allowUseMacro = true;
        game.settings.set("midi-qol", "ConfigSettings", midiQOLSettings);
      }
    } else {
      logger.info("Midi-QOL not installed, skipping configuration check.");
    }

    if (game.modules.get("itemacro")?.active && game.modules.get("dae")?.active) {
      const itemMacroSheet = utils.getSetting<boolean>("defaultmacro", "itemacro");
      if (itemMacroSheet) {
        game.settings.set("itemacro", "defaultmacro", false);
      }
    }

    // if (game.modules.get("warpgate")?.active && DDBEffectHelper.checkJB2a(true, true, false)) {
    //   await DDBEffectHelper._createJB2aActors("Dancing Lights", "Dancing light");
    // }

    return true;
  }

  static async loadMacroFile(type: string, fileName: string, forceLoad = false, forceDDB = false): Promise<string> {
    const embedMacros = game.settings.get(SETTINGS.MODULE_ID, "embed-macros");
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
      data = `// Execute DDB Importer dynamic macro
return game.modules.get(${SETTINGS.MODULE_ID})?.api.macros.executeMacro("${type}", "${fileName}", scope);
`;
    } else if (!fileExists) {
      data = "// Unable to load the macro file";
    }
    return data;
  }

  static generateItemMacroFlag(document: TDDBImporterDocument, macroText: string): TDDBImporterDocument {
    const daeMacro = foundry.utils.isNewerVersion((game.modules.get("dae")?.version ?? 0), "11.0.21");
    const data = {
      name: document.name,
      type: "script",
      scope: "global",
      command: macroText,
    };
    const flag = daeMacro ? "flags.dae.macro" : "flags.itemacro.macro";
    foundry.utils.setProperty(document, flag, data);
    return document;
  }

  static async setItemMacroFlag(document: TDDBImporterDocument, macroType: string, macroName: string): Promise<TDDBImporterDocument> {
    const useDDBFunctions = utils.getSetting<boolean>("no-item-macros");
    if (!useDDBFunctions) {
      const itemMacroText = await DDBMacros.loadMacroFile(macroType, macroName);
      document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
    }
    return document;
  }

  static generateMacroChange({
    macroValues = "", macroType = null, macroName = null, keyPostfix = "", priority = 20, ddbFunctions = null,
    functionCall = null, functionParams = "",
  }: {
    macroValues?: string; macroType?: string | null; macroName?: string | null; keyPostfix?: string;
    priority?: number; ddbFunctions?: boolean | null; functionCall?: string | null; functionParams?: string;
  }): IActiveEffectChangeData {

    const useDDBFunctions = ddbFunctions ?? utils.getSetting<boolean>("no-item-macros");
    const macroKey = (useDDBFunctions || functionCall)
      ? `macro.execute`
      : "macro.itemMacro";
    const macroValuePrefix = functionCall
      ? `function.${functionCall} `
      : useDDBFunctions
        ? `function.DDBImporter.lib.DDBMacros.macroFunction.${macroType}("${macroName}") `
        : "";

    return {
      key: `${macroKey}${keyPostfix}`,
      value: `${macroValuePrefix}${macroValues}${functionParams}`,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority,
    };
  }

  static generateMidiOnUseMacroFlagValueV2({
    macroType, macroName, triggerPoints = [], macroUuid = null, functionCall = null,
  }: {
    macroType: string; macroName: string; triggerPoints?: string[]; macroUuid?: string | null; functionCall?: string | null;
  }): string {
    const useDDBFunctions = utils.getSetting<boolean>("no-item-macros");
    const docMacroName = (macroUuid && !useDDBFunctions) ? `.${macroUuid}` : "";
    const valueContent = functionCall
      ? `function.${functionCall}`
      : useDDBFunctions
        ? `function.DDBImporter.lib.DDBMacros.macroFunction.${macroType}("${macroName}")`
        : `ItemMacro${docMacroName}`;
    return triggerPoints.map((t) => `[${t}]${valueContent}`).join(",");
  }

  static generateMidiOnUseMacroFlagValue(macroType: string, macroName: string, triggerPoints = [], macroUuid = null): string {
    const useDDBFunctions = utils.getSetting<boolean>("no-item-macros");
    const docMacroName = (macroUuid && !useDDBFunctions) ? `.${macroUuid}` : "";
    const valueContent = (useDDBFunctions)
      ? `function.DDBImporter.lib.DDBMacros.macroFunction.${macroType}("${macroName}")`
      : `ItemMacro${docMacroName}`;
    return triggerPoints.map((t) => `[${t}]${valueContent}`).join(",");
  }

  static setMidiOnUseMacroFlagV2({
    document, macroType = null, macroName = null, triggerPoints = [], functionCall = null,
  }: {
    document: TDDBImporterDocument; macroType?: string | null; macroName?: string | null;
    triggerPoints?: string[]; functionCall?: string | null;
  }) {
    const value = DDBMacros.generateMidiOnUseMacroFlagValueV2({ macroType, macroName, triggerPoints, functionCall });
    foundry.utils.setProperty(document, "flags.midi-qol.onUseMacroName", value);
  }

  static setMidiOnUseMacroFlag(document: TDDBImporterDocument, macroType: string, macroName: string, triggerPoints = []) {
    const value = DDBMacros.generateMidiOnUseMacroFlagValue(macroType, macroName, triggerPoints);
    foundry.utils.setProperty(document, "flags.midi-qol.onUseMacroName", value);
  }

  static generateItemMacroValue({
    macroType = null, macroName = null, document = null, functionCall = null,
  }:  { macroType?: string | null; macroName?: string | null; document?: TDDBImporterDocument;
    functionCall?: string | null; },
  ): string {
    const useDDBFunctions = utils.getSetting<boolean>("no-item-macros");
    const docMacroName = (document && !useDDBFunctions) ? `.${document.name}` : "";
    const valueContent = functionCall
      ? `function.${functionCall}`
      : useDDBFunctions
        ? `function.DDBImporter.lib.DDBMacros.macroFunction.${macroType}("${macroName}")`.trim()
        : `ItemMacro${docMacroName}`.trim();
    return valueContent;
  }

  static generateOnUseMacroChange({
    macroPass, macroType = null, macroName = null, priority = 20, document = null, macroParams = "",
    functionCall = null, functionParams = "",
  }: { macroPass: string; macroType?: string | null; macroName?: string | null; priority?: number;
    document?: TDDBImporterDocument; macroParams?: string; functionCall?: string | null;
    functionParams?: string; },
  ): IActiveEffectChangeData {
    const valueStub = DDBMacros.generateItemMacroValue({ macroType, macroName, document, functionCall });
    const valueContent = `${valueStub},${macroPass} ${macroParams}${functionParams}`.trim();

    return {
      key: "flags.midi-qol.onUseMacroName",
      value: valueContent,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority,
    };
  }

  static generateDamageBonusMacroChange({
    macroType = null, macroName = null, priority = 20, document = null, functionCall = null,
  }: { macroType?: string | null; macroName?: string | null; priority?: number;
    document?: TDDBImporterDocument; functionCall?: string | null; },
  ): IActiveEffectChangeData {
    const value = DDBMacros.generateItemMacroValue({ macroType, macroName, document, functionCall });

    return {
      key: "flags.dnd5e.DamageBonusMacro",
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority,
    };
  }

  static generateTargetUpdateMacroChange({
    macroPass, macroType = null, macroName = null, priority = 20, document, macroParams = "",
    functionCall = null, functionParams = "",
  }: { macroPass: string; macroType?: string | null; macroName?: string | null; priority?: number;
    document: TDDBImporterDocument; macroParams?: string; functionCall?: string | null;
    functionParams?: string; },
  ): IActiveEffectChangeData {
    const useDDBFunctions = utils.getSetting<boolean>("no-item-macros");
    const valueStub = useDDBFunctions || functionCall
      ? DDBMacros.generateItemMacroValue({ macroType, macroName, document, functionCall })
      : `${document.name}, ItemMacro`;
    const valueContent = `${valueStub},${macroPass} ${macroParams}${functionParams}`.trim();

    return {
      key: "flags.dae.onUpdateTarget",
      value: valueContent,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority,
    };
  }

  static generateSourceUpdateMacroChange({
    macroPass, macroType = null, macroName = null, priority = 20, document, macroParams = "",
    functionCall = null, functionParams = "",
  }: { macroPass: string; macroType?: string | null; macroName?: string | null; priority?: number;
    document: TDDBImporterDocument; macroParams?: string; functionCall?: string | null;
    functionParams?: string; },
  ): IActiveEffectChangeData {
    const useDDBFunctions = utils.getSetting<boolean>("no-item-macros");
    const valueStub = useDDBFunctions || functionCall
      ? DDBMacros.generateItemMacroValue({ macroType, macroName, document, functionCall })
      : `${document.name}, ItemMacro`;
    const valueContent = `${valueStub},${macroPass} ${macroParams}${functionParams}`.trim();

    return {
      key: "flags.dae.onUpdateSource",
      value: valueContent,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority,
    };
  }

  static generateOptionalMacroChange({
    optionPostfix, macroPass = null, macroType = null, macroName = null, priority = 20, document = null,
    macroParams = "", functionCall = null, functionParams = "",
  }: { optionPostfix: string; macroPass?: string | null; macroType?: string | null; macroName?: string | null;
    priority?: number; document?: TDDBImporterDocument; macroParams?: string; functionCall?: string | null;
    functionParams?: string; },
  ): IActiveEffectChangeData {
    const valueStub = DDBMacros.generateItemMacroValue({ macroType, macroName, document, functionCall });
    const valueContent = macroPass
      ? `${valueStub},${macroPass} ${macroParams}${functionParams}`.trim()
      : `${valueStub} ${macroParams}${functionParams}`.trim();

    return {
      key: `flags.midi-qol.optional.${optionPostfix}`,
      value: valueContent,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority,
    };
  }

  static async createMacro({ name, content, img, isGM, isTemp }): Promise<Macro> {
    const macroFolder = isTemp
      ? undefined
      : game.folders.find((folder) => folder.name === "DDB Macros" && folder.type === "Macro");

    const data = {
      name: name,
      type: "script",
      img: img ? img : "icons/svg/dice-target.svg",
      scope: "global",
      command: content,
      folder: macroFolder ? macroFolder.id : undefined,
      flags: {
        [`${SETTINGS.MODULE_ID}`]: {
          macro: true,
        },
      },
      ownership: {
        default: isGM ? 0 : 2,
      },
    } as unknown as Macro.CreateData;

    const existingMacro = game.macros.find((m) => m.name == name);
    if (existingMacro) data._id = existingMacro.id;
    const macro = existingMacro
      ? existingMacro.update(data)
      : new (Macro.implementation as any)(data, { displaySheet: false, temporary: isTemp });

    return macro;

  }

  static async createWorldMacros() {
    const disabled = true;
    const createMacros = utils.getSetting<boolean>("character-update-policy-add-midi-effects");
    if (game.user.isGM && !disabled && createMacros) {
      await DDBMacros.checkMacroFolder();

      const worldMacros = [].concat(
        Object.values(DDBMacros.MACROS.WORLD),
        // Object.values(DDBMacros.MACROS.ACTIVE_AURAS),
      ).filter((m) => m.world);

      for (const macro of worldMacros) {
        const macroFile = await DDBMacros.loadMacroFile(macro.type, macro.file, true);

        if (macroFile) {
          await DDBMacros.createMacro({
            name: macro.name,
            content: macroFile,
            img: macro.img,
            isGM: macro.isGM,
            isTemp: false,
          });
        }
      }
    }
  }


  static async getMacroBody(type: string, fileName: string): Promise<string> {
    const macroText = await DDBMacros.loadMacroFile(type, fileName, true);
    if (!macroText) {
      ui.notifications.error(`Unable to load macro (${type}) ${fileName}`);
      logger.warn(`Unable to load macro (${type}) ${fileName}`);
      throw new Error(`Unable to load macro (${type}) ${fileName}`);
    }
    return macroText;
  }

  static _getMacroFileNameFromName(name: string): { name: string; fileName: string } {
    const strippedName = name.split(".js")[0]; // sanitise name
    const fileName = `${strippedName}.js`;
    return {
      name: strippedName,
      fileName: fileName,
    };
  }

  static async loadDDBMacroToConfig(type: string, name: string, fileName: string): Promise<Macro> {
    const macroText = await DDBMacros.getMacroBody(type, fileName);
    const macro = await DDBMacros.createMacro({ name: `${type} ${fileName}`, content: macroText, img: null, isGM: false, isTemp: true });
    foundry.utils.setProperty(CONFIG.DDBI.MACROS, `${type}.${name}`, macro);
    logger.debug(`Macro (${type}) ${fileName} loaded from file into cache`, macro);
    return macro;
  }

  static async getMacro(type: string, name: string): Promise<Macro> {
    const names = DDBMacros._getMacroFileNameFromName(name);
    const macro = CONFIG.DDBI.MACROS[type]?.[names.name]
      ?? (await DDBMacros.loadDDBMacroToConfig(type, names.name, names.fileName));
    return macro;
  }

  static async executeDDBMacro(type: string, name: string, ...params: any[]): Promise<any> {
    // console.warn("executeDDBMacro", {type, name, parms: [...params] });
    const macro = await DDBMacros.getMacro(type, name);
    logger.debug(`Calling (${type}) macro "${name}" with spread params`, ...params);
    return macro.execute(...params);
  }

  /**
   * Expose some useful things in a macro.
   * @param {ActiveEffect} effect
   * @returns {object}
   */
  static _getEffectVariables(effect: ActiveEffect.Implementation): {
    actor: Actor.Implementation | null;
    token: Token.Implementation | null;
    speaker: Token.Implementation | null;
    scene: Scene | null;
    origin: any;
    effect: ActiveEffect.Implementation | null;
    item: Item.Implementation | null;
  } {
    const actor = effect.parent instanceof Actor
      ? effect.parent
      : (effect.parent.parent ?? null);
    const token = actor?.token?.object ?? actor?.getActiveTokens()[0] ?? null;
    const scene = token?.scene ?? game.scenes.active ?? null;
    const origin = effect.origin ? fromUuidSync(effect.origin) : null;
    const speaker = actor ? ChatMessage.implementation.getSpeaker({ actor }) : {};
    const item = effect.parent instanceof Item ? effect.parent : null;
    return {
      actor,
      token: token as Token.Implementation | null,
      speaker: speaker as Token.Implementation | null,
      scene,
      origin,
      effect,
      item,
    };
  }

  /**
   * Exectutes a DDB Macro as GM, don't pass in world objects like actors
   * ids = { actor, effect, token}
   */

  /**
   * Execute a DDB Macro as GM, don't pass in world objects like actors
   * @param {string} type The type of the macro. e.g. gm
   * @param {string} name The name of the macro. e.g. test
   * @param {object} ids An object of ids you wish to resolve for the macro to run, { actor, effect, token}
   * @param {Array} ids.actor
   * @param {Array} ids.token
   * @param {Array} ids.effect
   * @param {...any} params Any additional information/parameters in an array to pass to the macro
   * @returns {Promise<any>} The result of the macro function.
   */
  static async executeDDBMacroAsGM(type: string, name: string, ids = {}, ...params: any[]): Promise<any> {
    const gmUser = game.users.find((user) => user.active && user.isGM);
    if (!gmUser) {
      ui.notifications.error("No GM user found");
      return undefined;
    }
    if (game.user.isGM) {
      return DDBMacros.executeDDBMacro(type, name, ...params);
    } else {
      logger.debug("Executing macro as GM", { type, name, ids, params });
      const result = await globalThis.DDBImporter.socket.executeAsGM("ddbMacroFunction", type, name, {}, ids, ...params);
      logger.debug("GM Macro Result", result);
      return result;
    }
  }

  static getMacroFunction(type: string, name: string): (...params: any[]) => Promise<any> {
    const macroFunction = async (...params: any[]) => {
      const macro = await DDBMacros.getMacro(type, name);
      return macro.execute(...params);
    };
    return macroFunction;
  }

  static macroFunction = {
    spell: (name) => DDBMacros.getMacroFunction("spell", name),
    feat: (name) => DDBMacros.getMacroFunction("feat", name),
    gm: (name) => DDBMacros.getMacroFunction("gm", name),
    item: (name) => DDBMacros.getMacroFunction("item", name),
    monsterFeature: (name) => DDBMacros.getMacroFunction("monsterFeature", name),
    generic: (name) => DDBMacros.getMacroFunction("generic", name),
  };

}
