import DDBEnricherData from "../../data/DDBEnricherData";
import MagusMark from "./_MagusMark";

/** Sidereal Cabal level 3: Aegis forces a reroll with Disadvantage against an ally, Enspell rerolls a miss with Advantage. */
export default class SeleniteMark extends MagusMark {

  override get markActivities(): IDDBAdditionalActivity[] {
    return [
      MagusMark.markActivity("Aegis", DDBEnricherData.ACTIVITY_TYPES.UTILITY, MagusMark.aegis({
        activationCondition: "A willing creature you can see within 30 feet is hit by an attack; the attacker rerolls with Disadvantage and must use the new result",
      })),
      MagusMark.markActivity("Enspell", DDBEnricherData.ACTIVITY_TYPES.UTILITY, MagusMark.enspell({
        activationCondition: "Once per turn when you miss a creature with a weapon or Unarmed Strike while your Mystic Mark has Enspell; reroll with Advantage and use the new result",
      })),
    ];
  }

}
