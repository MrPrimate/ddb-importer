import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverAmbush extends Maneuver {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      activationType: "special",
      targetType: "self",
    };
  }

  get effects() {
    return [
      {
        name: "Ambush Bonus",
        daeSpecialDurations: ["isSkill.ste" as const, "Initiative" as const],
        data: {
          duration: {
            turns: 1,
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
