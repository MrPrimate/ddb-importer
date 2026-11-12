import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The first damage-dealing spell of 4th level or lower cast within a minute of drinking uses the
 * highest number on each die. A macro activity works out that maximum from a recent spell.
 *
 * The drink spends one of the stack's quantity rather than an item use, and auto destroy is off, so
 * the last drink leaves the item at quantity 0, where dnd5e refuses another drink, and the macro
 * activity is still on the item for the spell cast after it.
 */
export default class PotionOfMaximumPower extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      DDBEnricherData.maximumDamageActivity({
        condition: "The first damage-dealing spell of 4th level or lower you cast within 1 minute of drinking the potion",
        parameters: {
          title: "Potion of Maximum Power",
          sources: [{ type: "spell" }],
          maxSpellLevel: 4,
        },
      }),
    ];
  }

  // drinking spends the stack's quantity, and the item stays at quantity 0
  override get override(): IDDBOverrideData {
    return { spendOwnQuantity: true };
  }

}
