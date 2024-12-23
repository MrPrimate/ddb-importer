/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";
import Maneuver from "./Maneuver.mjs";

export default class ManeuverEvasiveFootwork extends Maneuver {

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
