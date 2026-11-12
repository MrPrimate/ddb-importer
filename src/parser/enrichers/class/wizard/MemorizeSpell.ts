import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Swapping a prepared spell is done by hand on the spellbook; the activity only puts the feature
 * on the Short Rest chat card, as the official SRD item does.
 */
export default class MemorizeSpell extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Memorize",
      activationType: "shortRest",
      targetType: "self",
      noConsumeTargets: true,
    };
  }

}
