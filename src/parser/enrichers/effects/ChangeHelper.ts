import logger from "../../../lib/Logger";
import utils from "../../../lib/Utils";
import AutoEffects from "./AutoEffects";

interface ChangeParams {
  value: any;
  priority: any;
  key: string;
  // Foundry v13 uses numeric modes; enrichers ported from the v14 branch pass lowercase
  // change type names ("add", "upgrade"). Both spellings and raw numbers are accepted.
  type: string | number;
  // v14-only change phase, accepted so ported call sites compile; ignored on v13.
  phase?: string;
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
  saveAbility: string | string[];
  saveRemove: boolean;
  saveDamage: string;
  dc: any;
}

interface OverTimeSaveParams {
  document: any;
  turn: string;
  saveAbility: string | string[];
  saveRemove?: boolean;
  dc: any;
}

export default class ChangeHelper {

  /**
   * Resolve a change type to a Foundry v13 numeric mode. Accepts a number, an ACTIVE_EFFECT_MODES
   * key ("ADD") or the v14 string type name ("add"). Unknown values fall back to CUSTOM so the
   * change is inert rather than corrupting actor data.
   */
  static modeFor(type: string | number): number {
    if (typeof type === "number") return type;
    const mode = CONST.ACTIVE_EFFECT_MODES[`${type}`.toUpperCase()];
    if (mode === undefined) {
      logger.warn(`Unknown active effect change type "${type}", falling back to CUSTOM`);
      return CONST.ACTIVE_EFFECT_MODES.CUSTOM;
    }
    return mode;
  }

  static change({ value, priority, key, type }: ChangeParams): IActiveEffectChangeData {
    return {
      key,
      value,
      mode: ChangeHelper.modeFor(type),
      priority,
    };
  }


  // Basic Change generation helpers
  static signedAddChange(value: any, priority: any, key: string): IActiveEffectChangeData {
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

  static unsignedAddChange(value: any, priority: any, key: string): IActiveEffectChangeData {
    const bonusValue = `${value}`.trim().replace("+ +", "+").replace(/^\+\s+/, "");
    return {
      key,
      value: bonusValue.trim(),
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority,
    };
  }

  static addChange(value: any, priority: any, key: string): IActiveEffectChangeData {
    return ChangeHelper.unsignedAddChange(value, priority, key);
  }

  /**
   * v13 has no subtract mode; emulate it as an ADD of the negated value. Only safe for numeric or
   * simple formula values, which is all the ported enrichers use it for.
   */
  static subtractChange(value: any, priority: any, key: string): IActiveEffectChangeData {
    const raw = `${value}`.trim();
    const negated = (/^[\d.]+$/).test(raw) ? `-${raw}` : `-(${raw})`;
    return {
      key,
      value: negated,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority,
    };
  }

  static customChange(value: any, priority: any, key: string): IActiveEffectChangeData {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority,
    };
  }

  static customBonusChange(value: any, priority: any, key: string): IActiveEffectChangeData {
    const bonusValue = (Number.isInteger(value) && value >= 0) // if bonus is a positive integer
      || (!Number.isInteger(value) && !value.trim().startsWith("+") && !value.trim().startsWith("-")) // not an int and does not start with + or -
      ? `+${value}`
      : value;
    return ChangeHelper.customChange(bonusValue, priority, key);
  }

  static upgradeChange(value: any, priority: any, key: string): IActiveEffectChangeData {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
      priority,
    };
  }

  static overrideChange(value: any, priority: any, key: string): IActiveEffectChangeData {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority,
    };
  }

  static multiplyChange(value: any, priority: any, key: string): IActiveEffectChangeData {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
      priority,
    };
  }

  static downgradeChange(value: any, priority: any, key: string): IActiveEffectChangeData {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.DOWNGRADE,
      priority,
    };
  }

  /**
   * A change consumed by Automated Conditions 5e via its `flags.automated-conditions-5e.*` keys.
   * The v14 branch registers a dedicated "ac5e" change type; on v13 AC5e documents these flags
   * as Override changes, so that mode is used here. Only pushed when AC5e is installed (see the
   * `ac5eChanges` hint handling in DDBEnricherFactoryMixin).
   */
  static ac5eChange(value: string | number, priority: number, key: string, _phase = "initial"): IActiveEffectChangeData {
    return {
      key,
      value: `${value}`.trim(),
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority,
    };
  }

  static tokenMagicFXChange(macroValue: string, priority = 20): IActiveEffectChangeData {
    return {
      key: "macro.tokenMagic",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: macroValue,
      priority: priority,
    };
  }

  static damageResistanceChange(damageType: string, priority = 20): IActiveEffectChangeData {
    return {
      key: "system.traits.dr.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: damageType.toLowerCase(),
      priority,
    };
  }

  static damageVulnerabilityChange(damageType: string, priority = 20): IActiveEffectChangeData {
    return {
      key: "system.traits.dv.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: damageType.toLowerCase(),
      priority,
    };
  }

  static damageImmunityChange(damageType: string, priority = 20): IActiveEffectChangeData {
    return {
      key: "system.traits.di.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: damageType.toLowerCase(),
      priority,
    };
  }

  static conditionImmunityChange(condition: string, priority = 20): IActiveEffectChangeData {
    return {
      key: "system.traits.ci.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
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

  // this can now be removed once changes refactored
  static atlChange(atlKey: string, mode: number | string, value: any, priority = 20): IActiveEffectChangeData {
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
      mode: ChangeHelper.modeFor(mode),
      value,
      priority,
    };
  }

  static daeStatusEffectChange(statusName: string, priority = 20): IActiveEffectChangeData {
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


  static overTimeDamageChange({ document, turn, damage, damageType, saveAbility, saveRemove, saveDamage, dc }: OverTimeDamageParams): IActiveEffectChangeData {
    const ability = Array.isArray(saveAbility) ? saveAbility[0] : saveAbility;
    return {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
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
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `turn=${turnValue},label=${document.name} (${utils.capitalize(turn)} of Turn),saveRemove=${saveRemove},saveDC=${dc},saveAbility=${ability},killAnim=true${actionSave}`,
      priority: 20,
    };
  }

}
