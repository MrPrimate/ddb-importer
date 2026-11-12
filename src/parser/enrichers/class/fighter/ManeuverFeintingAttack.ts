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
        name: "Feinting Attack: Advantage",
        activityMatch: "Feint",
        options: {
          description: "Advantage on the next attack roll against the target this turn. On a hit, roll the superiority die from the maneuver's Damage activity. The advantage is applied by Midi-QOL or AC5e. Without DAE or AC5e the effect lasts for every attack until the start of your next turn.",
        },
        // DAE and AC5e each end the effect after the one attack; the duration is the ceiling
        daeSpecialDurations: ["1Attack" as const],
        data: {
          duration: {
            turns: 1,
          },
        },
        // the die is the Damage activity's (the official shape): DAE 1Attack and AC5e once delete
        // the effect at the attack roll, before its damage is rolled
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
      },
    ];
  }

}
