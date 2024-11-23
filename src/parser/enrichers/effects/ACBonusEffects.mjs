import { logger, DDBHelper } from "../../../lib/_module.mjs";
import ChangeHelper from "./ChangeHelper.mjs";

export default class ACBonusEffects {

  static ACEffect(name) {
    let effect = {
      name,
      changes: [],
      duration: {
        seconds: null,
        startTime: null,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null,
      },
      origin: null,
      tint: "",
      disabled: true,
      transfer: true,
      selectedKey: [],
      img: "icons/svg/shield.svg",
    };
    return effect;
  }

  static addAddBonusChanges(modifiers, name, type, key) {
    let changes = [];
    // const bonus = DDBHelper.filterModifiersOld(modifiers, "bonus", type).reduce((a, b) => a + b.value, 0);
    const bonus = DDBHelper.getValueFromModifiers(modifiers, name, type, "bonus");
    if (bonus) {
      logger.debug(`Generating ${type} bonus for ${name}`, bonus);
      changes.push(ChangeHelper.unsignedAddChange(`+ ${bonus}`, 18, key));
    }
    return changes;
  }

  static addACBonusEffect(modifiers, name, subType, restrictions = ["while wearing heavy armor", "while not wearing heavy armor", "", null]) {
    const bonusModifiers = DDBHelper.filterModifiersOld(modifiers, "bonus", subType, restrictions);
    const changes = ACBonusEffects.addAddBonusChanges(bonusModifiers, name, subType, "system.attributes.ac.bonus");
    if (changes.length > 0) logger.debug(`Generating ${subType} bonus for ${name}`);

    return changes;
  }

  static generateBonusACEffect(modifiers, label, subType, restrictions = [], alwaysActive = true) {
    let effect = ACBonusEffects.ACEffect(label);

    effect.flags = {
      dae: { transfer: true, armorEffect: true },
      ddbimporter: { disabled: !alwaysActive, itemId: null, entityTypeId: null, characterEffect: true },
    };
    // effect.disabled = !alwaysActive;
    effect.disabled = false;
    effect.origin = "AC";

    const changes = ACBonusEffects.addACBonusEffect(modifiers, label, subType, restrictions);
    if (changes.length > 0) effect.changes = changes;

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
   * @param {number} mode
   * @returns {object} effect
   */
  static generateFixedACEffect(formula, label, alwaysActive = false, priority = 30, mode = CONST.ACTIVE_EFFECT_MODES.OVERRIDE) {
    let effect = ACBonusEffects.ACEffect(label);

    effect.flags = {
      dae: { transfer: true, armorEffect: true },
      ddbimporter: { disabled: !alwaysActive, itemId: null, entityTypeId: null, characterEffect: true },
    };
    // effect.disabled = !alwaysActive;
    effect.disabled = false;
    effect.origin = "AC";

    const formulaChange = { key: "system.attributes.ac.formula", value: formula, mode, priority };
    const calcChange = { key: "system.attributes.ac.calc", value: "custom", mode, priority };
    effect.changes.push(calcChange, formulaChange);

    return effect;
  }


}
