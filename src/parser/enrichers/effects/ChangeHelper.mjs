import { utils } from "../../../lib/_module.mjs";
import AutoEffects from "./AutoEffects.mjs";

export default class ChangeHelper {

  static change({ value, priority, key, type }) {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES[type],
      priority,
    };
  }


  // Basic Change generation helpers
  static signedAddChange(value, priority, key) {
    const bonusValue = (Number.isInteger(value) && value >= 0) // if bonus is a positive integer
      || (!Number.isInteger(value) && !value.trim().startsWith("+") && !value.trim().startsWith("-")) // not an int and does not start with + or -
      ? `+${value}`
      : value;
    return {
      key,
      value: bonusValue,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority,
    };
  }

  static unsignedAddChange(value, priority, key) {
    const bonusValue = `${value}`.trim().replace("+ +", "+").replace(/^\+\s+/, "");
    return {
      key,
      value: bonusValue.trim(),
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority,
    };
  }

  static addChange(value, priority, key) {
    return ChangeHelper.unsignedAddChange(value, priority, key);
  }

  static customChange(value, priority, key) {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority,
    };
  }

  static customBonusChange(value, priority, key) {
    const bonusValue = (Number.isInteger(value) && value >= 0) // if bonus is a positive integer
      || (!Number.isInteger(value) && !value.trim().startsWith("+") && !value.trim().startsWith("-")) // not an int and does not start with + or -
      ? `+${value}`
      : value;
    return ChangeHelper.customChange(bonusValue, priority, key);
  }

  static upgradeChange(value, priority, key) {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
      priority,
    };
  }

  static overrideChange(value, priority, key) {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority,
    };
  }

  static multiplyChange(value, priority, key) {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
      priority,
    };
  }

  static downgradeChange(value, priority, key) {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.DOWNGRADE,
      priority,
    };
  }

  static tokenMagicFXChange(macroValue, priority = 20) {
    return {
      key: 'macro.tokenMagic',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: macroValue,
      priority: priority,
    };
  }

  // this can now be removed once changes refactored
  static atlChange(atlKey, mode, value, priority = 20) {
    let key = atlKey;

    switch (atlKey) {
      case 'ATL.dimLight':
        key = 'ATL.light.dim';
        break;
      case 'ATL.brightLight':
        key = 'ATL.light.bright';
        break;
      case 'ATL.lightAnimation':
        key = 'ATL.light.animation';
        break;
      case 'ATL.lightColor':
        key = 'ATL.light.color';
        break;
      case 'ATL.lightAlpha':
        key = 'ATL.light.alpha';
        break;
      case 'ATL.lightAngle':
        key = 'ATL.light.angle';
        break;
      // no default
    }

    return {
      key,
      mode,
      value,
      priority,
    };
  }

  static daeStatusEffectChange(statusName, priority = 20) {
    return {
      key: "macro.StatusEffect",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: statusName.toLowerCase(),
      priority: priority,
    };
  }

  static addStatusEffectChange({ effect, statusName, priority = 20, level = null } = {}) {
    if (AutoEffects.effectModules().daeInstalled && game.settings.get("ddb-importer", "effects-uses-macro-status-effects")) {
      const key = ChangeHelper.daeStatusEffectChange(statusName, priority);
      effect.changes.push(key);
    } else {
      if (effect.description && effect.description.trim() === "") {
        effect.description = `You have the &Reference[${statusName.toLowerCase()}] status condition.`;
      } else if (effect.description && effect.description.startsWith("You have the &Reference[")) {
        effect.description += `<br> You have the &Reference[${statusName.toLowerCase()}] status condition.`;
      }
      effect.statuses.push(utils.camelCase(statusName));
      if (level) foundry.utils.setProperty(effect, `flags.dnd5e.${statusName.toLowerCase().trim()}Level`, level);
    }
    return effect;
  }


  static overTimeDamageChange({ document, turn, damage, damageType, saveAbility, saveRemove, saveDamage, dc } = {}) {
    return {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `turn=${turn},label=${document.name} (${utils.capitalize(turn)} of Turn),damageRoll=${damage},damageType=${damageType},saveRemove=${saveRemove},saveDC=${dc},saveAbility=${saveAbility},saveDamage=${saveDamage},killAnim=true`,
      priority: "20",
    };
  }

  static overTimeSaveChange({ document, turn, saveAbility, saveRemove = true, dc } = {}) {
    const turnValue = turn === "action" ? "end" : turn;
    const actionSave = turn === "action" ? ",actionSave=true" : "";
    return {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `turn=${turnValue},label=${document.name} (${utils.capitalize(turn)} of Turn),saveRemove=${saveRemove},saveDC=${dc},saveAbility=${saveAbility},killAnim=true${actionSave}`,
      priority: "20",
    };
  }

}
