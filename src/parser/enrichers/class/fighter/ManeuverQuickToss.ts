import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";


export default class ManeuverQuickToss extends Maneuver {
  override get type(): IDDBActivityType {
    return this.useMidiAutomations
      ? DDBEnricherData.ACTIVITY_TYPES.UTILITY
      : DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        daeSpecialDurations: ["1Attack" as const],
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: null,
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
