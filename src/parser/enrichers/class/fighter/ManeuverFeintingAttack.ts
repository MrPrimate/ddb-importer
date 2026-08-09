import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";


export default class ManeuverFeintingAttack extends Maneuver {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Feint",
      activationType: "bonus",
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
        name: "Feinting Attack: Extra Damage",
        activityMatch: "Feint",
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
