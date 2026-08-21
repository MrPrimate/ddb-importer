import logger from "../../../lib/Logger";
import DDBModifiers from "../../lib/DDBModifiers";
import ChangeHelper from "./ChangeHelper";

const BASE_RESTRICTIONS = [
  "",
  null,
  "while wearing heavy armor",
  "while not wearing heavy armor",
  "While holding the staff",
];

export default class ACBonusEffects {

  // public signature stays I5eEffectData: external callers reset/guard `system` themselves
  static ACEffect(name: string): I5eEffectData {
    const effect: TChangeEffect = {
      name,
      system: { changes: [] },
      duration: {
        value: null,
        units: "seconds",
        expiry: null,
        expired: false,
      },
      tint: "",
      disabled: true,
      transfer: true,
      img: "icons/svg/shield.svg",
    };
    return effect;
  }

  static addAddBonusChanges(modifiers: IModifiersMod[], name: string, type: string, key: string): IActiveEffectChangeData[] {
    const changes: IActiveEffectChangeData[] = [];
    // const bonus = DDBModifiers.filterModifiersOld(modifiers, "bonus", type).reduce((a, b) => a + b.value, 0);
    const bonus = DDBModifiers.getValueFromModifiers(modifiers, name, type, "bonus");
    if (bonus) {
      logger.debug(`Generating ${type} bonus for ${name}`, bonus);
      changes.push(ChangeHelper.unsignedAddChange(`+ ${bonus}`, 18, key));
    }
    return changes;
  }

  static addACBonusEffect(modifiers: IModifiersMod[], name: string, subType: string, restrictions = BASE_RESTRICTIONS): IActiveEffectChangeData[] {
    const bonusModifiers = DDBModifiers.filterModifiersOld(modifiers, "bonus", subType, restrictions);
    const changes = ACBonusEffects.addAddBonusChanges(bonusModifiers, name, subType, "system.attributes.ac.bonus");
    if (changes.length > 0) logger.debug(`Generating ${subType} bonus for ${name}`);

    return changes;
  }

  static generateBonusACEffect(modifiers: IModifiersMod[], label: string, subType: string, restrictions: string[] = [], alwaysActive = true): I5eEffectData {
    const effect = ACBonusEffects.ACEffect(label);

    effect.flags = {
      dae: { transfer: true, armorEffect: true },
      ddbimporter: { disabled: !alwaysActive, itemId: null, entityTypeId: null, characterEffect: true },
    };
    // effect.disabled = !alwaysActive;
    effect.disabled = false;
    effect.origin = "AC";

    const changes = ACBonusEffects.addACBonusEffect(modifiers, label, subType, restrictions);
    if (changes.length > 0) (effect.system ??= {}).changes = changes;

    return effect;
  }

  /**
   * dnd5e 6.0 AC formula effect: adds one entry to `ac.formulas[]` and lets the
   * system take the max of all applicable formulas. The string value is coerced
   * by the system's ACFormulasField into {formula, label: effect.name}, so the
   * effect name doubles as the formula label on the sheet.
   *
   * This is the 6.0 replacement for generateFixedACEffect's calc:"custom" +
   * formula override pair.
   */
  static generateACFormulaEffect(formula: string, label: string, alwaysActive = false, priority = 20): I5eEffectData {
    const effect = ACBonusEffects.ACEffect(label);

    effect.flags = {
      dae: { transfer: true, armorEffect: true },
      ddbimporter: { disabled: !alwaysActive, itemId: null, entityTypeId: null, characterEffect: true },
    };
    effect.disabled = false;
    effect.origin = "AC";

    const system = (effect.system ??= {});
    (system.changes ??= []).push(ChangeHelper.acFormulaAddChange(formula, priority));

    return effect;
  }

  /**
   *
   * Generate an effect given inputs for AC
   * This is a high priority set effect that will typically override all other AE.
   * @param {string} formula
   * @param {string} label
   * @param {boolean} alwaysActive
   * @param {number} priority
   * @param {TActiveEffectChangeType} type
   * @returns {object} effect
   */
  static generateFixedACEffect(formula: string, label: string, alwaysActive = false, priority = 30, type: TActiveEffectChangeType = "override"): I5eEffectData {
    const effect = ACBonusEffects.ACEffect(label);

    effect.flags = {
      dae: { transfer: true, armorEffect: true },
      ddbimporter: { disabled: !alwaysActive, itemId: null, entityTypeId: null, characterEffect: true },
    };
    // effect.disabled = !alwaysActive;
    effect.disabled = false;
    effect.origin = "AC";

    const formulaChange: IActiveEffectChangeData = { key: "system.attributes.ac.formula", value: formula, type, priority };
    const calcChange: IActiveEffectChangeData = { key: "system.attributes.ac.calc", value: "custom", type, priority };
    const system = (effect.system ??= {});
    (system.changes ??= []).push(calcChange, formulaChange);

    return effect;
  }


}
