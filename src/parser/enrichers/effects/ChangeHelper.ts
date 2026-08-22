import utils from "../../../lib/Utils";
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

  static ac5eChange(value: string | number, priority: number, key: string, phase: TActiveEffectChangePhase = "initial"): IAC5eActiveEffectChangeData {
    return {
      key,
      value: String(value).trim(),
      type: "ac5e",
      priority,
      phase,
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

  /** Add a named calc (`CONFIG.DND5E.armorClasses` key) to `ac.calcs`; the system takes the max of all applicable calcs. */
  static acCalcsAddChange(calc: string, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.addChange(calc, priority, "system.attributes.ac.calcs");
  }

  /** Add an AC formula; the system coerces the string to `{formula, label: effect.name}` and takes the max. */
  static acFormulaAddChange(formula: string, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.addChange(formula, priority, "system.attributes.ac.formulas");
  }

  /** Hard override of the final AC value — bypasses shield/bonus/cover stacking, so prefer calcs/formulas. */
  static acOverrideChange(value: string | number, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.overrideChange(value, priority, "system.attributes.ac.override");
  }

  /** Flat bonus/penalty to all speeds, e.g. "10" or "-10"; applied as max(0, speed + bonus) * multiplier. */
  static movementBonusChange(value: string | number, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.addChange(String(value), priority, "system.attributes.movement.bonus");
  }

  /** Multiply all speeds, e.g. "2", "0.5", or "0" for no movement (movement.multiplier starts at 1). */
  static movementMultiplierChange(value: string | number, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.multiplyChange(value, priority, "system.attributes.movement.multiplier");
  }

  /** Rule-type change adding a bonus to all healing rolls; the key is the rule category, not a data path. */
  static healingBonusChange(value: string | number, priority = 20): IActiveEffectChangeData {
    return {
      key: "healing",
      value: String(value).trim().replace(/^\+\s*/, ""),
      type: "dnd5e.bonus",
      priority,
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

  static damageVulnerabilityChange(damageType: string, priority = 20): IActiveEffectChangeData {
    return {
      key: "system.traits.dv.value",
      type: "add",
      value: damageType.toLowerCase(),
      priority,
    };
  }

  static damageImmunityChange(damageType: string, priority = 20): IActiveEffectChangeData {
    return {
      key: "system.traits.di.value",
      type: "add",
      value: damageType.toLowerCase(),
      priority,
    };
  }

  static conditionImmunityChange(condition: string, priority = 20): IActiveEffectChangeData {
    return {
      key: "system.traits.ci.value",
      type: "add",
      value: condition.toLowerCase(),
      priority,
    };
  }


  // Advantage/disadvantage ("roll mode") change helpers.
  //
  // dnd5e counts the sources pushed at a roll mode key and resolves them at the end, so these
  // stack safely with any other source of advantage or disadvantage. Prefer them over the midi
  // and ac5e flags: the core keys work with no modules installed.

  /** CONFIG is not populated when this module is imported, so these must be getters. */
  static get ADVANTAGE(): number {
    return CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE;
  }

  static get DISADVANTAGE(): number {
    return CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE;
  }

  static get NORMAL(): number {
    return CONFIG.Dice.D20Roll.ADV_MODE.NORMAL;
  }

  /** For a key this class has no named helper for, or a mode decided at runtime. */
  static rollModeChange(key: string, mode: number | string, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.addChange(`${mode}`, priority, key);
  }

  static abilityCheckRollModeChange(ability: string, mode: number | string, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.rollModeChange(`system.abilities.${ability}.check.roll.mode`, mode, priority);
  }

  static abilitySaveRollModeChange(ability: string, mode: number | string, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.rollModeChange(`system.abilities.${ability}.save.roll.mode`, mode, priority);
  }

  static skillRollModeChange(skill: string, mode: number | string, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.rollModeChange(`system.skills.${skill}.roll.mode`, mode, priority);
  }

  static advantageAbilityCheckChange(ability: string, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.abilityCheckRollModeChange(ability, ChangeHelper.ADVANTAGE, priority);
  }

  static disadvantageAbilityCheckChange(ability: string, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.abilityCheckRollModeChange(ability, ChangeHelper.DISADVANTAGE, priority);
  }

  static advantageAbilitySaveChange(ability: string, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.abilitySaveRollModeChange(ability, ChangeHelper.ADVANTAGE, priority);
  }

  static disadvantageAbilitySaveChange(ability: string, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.abilitySaveRollModeChange(ability, ChangeHelper.DISADVANTAGE, priority);
  }

  static advantageSkillChange(skill: string, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.skillRollModeChange(skill, ChangeHelper.ADVANTAGE, priority);
  }

  static disadvantageSkillChange(skill: string, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.skillRollModeChange(skill, ChangeHelper.DISADVANTAGE, priority);
  }

  static advantageInitiativeChange(priority = 20): IActiveEffectChangeData {
    return ChangeHelper.rollModeChange("system.attributes.init.roll.mode", ChangeHelper.ADVANTAGE, priority);
  }

  static disadvantageInitiativeChange(priority = 20): IActiveEffectChangeData {
    return ChangeHelper.rollModeChange("system.attributes.init.roll.mode", ChangeHelper.DISADVANTAGE, priority);
  }

  static advantageDeathSaveChange(priority = 20): IActiveEffectChangeData {
    return ChangeHelper.rollModeChange("system.attributes.death.roll.mode", ChangeHelper.ADVANTAGE, priority);
  }

  static disadvantageDeathSaveChange(priority = 20): IActiveEffectChangeData {
    return ChangeHelper.rollModeChange("system.attributes.death.roll.mode", ChangeHelper.DISADVANTAGE, priority);
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
