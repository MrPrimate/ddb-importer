import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";


export default class ManeuverQuickToss extends Maneuver {
  get type() {
    return this.useMidiAutomations
      ? DDBEnricherData.ACTIVITY_TYPES.UTILITY
      : DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get effects() {
    return [
      {
        midiOnly: true,
        daeSpecialDurations: ["1Attack"],
        data: {
          duration: {
            turns: 1,
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
