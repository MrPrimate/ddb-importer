import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Plague Doctor: a dose crafted with a spell slot heals 1d8 per slot level when drunk or administered
 * as a Bonus Action (scaling step = slot level - 1); a 3rd-level or higher dose also ends Poisoned.
 * The slot is spent when the dose is crafted, so drinking it consumes nothing.
 */
export default class GoodMedicine extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Drink or Administer",
      targetType: "creature",
      targetCount: 1,
      activationType: "bonus",
      noConsumeTargets: true,
      data: {
        range: { override: true, value: "5", units: "ft" },
        consumption: {
          targets: [],
          scaling: { allowed: true, max: "8" },
        },
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 8,
          types: ["healing"],
          scalingMode: "whole",
          scalingNumber: 1,
        }),
      },
    };
  }

}
