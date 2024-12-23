/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";
import Maneuver from "./Maneuver.mjs";

export default class ManeuverAmbush extends Maneuver {

  get type() {
    return "utility";
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
        daeSpecialDurations: ["isSkill.ste", "Initiative"],
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
