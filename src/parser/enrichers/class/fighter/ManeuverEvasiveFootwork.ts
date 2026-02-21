import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverEvasiveFootwork extends Maneuver {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      addItemConsumed: true,
      activationType: "special",
    };
  }

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
