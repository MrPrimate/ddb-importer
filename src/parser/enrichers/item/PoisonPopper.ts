import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacerData, regionTrigger } from "./_ItemRegions";

/**
 * Throwing the fruit rolls nothing: it places a 10-foot-radius cloud for 1 minute whose region
 * fires the save against a creature that enters it or starts its turn there.
 */
export default class PoisonPopper extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Throw", {
      template: { type: "sphere", size: "10" },
      range: "60",
      duration: { value: "1", units: "minute" },
      consume: true,
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnStart"],
          activityName: "Noxious Gas Save",
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("Noxious Gas Save", {
        condition: "Enters the cloud for the first time on a turn or starts its turn there",
        save: { ability: ["con"], dc: "13" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 4, denomination: 6, types: ["poison"] }),
        ],
        onSave: "half",
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned (Poison Popper)",
        activityMatch: "Noxious Gas Save",
        statuses: ["Poisoned"],
        changes: [DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 50)],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "turn=end, saveAbility=con, saveDC=13, label=Poisoned by Poison Popper",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "Poisoned with halved speed for 1 minute. Repeat the save at the end of each turn, ending the effect on a success.",
        },
      },
    ];
  }

}
