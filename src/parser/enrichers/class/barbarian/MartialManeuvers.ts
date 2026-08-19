import DDBEnricherData from "../../data/DDBEnricherData";

export default class MartialManeuvers extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get identifier(): string | null {
    return "maneuver-points";
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Maneuver Points",
      max: "2 * @classes.barbarian.levels",
      period: "lr",
    });
    return {
      uses,
    };
  }

}
