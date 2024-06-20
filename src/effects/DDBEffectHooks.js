// import logger from "../logger.js";
import DDBMacros from "./DDBMacros.js";


export default class DDBEffectHooks {

  // eslint-disable-next-line no-unused-vars
  static ddbMacro(actor, change, ..._params) {
    const scope = { actor, token: null };
    const data = JSON.parse(change.value);

    DDBMacros.executeDDBMacro(data.type, data.name, scope);
  }

  // eslint-disable-next-line no-unused-vars
  static processCustomApplyEffectHooks(actor, change, current, delta, changes) {
    // eslint-disable-next-line no-useless-return
    if (change.mode !== CONST.ACTIVE_EFFECT_MODES.CUSTOM) return;

  }

  static loadHooks() {
    // special effect functions
    Hooks.on("applyActiveEffect", DDBEffectHooks.processCustomApplyEffectHooks);
  }

}
