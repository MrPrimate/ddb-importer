import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";


export default class ManeuverFeintingAttack extends Maneuver {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Feint",
      activationType: "bonus",
      addItemConsume: true,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this.extraDamageActivity(),
    ];
  }


  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Feinting Attack: Extra Damage",
        activityMatch: "Feint",
        options: {
          description: "Advantage on the next attack roll against the target this turn, and the superiority die is added to its damage. The advantage is applied by Midi-QOL or AC5e. Without DAE or AC5e the effect lasts for every attack until the start of your next turn.",
        },
        // DAE and AC5e each end the effect after the one attack; the duration is the ceiling
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
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
      },
    ];
  }

}
