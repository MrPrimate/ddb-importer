import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Warrior of the Street Special Move: after an Unarmed Strike hit, 1 Focus Point knocks a Large or
 * smaller target Prone. The 5-foot push and the size limit are left to the player.
 */
export default class SpecialMoveUppercut extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Uppercut",
      targetType: "creature",
      activationType: "special",
      activationCondition: "You hit a creature with an Unarmed Strike and deal damage",
      addItemConsume: true,
      itemConsumeTargetName: "Monk's Focus",
      itemConsumeValue: "1",
      data: {
        range: { value: "5", units: "ft" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Uppercut: Prone",
        // the move merges into Special Moves beside the other moves, which must not apply it
        activityMatch: "Uppercut",
        statuses: ["Prone"],
        options: {
          description: "Only a Large or smaller target falls Prone. You can also push it up to 5 feet away from you.",
        },
      },
    ];
  }

}
