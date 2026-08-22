import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverGrapplingStrike extends Maneuver {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get effects(): IDDBEffectHint[] {
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
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.skills.ath.roll.bonus"),
        ],
      },
    ];
  }

}
