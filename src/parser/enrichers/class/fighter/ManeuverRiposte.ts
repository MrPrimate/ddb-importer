import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";


export default class ManeuverRiposte extends Maneuver {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get override(): IDDBOverrideData {
    return {
      midiManualReaction: true,
      ignoredConsumptionActivities: this.ignoredConsumptionActivities,
      data: {
        name: this.data.name.replace("Maneuver Options:", "Maneuver:").replace("Maneuvers:", "Maneuver: "),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this.extraDamageActivity(),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        daeSpecialDurations: ["1Attack:mwak" as const],
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: null,
          },
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.bonuses.mwak.damage"),
        ],
      },
    ];
  }

}
