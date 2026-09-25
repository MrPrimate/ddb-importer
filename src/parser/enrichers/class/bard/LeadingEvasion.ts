import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Leading Evasion (College of Dance, 2024): a passive that shares the bard's Evasion with
 * adjacent creatures making the same save. The utility marks the trigger so it can be used
 * from the sheet when the save happens.
 */
export default class LeadingEvasion extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "When you are subjected to an effect that allows a Dexterity save for half damage, creatures within 5 feet making the same save share your Evasion",
      targetType: "creature",
      rangeType: "ft",
      rangeValue: 5,
    };
  }

}
