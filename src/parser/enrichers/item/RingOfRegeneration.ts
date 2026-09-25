import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Ring of Regeneration: 1d6 hit points every 10 minutes while at least 1 hit point.
 */
export default class RingOfRegeneration extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "Every 10 minutes while you have at least 1 Hit Point",
      targetType: "self",
      rangeSelf: true,
      data: { healing: DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["healing"] }) },
    };
  }

}
