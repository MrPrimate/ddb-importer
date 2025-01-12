/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";
import Maneuver from "./Maneuver.mjs";

export default class ManeuverBrace extends Maneuver {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Brace",
      activationType: "reaction",
      addItemConsume: true,
    };
  }

  get additionalActivities() {
    return [
      this.extraDamageActivity(),
    ];
  }


  get override() {
    return {
      midiManualReaction: true,
      data: {
        name: this.data.name.replace("Maneuver Options:", "Maneuver:").replace("Maneuvers:", "Maneuver: "),
        "flags.ddbimporter": {
          ignoredConsumptionActivities: this.ignoredConsumptionActivities,
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Brace: Extra Damage (Automation)",
        midiOnly: true,
        activityMatch: "Brace",
        daeSpecialDurations: ["1Attack:mwak"],
        data: {
          duration: {
            turns: 2,
          },
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.bonuses.mwak.damage"),
        ],
      },
    ];
  }


}
