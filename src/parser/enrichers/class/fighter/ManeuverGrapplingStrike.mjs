/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";
import Maneuver from "./Maneuver.mjs";

export default class ManeuverGrapplingStrike extends Maneuver {

  get type() {
    return "utility";
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
