import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Blade Breaker: the maneuver list. Each chosen maneuver is its own document carrying its action,
 * and Martial Maneuvers holds the point pool, so the list keeps none of DDB's maneuver actions.
 */
export default class BladeBreakerManeuvers extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

}
