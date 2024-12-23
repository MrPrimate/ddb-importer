/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";
import Maneuver from "./Maneuver.mjs";

export default class ManeuverCommandersStrike extends Maneuver {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Commander's Strike",
      targetType: "ally",
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
        midiOnly: true,
        activityMatch: "Commander's Strike",
        daeSpecialDurations: ["1Attack"],
        data: {
          duration: {
            turns: 2,
          },
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.bonuses.rwak.damage"),
        ],
      },
    ];
  }

}
