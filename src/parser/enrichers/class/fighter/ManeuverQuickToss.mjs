/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";
import Maneuver from "./Maneuver.mjs";


export default class ManeuverQuickToss extends Maneuver {
  get type() {
    return this.useMidiAutomations
      ? "utility"
      : "damage";
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
