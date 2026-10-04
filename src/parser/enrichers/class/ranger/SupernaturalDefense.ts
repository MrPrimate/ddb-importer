import DDBEnricherData from "../../data/DDBEnricherData";

/** Monster Slayer: add 1d6 to saves the Slayer's Prey target forces and to checks to escape its grapple. */
export default class SupernaturalDefense extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "The target of your Slayer's Prey forces you to make a saving throw, or you try to escape its grapple",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d6",
          name: "Bonus to Roll",
        },
      },
    };
  }

}
