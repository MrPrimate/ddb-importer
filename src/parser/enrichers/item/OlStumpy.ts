import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The maul's extra poison damage is maximised against fey. AC5e maximises the poison roll; the macro
 * activity works it out for tables without AC5e.
 */
export default class OlStumpy extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      DDBEnricherData.maximumDamageActivity({
        condition: "When you hit a Fey",
        parameters: { title: "Maximum Poison Damage", thisItem: true, damageTypes: ["poison"] },
      }),
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      DDBEnricherData.maximumDamageEffect({
        name: "Ol' Stumpy: Fey",
        description: "The extra Poison damage is maximized against Fey.",
        condition: `${this.ac5eSelfItemCondition} && opponentActor.creatureType.includes('fey')`,
        addTo: "poison",
      }),
    ];
  }

}
