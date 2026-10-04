import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Blood Magic: reroll up to your Intelligence modifier (minimum one) of a spell's damage dice by
 * taking Necrotic damage equal to the spell's level, which can't be reduced (scaling step = spell
 * level - 1).
 */
export default class SanguineBurst extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Life Force Cost",
      targetType: "self",
      rangeSelf: true,
      activationType: "special",
      activationCondition: "You roll damage for a spell of 1st level or higher and reroll up to your Intelligence modifier of its dice",
      data: {
        consumption: { targets: [], scaling: { allowed: true, max: "8" } },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ customFormula: "1", types: ["necrotic"], scalingMode: "whole", scalingFormula: "1" }),
          ],
        },
      },
    };
  }

}
