import DDBEnricherData from "../../data/DDBEnricherData";
import MagusMark from "./_MagusMark";

/**
 * Sylvan Circle level 3: Aegis adds Intelligence (minimum +1) to a failed save by the magus or an
 * ally, Enspell makes every space Difficult Terrain for the target until the end of its next turn.
 */
export default class EmeraldMark extends MagusMark {

  override get markActivities(): IDDBAdditionalActivity[] {
    return [
      MagusMark.markActivity("Aegis", DDBEnricherData.ACTIVITY_TYPES.UTILITY, MagusMark.aegis({
        activationCondition: "You or a willing creature you can see within 30 feet fails a saving throw",
        data: {
          roll: {
            prompt: false,
            visible: true,
            formula: "max(1, @abilities.int.mod)",
            name: "Saving Throw Bonus",
          },
        },
      })),
      MagusMark.markActivity("Enspell", DDBEnricherData.ACTIVITY_TYPES.UTILITY, MagusMark.enspell()),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Emerald Mark: Entangling Ground",
        activityMatch: "Enspell",
        options: {
          expiry: "targetEnd",
          description: "This creature treats all spaces as Difficult Terrain until the end of its next turn.",
        },
      },
    ];
  }

}
