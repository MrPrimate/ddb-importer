import { utils } from "../../../lib/_module";
import AutoEffects from "./AutoEffects";

interface ChangeParams {
  value: string;
  priority: number;
  key: string;
  type: TActiveEffectChangeType;
  phase?: TActiveEffectChangePhase;
}

interface StatusEffectChangeParams {
  effect: I5eEffectData;
  statusName: string;
  priority?: number;
  level?: number | null;
}

interface OverTimeDamageParams {
  document: TAll5eItemDocuments;
  turn: string;
  damage?: string;
  damageType?: string;
  saveAbility?: string | string[] | null;
  saveRemove: boolean;
  saveDamage?: string;
  dc?: number | string;
}

interface OverTimeSaveParams {
  document: TAll5eItemDocuments;
  turn: string;
  saveAbility?: string | string[] | null;
  saveRemove?: boolean;
  dc?: number | string;
}

export default class ChangeHelper {

  static change({ value, priority, key, type, phase }: ChangeParams): IActiveEffectChangeData {
    return {
      key,
      value,
      type,
      priority,
      phase,
    };
  }


  // Basic Change generation helpers
  static signedAddChange(value: string | number, priority: number, key: string): IActiveEffectChangeData {
    const bonusValue = (Number.isInteger(value) && (value as number) >= 0) // if bonus is a positive integer
      || (!Number.isInteger(value) && !String(value).trim().startsWith("+") && !String(value).trim().startsWith("-")) // not an int and does not start with + or -
      ? `+${value}`
      : value;
    return {
      key,
      value: String(bonusValue),
      type: "add",
      priority,
    };
  }

  static unsignedAddChange(value: string | number, priority: number, key: string): IActiveEffectChangeData {
    const bonusValue = `${value}`.trim().replace("+ +", "+").replace(/^\+\s+/, "");
    return {
      key,
      value: bonusValue.trim(),
      type: "add",
      priority,
    };
  }

  static addChange(value: string, priority: number, key: string): IActiveEffectChangeData {
    return {
      key,
      value: String(value).trim(),
      type: "add",
      priority,
    };
  }

  static subtractChange(value: string, priority: number, key: string): IActiveEffectChangeData {
    return {
      key,
      value: String(value).trim(),
      type: "subtract",
      priority,
    };
  }

  static customChange(value: string | number, priority: number, key: string): IActiveEffectChangeData {
    return {
      key,
      value: String(value).trim(),
      type: "custom",
      priority,
    };
  }

  static customBonusChange(value: string | number, priority: number, key: string): IActiveEffectChangeData {
    const bonusValue = (Number.isInteger(value) && (value as number) >= 0) // if bonus is a positive integer
      || (!Number.isInteger(value) && !String(value).trim().startsWith("+") && !String(value).trim().startsWith("-")) // not an int and does not start with + or -
      ? `+${value}`
      : value;
    return ChangeHelper.customChange(bonusValue, priority, key);
  }

  static upgradeChange(value: string | number, priority: number, key: string): IActiveEffectChangeData {
    return {
      key,
      value: String(value).trim(),
      type: "upgrade",
      priority,
    };
  }

  static overrideChange(value: string | number, priority: number, key: string): IActiveEffectChangeData {
    return {
      key,
      value: String(value).trim(),
      type: "override",
      priority,
    };
  }

  static multiplyChange(value: string | number, priority: number, key: string): IActiveEffectChangeData {
    return {
      key,
      value: String(value).trim(),
      type: "multiply",
      priority,
    };
  }

  static downgradeChange(value: string | number, priority: number, key: string): IActiveEffectChangeData {
    return {
      key,
      value: String(value).trim(),
      type: "downgrade",
      priority,
    };
  }

  static tokenMagicFXChange(macroValue: string, priority = 20): IActiveEffectChangeData {
    return {
      key: "macro.tokenMagic",
      type: "custom",
      value: macroValue,
      priority: priority,
    };
  }

  static damageResistanceChange(damageType: string, priority = 20): IActiveEffectChangeData {
    return {
      key: "system.traits.dr.value",
      type: "add",
      value: damageType.toLowerCase(),
      priority,
    };
  }

  static atlChange(atlKey: string, type: TActiveEffectChangeType, value: string | number, priority = 20): IActiveEffectChangeData {
    let key = atlKey;

    switch (atlKey) {
      case "ATL.dimLight":
        key = "ATL.light.dim";
        break;
      case "ATL.brightLight":
        key = "ATL.light.bright";
        break;
      case "ATL.lightAnimation":
        key = "ATL.light.animation";
        break;
      case "ATL.lightColor":
        key = "ATL.light.color";
        break;
      case "ATL.lightAlpha":
        key = "ATL.light.alpha";
        break;
      case "ATL.lightAngle":
        key = "ATL.light.angle";
        break;
      // no default
    }

    return {
      key,
      type,
      value: String(value).trim(),
      priority,
    };
  }

  static daeStatusEffectChange(statusName: string, priority = 20): IActiveEffectChangeData {
    return {
      key: "macro.StatusEffect",
      type: "custom",
      phase: "final",
      value: statusName.toLowerCase(),
      priority: priority,
    };
  }

  static addStatusEffectChange({ effect, statusName, priority = 20, level = null }: StatusEffectChangeParams): I5eEffectData {
    if (AutoEffects.effectModules().daeInstalled && utils.getSetting<boolean>("effects-uses-macro-status-effects")) {
      const key = ChangeHelper.daeStatusEffectChange(statusName, priority);
      const system = (effect.system ??= {});
      (system.changes ??= []).push(key);
    } else {
      if (effect.description && effect.description.trim() === "") {
        effect.description = `You have the &Reference[${statusName.toLowerCase()}] status condition.`;
      } else if (effect.description && effect.description.startsWith("You have the &Reference[")) {
        effect.description += `<br> You have the &Reference[${statusName.toLowerCase()}] status condition.`;
      }
      (effect.statuses ??= []).push(utils.camelCase(statusName));
      if (level) foundry.utils.setProperty(effect, `flags.dnd5e.${statusName.toLowerCase().trim()}Level`, level);
    }
    return effect;
  }


  static overTimeDamageChange({ document, turn, damage, damageType, saveAbility, saveRemove, saveDamage, dc }: OverTimeDamageParams): IActiveEffectChangeData {
    const ability = Array.isArray(saveAbility) ? saveAbility[0] : saveAbility;
    return {
      key: "flags.midi-qol.OverTime",
      type: "override",
      value: `turn=${turn},label=${document.name} (${utils.capitalize(turn)} of Turn),damageRoll=${damage},damageType=${damageType},saveRemove=${saveRemove},saveDC=${dc},saveAbility=${ability},saveDamage=${saveDamage},killAnim=true`,
      priority: 20,
    };
  }

  static overTimeSaveChange({ document, turn, saveAbility, saveRemove = true, dc }: OverTimeSaveParams): IActiveEffectChangeData {
    const turnValue = turn === "action" ? "end" : turn;
    const actionSave = turn === "action" ? ",actionSave=true" : "";
    const ability = Array.isArray(saveAbility) ? saveAbility[0] : saveAbility;
    return {
      key: "flags.midi-qol.OverTime",
      type: "override",
      value: `turn=${turnValue},label=${document.name} (${utils.capitalize(turn)} of Turn),saveRemove=${saveRemove},saveDC=${dc},saveAbility=${ability},killAnim=true${actionSave}`,
      priority: 20,
    };
  }

}
