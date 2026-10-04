import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Blood Domain: a damaging instantaneous spell of 1st level or higher deals extra Necrotic damage of
 * 2 plus the spell's level to creatures with blood (scaling step = spell level - 1).
 */
export default class BloodlettingFocus extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "A creature with blood takes damage from your instantaneous spell of 1st level or higher",
      data: {
        consumption: { targets: [], scaling: { allowed: true, max: "8" } },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ customFormula: "3", types: ["necrotic"], scalingMode: "whole", scalingFormula: "1" }),
          ],
        },
      },
    };
  }

}
