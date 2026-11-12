import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Surge of Brimstone: once per dawn, a spell's fire or necrotic damage is its maximum instead of
 * rolled. A macro activity works out that maximum from a recent spell.
 */
export default class RodOfHellishFlames extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      DDBEnricherData.maximumDamageActivity({
        condition: "Whenever you cast a spell that deals Fire or Necrotic damage (once per dawn)",
        parameters: {
          title: "Surge of Brimstone",
          sources: [{ type: "spell" }],
          damageTypes: ["fire", "necrotic"],
        },
      }),
    ];
  }

}
