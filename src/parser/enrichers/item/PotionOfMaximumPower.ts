import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The first damage-dealing spell of 4th level or lower cast within a minute of drinking uses the
 * highest number on each die. A macro activity works out that maximum from a recent spell.
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

}
