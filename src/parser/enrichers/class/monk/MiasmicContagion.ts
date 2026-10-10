import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Pestilent Haze Scurrying Spread: during a Step of the Wind you paid for, each creature of your
 * choice you move within 5 feet of saves (Constitution, Monk save DC, with Disadvantage from
 * Choking Miasma) or is cursed by your Miasmic Plague, once per turn. Step of the Wind pays the cost.
 */
export default class MiasmicContagion extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Scurrying Spread",
      targetType: "creature",
      targetCount: 1,
      noTemplate: true,
      noConsumeTargets: true,
      activationType: "special",
      activationCondition: "During your Step of the Wind, you enter a space within 5 feet of the creature (once per turn per creature)",
      data: {
        save: {
          ability: ["con"],
          dc: { calculation: "wis", formula: "" },
        },
      },
    };
  }

}
