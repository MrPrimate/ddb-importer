import DDBEnricherData from "../../data/DDBEnricherData";
import MagusMark from "./_MagusMark";

/** Arcane Order level 3: Aegis swaps places with a hit ally, Enspell teleports the target 10 feet on a failed Charisma save. */
export default class AmethystMark extends MagusMark {

  override get markActivities(): IDDBAdditionalActivity[] {
    return [
      MagusMark.markActivity("Aegis", DDBEnricherData.ACTIVITY_TYPES.UTILITY, MagusMark.aegis({
        activationCondition: "A willing creature you can see within 30 feet is hit by an attack; swap places by teleportation, take the attack yourself and have Resistance to its damage",
      })),
      MagusMark.markActivity("Enspell", DDBEnricherData.ACTIVITY_TYPES.SAVE, MagusMark.enspell({
        data: {
          save: {
            ability: ["cha"],
            dc: { calculation: "spellcasting", formula: "" },
          },
        },
      }), { generateSave: true }),
    ];
  }

}
