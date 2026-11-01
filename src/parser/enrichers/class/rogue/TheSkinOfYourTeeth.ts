import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Fortune Rogue (OTFY). The third fortuitous roll comes from the fortuitous-rolls scale; replacing
 * damage taken (100 or less, you or an ally within 60 feet) spends one of Boon of Fortuity's rolls.
 */
export default class TheSkinOfYourTeeth extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Replace Damage",
      activationType: "special",
      activationCondition: "You or an ally within 60 feet takes 100 damage or less",
      targetType: "ally",
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "boon-of-fortuity",
          value: "1",
          scaling: { mode: "", formula: "" },
        },
      ],
      data: {
        range: { units: "ft", value: "60" },
      },
    };
  }

}
