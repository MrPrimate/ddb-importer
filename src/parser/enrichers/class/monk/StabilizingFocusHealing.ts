import DDBEnricherData from "../../data/DDBEnricherData";

/** Warrior of the Celestial: touch a Bloodied creature and spend Focus Points; it regains 5 Hit Points per point (up to half its maximum). */
export default class StabilizingFocusHealing extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      activationCondition: "Touch a Bloodied creature (healing stops at half its Hit Point maximum)",
      addItemConsume: true,
      itemConsumeTargetName: "monks-focus",
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        range: { override: true, units: "touch" },
        consumption: { scaling: { allowed: true, max: "" } },
        healing: DDBEnricherData.basicDamagePart({ customFormula: "5", types: ["healing"], scalingMode: "whole", scalingFormula: "5" }),
      },
    };
  }

}
