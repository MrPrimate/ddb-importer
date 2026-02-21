import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";


export default class ManeuverRiposte extends Maneuver {
  get type() {
    return "utility";
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

  get additionalActivities() {
    return [
      this.extraDamageActivity(),
    ];
  }

  get effects() {
    return [
      {
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
