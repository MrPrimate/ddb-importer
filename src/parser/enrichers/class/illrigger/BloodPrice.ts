import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Blood Price spends a Hit Die (the parser's hitDice consumption) and rolls the largest one the
 * character has, which after multiclassing may not be the illrigger's d10.
 */
export default class BloodPrice extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Blood Price",
      activationType: "special",
      activationCondition: "When you fail a saving throw; add the roll to the save",
      targetType: "self",
      rangeSelf: true,
      data: {
        roll: {
          name: "Hit Die",
          formula: "1d(@attributes.hd.largestFace)",
          prompt: false,
          visible: true,
        },
      },
    };
  }

}
