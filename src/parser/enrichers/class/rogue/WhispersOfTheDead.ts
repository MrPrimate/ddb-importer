import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Whispers of the Dead (Phantom): the skill or tool proficiency chosen on a rest is a sheet
 * edit; the activity gives the feature a usable entry for the rest-time choice.
 */
export default class WhispersOfTheDead extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Choose Proficiency",
      activationType: "special",
      activationCondition: "When you finish a Short or Long Rest",
      targetType: "self",
      rangeSelf: true,
    };
  }

}
