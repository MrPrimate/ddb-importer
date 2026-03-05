import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverBaitAndSwitch extends Maneuver {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Maneuver: Bait and Switch",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.attributes.ac.bonus"),
        ],
        daeSpecialDurations: ["turnStartSource" as const],
      },
    ];
  }

}
