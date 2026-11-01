import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Correspondence (OTFY): the Wisdom save only guards the sealed envelope against someone other than
 * the recipient opening it, days later, so the cast is a utility rather than a save against a target.
 */
export default class Correspondence extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Record Message",
      targetType: "creature",
    };
  }

}
