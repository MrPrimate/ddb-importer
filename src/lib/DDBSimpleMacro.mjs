import { utils, logger } from "../lib/_module.mjs";
import DDBMacros from "./DDBMacros.mjs";

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

  static getDescriptionAddition(name, type, params) {
    const safeName = utils.referenceNameString(name).toLowerCase();
    const macroDetails = foundry.utils.getProperty(DDBSimpleMacro.MACROS, `${type}.${safeName}`);
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
  static async execute(type, name, context = {}, ids = {}, { ...scope } = {}) {
    const names = DDBMacros._getMacroFileNameFromName(name);
    const script = await DDBMacros.getMacroBody(type, names.fileName);
    const effect = ids.effect ? await fromUuid(ids.effect) : null;
    const effectVariables = ids.effect
      ? DDBMacros._getEffectVariables(effect)
      : {};

    const actor = ids.actor
      ? await fromUuid(ids.actor)
      : null;
    if (actor) effectVariables.actor = actor;

    const token = ids.token
      ? await fromUuid(ids.token)
      : null;
    if (token) effectVariables.token = token;

    const item = ids.item
      ? await fromUuid(ids.item)
      : null;
    if (item) effectVariables.item = item;

    const origin = ids.origin
      ? await fromUuid(ids.origin)
      : null;
    if (origin) effectVariables.origin = origin;

    if (!effectVariables.speaker && actor) {
      const speaker = ChatMessage.implementation.getSpeaker({ actor, token });
      if (speaker) effectVariables.speaker = speaker;
    }

    effectVariables.character = game.user.character;
    effectVariables.scope = scope;
    foundry.utils.setProperty(effectVariables.scope, "flags.ddb-importer.ddbMacroFunction", true);

    const variables = foundry.utils.mergeObject(effectVariables, scope);

    // eslint-disable-next-line no-empty-function
    const AsyncFunction = (async function() {}).constructor;
    // eslint-disable-next-line no-new-func
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
