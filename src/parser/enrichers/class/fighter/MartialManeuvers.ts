import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Blade Breaker: Martial Maneuvers describes the maneuver point pool, two points per fighter level,
 * which every Blade Breaker maneuver spends as `maneuver-points`.
 */
export default class MartialManeuvers extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get identifier(): string | null {
    return "maneuver-points";
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Maneuver Points",
        max: "2 * @classes.fighter.levels",
        period: "lr",
      }),
    };
  }

}
