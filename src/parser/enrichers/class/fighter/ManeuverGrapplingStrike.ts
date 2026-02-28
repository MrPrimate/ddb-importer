import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverGrapplingStrike extends Maneuver {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get effects() {
    return [
      {
        name: "Grappling Strike Bonus",
        daeSpecialDurations: ["isSkill.ath"],
        data: {
          duration: {
            turns: 1,
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.skills.ath.bonuses.check"),
        ],
      },
    ];
  }

}
