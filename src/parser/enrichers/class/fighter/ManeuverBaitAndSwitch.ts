import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverBaitAndSwitch extends Maneuver {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "special",
      targetType: "creature",
      data: {
        range: {
          value: 5,
          units: "ft",
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Maneuver: Bait and Switch",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.attributes.ac.bonus"),
        ],
        daeSpecialDurations: ["turnStartSource"],
      },
    ];
  }

}
