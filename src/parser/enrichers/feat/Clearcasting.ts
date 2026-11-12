import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Clearcasting (World of Warcraft): a Reaction to a spell attack Critical Hit lets the character cast
 * an action cantrip. Force Adept (treat 1s on Force damage dice as 2s) stays description.
 */
export default class Clearcasting extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Clearcasting",
      activationType: "reaction",
      activationCondition: "You score a Critical Hit with a spell's attack roll",
      targetType: "self",
    };
  }

}
