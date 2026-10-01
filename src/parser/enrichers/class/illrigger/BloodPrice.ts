import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Blood Price spends a Hit Die (the parser's "largest" hitDice consumption) and rolls the die it
 * spent, which after multiclassing, or once no d10 Hit Dice are left, may be a smaller die.
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
          formula: "@consumed.hd",
          prompt: false,
          visible: true,
        },
      },
    };
  }

}
