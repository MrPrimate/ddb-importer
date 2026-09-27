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

  static SPEED_MODES = ["walk", "burrow", "climb", "fly", "swim"] as const;

  /**
   * "Its speed can be no higher than X": cap each movement mode the creature has at `limit`.
   * dnd5e 5.x turns a DOWNGRADE on an unset (null) mode into an OVERRIDE, which would grant that
   * mode, so each mode first gets an ADD of 0 one priority earlier (null becomes 0 and stays 0).
   * Priority 50 runs after the priority-20 grants and bonuses of other effects, so they are capped too.
   */
  static speedCapChanges(
    limit: string | number, priority = 50, modes: readonly string[] = ChangeHelper.SPEED_MODES,
  ): IActiveEffectChangeData[] {
    return modes.flatMap((mode) => {
      const key = `system.attributes.movement.${mode}`;
      return [
        ChangeHelper.addChange("0", priority - 1, key),
        ChangeHelper.downgradeChange(`${limit}`, priority, key),
      ];
    });
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

  /** Flat bonus/penalty to all speeds, e.g. "10" or "-10"; dnd5e applies it as max(0, speed + bonus). */
  static movementBonusChange(value: string | number, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.addChange(String(value), priority, "system.attributes.movement.bonus");
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

  /** Saves to maintain concentration, which dnd5e rolls apart from the Constitution save. */
  static concentrationRollModeChange(mode: number | string, priority = 20): IActiveEffectChangeData {
    return ChangeHelper.rollModeChange("system.attributes.concentration.roll.mode", mode, priority);
  }

  /**
   * Active Token Effects change. dnd5e 5.3 does not sync token vision, detection modes or size from
   * the actor, so those stay on ATL; lights use native `token.light.*` changes.
   */
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
  /**
   * Build a change targeting the token document (`token.light.dim`, `token.sight.range`,
   * `token.detectionModes.<id>.range`, `token.texture.src`...), which Foundry applies
   * natively. Legacy `ATL.*` keys from older enrichers and macros are translated.
   */
  static tokenChange(tokenKey: string, type: TActiveEffectChangeType, value: string | number, priority = 20): IActiveEffectChangeData {
    const legacyAliases: Record<string, string> = {
      "ATL.dimLight": "ATL.light.dim",
      "ATL.brightLight": "ATL.light.bright",
      "ATL.lightAnimation": "ATL.light.animation",
      "ATL.lightColor": "ATL.light.color",
      "ATL.lightAlpha": "ATL.light.alpha",
      "ATL.lightAngle": "ATL.light.angle",
    };
    const key = (legacyAliases[tokenKey] ?? tokenKey).replace(/^ATL\./, "token.");

    return {
      key,
      type,
      value: String(value).trim(),
      priority,
    };
  }

  /**
   * Grant a token detection mode (`seeInvisibility`, `seeAll`, `blindsight`...) through native token changes.
   *
   * Both keys must be overrides. Token changes apply after `TokenDocument#_prepareDetectionModes` has filled
   * defaults, so a change that creates the entry would otherwise leave `enabled` undefined (and the mode is
   * skipped), and an upgrade against a missing entry compares `delta > undefined` and changes nothing.
   * Range must be finite: the field rejects Infinity, so pass a large distance for "unlimited" senses.
   */
  static detectionModeChanges(modeId: string, range: number, priority = 20): IActiveEffectChangeData[] {
    return [
      ChangeHelper.tokenChange(`token.detectionModes.${modeId}.enabled`, "override", "true", priority),
      ChangeHelper.tokenChange(`token.detectionModes.${modeId}.range`, "override", range, priority),
    ];
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
