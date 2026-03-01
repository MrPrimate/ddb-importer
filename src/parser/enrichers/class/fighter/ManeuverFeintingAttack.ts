import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";


export default class ManeuverFeintingAttack extends Maneuver {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Feint",
      activationType: "bonus",
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
        name: "Feinting Attack: Extra Damage",
        activityMatch: "Feint",
        midiOnly: true,
        daeSpecialDurations: ["1Attack" as const],
        data: {
          duration: {
            turns: 1,
          },
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.bonuses.rwak.damage"),
        ],
      },
    ];
  }

}
