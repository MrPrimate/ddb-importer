import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Fiendish Scourging: while carrying the book, damage rolls for your spells against a Fiend use the
 * maximum result. AC5e maximises them; the macro activity works it out for tables without AC5e.
 */
export default class DemonomiconOfIggwilv extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      DDBEnricherData.maximumDamageActivity({
        condition: "When you make a damage roll for a spell you cast against a Fiend",
        parameters: { title: "Fiendish Scourging", sources: [{ type: "spell" }] },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      DDBEnricherData.maximumDamageEffect({
        name: "Fiendish Scourging",
        description: "Damage rolls for spells you cast against a Fiend use the maximum possible result.",
        condition: "isSpell && opponentActor.creatureType.includes('fiend')",
      }),
    ];
  }

}
