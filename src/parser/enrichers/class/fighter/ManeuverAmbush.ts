import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverAmbush extends Maneuver {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ambush Bonus",
        daeSpecialDurations: ["isSkill.ste" as const, "Initiative" as const],
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: null,
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.skills.ste.bonuses.check"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.attributes.init.bonus"),
        ],
      },
    ];
  }

}
