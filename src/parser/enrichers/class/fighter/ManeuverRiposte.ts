import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";


export default class ManeuverRiposte extends Maneuver {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get override() {
    return {
      midiManualReaction: true,
      ignoredConsumptionActivities: this.ignoredConsumptionActivities,
      data: {
        name: this.data.name.replace("Maneuver Options:", "Maneuver:").replace("Maneuvers:", "Maneuver: "),
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this.extraDamageActivity(),
    ];
  }

  get effects() {
    return [
      {
        daeSpecialDurations: ["1Attack:mwak" as const],
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
