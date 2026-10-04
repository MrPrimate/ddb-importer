import DDBEnricherData from "../../data/DDBEnricherData";

/** Waxwork Rogue enchantment: 5 temporary hit points per Wick Point spent (up to 3 points, 15 temporary hit points) for 24 hours. */
export default class ShieldingSeal extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "wick-points",
      addScalingMode: "amount",
      addConsumptionScalingMax: "3",
      data: {
        range: { override: true, units: "touch" },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "5",
          types: ["temphp"],
          scalingMode: "whole",
          scalingFormula: "5",
        }),
      },
    };
  }

}
