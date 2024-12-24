/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";
import Maneuver from "./Maneuver.mjs";

export default class ManeuverLungingAttack extends Maneuver {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Lunge",
      activationType: "special",
      addItemConsume: true,
    };
  }

  get additionalActivities() {
    return [
      this.extraDamageActivity(),
    ];
  }

  get effects() {
    return [
      {
        name: "Lunging Attack Bonus Damage",
        daeSpecialDurations: ["1Attack"],
        data: {
          duration: {
            turns: 1,
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.bonuses.mwak.damage"),
        ],
      },
    ];
  }

}
