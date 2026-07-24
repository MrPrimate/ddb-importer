import logger from "./Logger";
import utils from "./Utils";
import DDBMacros from "./DDBMacros";

interface IMacroEffectVariables {
  actor?: any;
  token?: any;
  speaker?: any;
  origin?: any;
  effect?: any;
  item?: any;
  scene?: any;
  character?: any;
  scope?: any;
}

interface ISimpleMacroIds {
  effect?: string;
  actor?: string;
  token?: string;
  item?: string;
  origin?: string;
  scene?: string;
}

/**
 * This class helps execute DDB Macros and is mainl
 */
export default class DDBSimpleMacro {

  static MACROS = {
    "item": {
      "spell-refueling-ring": {
        name: "spellRefuelingRing",
        label: "Spell Refueling Macro",
      },
    },
  };

  static getDescriptionAddition(name: string, type: TDDBMacroType, params = null as string | null): string {
    const safeName = utils.referenceNameString(name).toLowerCase();
    const macroDetails = foundry.utils.getProperty(DDBSimpleMacro.MACROS, `${type}.${safeName}`) as { name?: string; label?: string; parameters?: string } | undefined;
    if (!macroDetails) return "";

    const parameters = params
      ? params
      : (macroDetails.parameters ?? "");

    return `<br><p>[[/ddbifunc functionName="${macroDetails.name ?? safeName}" functionType="${type}" functionParams="${parameters}"]]{${macroDetails.label}}</div></p>`;
  }


  /**
   * Executes a DDB macro function.
   *
   * @param {string} type The type of the macro. e.g. gm
   * @param {string} name The name of the macro. e.g. test
   * @param {object} context The context object.
   * @param {object} ids An object of ids you wish to resolve for the macro to run
   * @param {object} scope ANy additional information/parameters in an object to pass to the macro
   * @returns {Promise<any>} The result of the macro function.
   */
  static async execute(type: TDDBMacroType, name: string, context = {}, ids: ISimpleMacroIds = {}, { ...scope } = {}) {
    const names = DDBMacros._getMacroFileNameFromName(name);
    const script = await DDBMacros.getMacroBody(type, names.fileName);

    logger.debug("DDBSimpleMacro.execute", {
      type,
      name,
      names,
      context,
      ids,
      scope,
    });
    const effect = ids.effect
      ? await fromUuid(ids.effect) as ActiveEffect.Implementation
      : null;
    const effectVariables: IMacroEffectVariables = effect
      ? DDBMacros._getEffectVariables(effect)
      : {
        actor: null,
        token: null,
        speaker: null,
        origin: null,
        effect: null,
        item: null,
        scene: null,
      };

    const actor = ids.actor
      ? await fromUuid(ids.actor) as Actor.Implementation
      : null;
    if (actor) effectVariables.actor = actor;

    const token = ids.token
      ? await fromUuid(ids.token) as TokenDocument.Implementation
      : null;
    if (token) effectVariables.token = token;

    const item = ids.item
      ? await fromUuid(ids.item) as Item.Implementation
      : null;
    if (item) effectVariables.item = item;

    const origin = ids.origin
      ? await fromUuid(ids.origin)
      : null;
    if (origin) effectVariables.origin = origin;

    if (!effectVariables.speaker && actor) {
      const speaker = ChatMessage.implementation.getSpeaker({ actor: actor as Actor.Stored, token });
      if (speaker) effectVariables.speaker = speaker;
    }

    if (!effectVariables.scene) {
      const scene = (ids.scene ? game.scenes.get(ids.scene) : undefined) ?? (await fromUuid(ids.token));
      if (scene) effectVariables.scene = scene;
    }

    effectVariables.character = game.user.character;
    effectVariables.scope = scope;
    foundry.utils.setProperty(effectVariables.scope, "flags.ddb-importer.ddbMacroFunction", true);

    const variables = foundry.utils.mergeObject(effectVariables, scope);

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const AsyncFunction = (async function() {}).constructor as new (...args: string[]) => (...fnArgs: any[]) => Promise<any>;

    const fn = new AsyncFunction(...Object.keys(variables), `{${script}\n}`);

    try {
      const result = await fn.call(context, ...Object.values(variables));
      return result;
    } catch (err) {
      logger.error(err);
      return null;
    }
  }


}
