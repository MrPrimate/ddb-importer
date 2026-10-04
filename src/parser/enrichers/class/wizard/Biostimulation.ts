import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * School of Biomancy: casting a biomancy spell with a slot heals you or the target twice the spell's
 * level. Nothing records the slot, so the scaling step is the spell level minus one.
 */
export default class Biostimulation extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "You cast a biomancy spell of 1st level or higher with a spell slot (heals you or the target)",
      data: {
        consumption: {
          targets: [],
          scaling: { allowed: true, max: "8" },
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "2",
          types: ["healing"],
          scalingMode: "whole",
          scalingFormula: "2",
        }),
      },
    };
  }

}
