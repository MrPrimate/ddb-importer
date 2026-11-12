import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Will to Survive (World of Warcraft, Human origin feat): while Incapacitated but not Unconscious,
 * ignore the Incapacitated condition on your turn and gain an Exhaustion level.
 */
export default class WillToSurvive extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Will to Survive",
      activationType: "special",
      activationCondition: "You have the Incapacitated condition but not the Unconscious condition, on your turn",
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Will to Survive",
        options: {
          expiry: "turnEnd",
          description: "You ignore the Incapacitated condition this turn. You gain 1 Exhaustion level.",
        },
      },
    ];
  }

}
