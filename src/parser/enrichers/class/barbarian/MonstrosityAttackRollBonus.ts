import DDBEnricherData from "../../data/DDBEnricherData";

/** Path of the Experiment Monstrosity serum: once per turn, add your Rage Damage bonus to a missed Strength attack roll. */
export default class MonstrosityAttackRollBonus extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "Once per turn, you miss with an attack roll that relies on Strength",
      addItemConsume: true,
      data: {
        roll: { prompt: false, visible: true, formula: "@scale.barbarian.rage-damage", name: "Attack Roll Bonus" },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: { spent: null, max: "1", recovery: [{ period: "turn", type: "recoverAll" }] },
    };
  }

}
