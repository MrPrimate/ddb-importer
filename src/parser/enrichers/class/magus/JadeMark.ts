import DDBEnricherData from "../../data/DDBEnricherData";
import MagusMark from "./_MagusMark";

/**
 * Shadow Court level 3: Aegis turns a hit creature Invisible until the end of its next turn;
 * Enspell leaves the target overexposed, so attacks against it score a Critical Hit on 19-20
 * until the start of the magus's next turn (or until it suffers one).
 */
export default class JadeMark extends MagusMark {

  override get markActivities(): IDDBAdditionalActivity[] {
    return [
      MagusMark.markActivity("Aegis", DDBEnricherData.ACTIVITY_TYPES.UTILITY, MagusMark.aegis({
        activationCondition: "A creature you can see within 30 feet is hit by an attack",
      })),
      MagusMark.markActivity("Enspell", DDBEnricherData.ACTIVITY_TYPES.UTILITY, MagusMark.enspell()),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Jade Mark: Invisible",
        activityMatch: "Aegis",
        statuses: ["invisible"],
        options: {
          expiry: "targetEnd",
          description: "Invisible until the end of its next turn. Ends early if it makes an attack roll, deals damage, or casts a spell.",
        },
      },
      {
        name: "Overexposed",
        activityMatch: "Enspell",
        options: {
          expiry: "sourceStart",
          description: "Attack rolls against this creature score a Critical Hit on a roll of 19 or 20 until the start of the magus's next turn, or until it is hit with a Critical Hit.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("set=19", 20, "flags.automated-conditions-5e.grants.attack.criticalThreshold"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("19", 20, "flags.midi-qol.grants.criticalThreshold"),
        ],
      },
    ];
  }

}
