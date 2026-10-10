import DDBEnricherData from "../../data/DDBEnricherData";
import MagusMark from "./_MagusMark";

/**
 * Heaven's Guard level 3: Aegis guards a hit ally (attacks against it have Disadvantage) and
 * Enspell gives the target Disadvantage on attacks against anyone but the magus, both until the
 * start of the magus's next turn.
 */
export default class AlabasterMark extends MagusMark {

  override get markActivities(): IDDBAdditionalActivity[] {
    return [
      MagusMark.markActivity("Aegis", DDBEnricherData.ACTIVITY_TYPES.UTILITY, MagusMark.aegis({
        activationCondition: "A willing creature you can see within 30 feet is hit by an attack",
      })),
      MagusMark.markActivity("Enspell", DDBEnricherData.ACTIVITY_TYPES.UTILITY, MagusMark.enspell()),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Alabaster Mark: Guarded",
        activityMatch: "Aegis",
        options: {
          expiry: "sourceStart",
          description: "Attack rolls against this creature have Disadvantage until the start of the magus's next turn.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.grants.attack.disadvantage"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),
        ],
      },
      {
        name: "Alabaster Mark: Distracted",
        activityMatch: "Enspell",
        options: {
          expiry: "sourceStart",
          description: "Disadvantage on attack rolls against creatures other than the magus until the start of the magus's next turn.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "effectOriginTokenId !== opponentId",
            20,
            "flags.automated-conditions-5e.attack.disadvantage",
          ),
        ],
      },
    ];
  }

}
