import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Wand of Enemy Detection: the 60-foot radius the detection covers.
 */
export default class WandOfEnemyDetection extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Detect Hostile Creature",
      addItemConsume: true,
      data: { target: { template: { type: "radius", size: "60", units: "ft", count: "" } } },
    };
  }

}
