import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverGrapplingStrike extends Maneuver {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Grappling Strike Bonus",
        daeSpecialDurations: ["isSkill.ath" as const],
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: null,
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.skills.ath.bonuses.check"),
        ],
      },
    ];
  }

}
