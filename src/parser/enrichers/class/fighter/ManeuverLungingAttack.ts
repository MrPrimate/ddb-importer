import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverLungingAttack extends Maneuver {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Lunge",
      // 2024: "As a Bonus Action ... take the Dash action"
      activationType: this.is2014 ? "special" : "bonus",
      addItemConsume: true,
    };
  }

  // the die is rolled by the Damage activity alone, as in the official content: an effect adding it
  // to weapon damage double counted it, or was deleted by DAE / AC5e before the damage roll
  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this.extraDamageActivity(),
    ];
  }

}
