import DDBEnricherData from "../../data/DDBEnricherData";

export default class FanTheHammer extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  // the two extra attacks are rolled with the weapon itself, so the activity
  // exists to spend the Risk Die and carry the caveats; the Risk Die
  // consumption itself comes from the description parse
  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      activationCondition:
        "You take the Attack action with a Ranged weapon that lacks the Two-Handed property and have a free hand (the two extra attacks always have Disadvantage and cannot use the Automatic mastery property)",
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        name: "Fan the Hammer",
      },
    };
  }

}
