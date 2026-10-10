import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Corrupted Ranger (Failing Lungs): stealing a breath consumes every curse marker for 1d4 necrotic
 * each. The marker count is not tracked, so each scaling step adds a marker's die.
 */
export default class FailingLungsStealBreath extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      activationCondition: "A creature you can see (it can't take reactions until the start of your next turn and, if Large or smaller, falls Prone)",
      noTemplate: true,
      data: {
        consumption: {
          targets: [],
          scaling: { allowed: true, max: "4" },
        },
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["necrotic"], scalingMode: "whole", scalingNumber: 1 })],
        },
      },
    };
  }

}
