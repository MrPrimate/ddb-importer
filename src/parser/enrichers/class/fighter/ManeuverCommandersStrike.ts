import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverCommandersStrike extends Maneuver {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Commander's Strike",
      targetType: "ally",
      activationType: "special",
      addItemConsume: true,
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
        midiOnly: true,
        activityMatch: "Commander's Strike",
        daeSpecialDurations: ["1Attack" as const],
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: null,
          },
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.rolls.damage.mwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.rolls.damage.rwak.bonus"),
        ],
      },
    ];
  }

}
