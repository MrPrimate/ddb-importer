import { utils } from "../../../lib/_module.mjs";
import AutoEffects from "./AutoEffects";

interface ChangeResult {
  key: string;
  value: any;
  mode: number;
  priority: any;
}

interface ChangeParams {
  value: any;
  priority: any;
  key: string;
  type: string;
}

interface StatusEffectChangeParams {
  effect: any;
  statusName: string;
  priority?: number;
  level?: number | null;
}

interface OverTimeDamageParams {
  document: any;
  turn: string;
  damage: string;
  damageType: string;
  saveAbility: string;
  saveRemove: boolean;
  saveDamage: string;
  dc: any;
}

interface OverTimeSaveParams {
  document: any;
  turn: string;
  saveAbility: string;
  saveRemove?: boolean;
  dc: any;
}

export default class ChangeHelper {

  static change({ value, priority, key, type }: ChangeParams): ChangeResult {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES[type],
      priority,
    };
  }


  // Basic Change generation helpers
  static signedAddChange(value: any, priority: any, key: string): ChangeResult {
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

  static unsignedAddChange(value: any, priority: any, key: string): ChangeResult {
    const bonusValue = `${value}`.trim().replace("+ +", "+").replace(/^\+\s+/, "");
    return {
      key,
      value: bonusValue.trim(),
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority,
    };
  }

  static addChange(value: any, priority: any, key: string): ChangeResult {
    return ChangeHelper.unsignedAddChange(value, priority, key);
  }

  static customChange(value: any, priority: any, key: string): ChangeResult {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority,
    };
  }

  static customBonusChange(value: any, priority: any, key: string): ChangeResult {
    const bonusValue = (Number.isInteger(value) && value >= 0) // if bonus is a positive integer
      || (!Number.isInteger(value) && !value.trim().startsWith("+") && !value.trim().startsWith("-")) // not an int and does not start with + or -
      ? `+${value}`
      : value;
    return ChangeHelper.customChange(bonusValue, priority, key);
  }

  static upgradeChange(value: any, priority: any, key: string): ChangeResult {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
      priority,
    };
  }

  static overrideChange(value: any, priority: any, key: string): ChangeResult {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority,
    };
  }

  static multiplyChange(value: any, priority: any, key: string): ChangeResult {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
      priority,
    };
  }

  static downgradeChange(value: any, priority: any, key: string): ChangeResult {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.DOWNGRADE,
      priority,
    };
  }

  static tokenMagicFXChange(macroValue: string, priority: number = 20): ChangeResult {
    return {
      key: 'macro.tokenMagic',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: macroValue,
      priority: priority,
    };
  }

  static damageResistanceChange(damageType: string, priority: number = 20): ChangeResult {
    return {
      key: "system.traits.dr.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: damageType.toLowerCase(),
      priority,
    };
  }

  // this can now be removed once changes refactored
  static atlChange(atlKey: string, mode: number, value: any, priority: number = 20): ChangeResult {
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

  static daeStatusEffectChange(statusName: string, priority: number = 20): ChangeResult {
    return {
      key: "macro.StatusEffect",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: statusName.toLowerCase(),
      priority: priority,
    };
  }

  static addStatusEffectChange({ effect, statusName, priority = 20, level = null }: StatusEffectChangeParams): any {
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


  static overTimeDamageChange({ document, turn, damage, damageType, saveAbility, saveRemove, saveDamage, dc }: OverTimeDamageParams): ChangeResult {
    return {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `turn=${turn},label=${document.name} (${utils.capitalize(turn)} of Turn),damageRoll=${damage},damageType=${damageType},saveRemove=${saveRemove},saveDC=${dc},saveAbility=${saveAbility},saveDamage=${saveDamage},killAnim=true`,
      priority: "20",
    };
  }

  static overTimeSaveChange({ document, turn, saveAbility, saveRemove = true, dc }: OverTimeSaveParams): ChangeResult {
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
