import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The extra acid damage is maximised against a plant, Plant creature or object made of wood. AC5e
 * maximises the acid roll against Plant creatures; the macro activity covers the rest, and tables
 * without AC5e.
 */
export default class FesterwoodLogger extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      DDBEnricherData.maximumDamageActivity({
        condition: "When you hit a plant, Plant creature or object made of wood",
        parameters: { title: "Maximum Acid Damage", thisItem: true, damageTypes: ["acid"] },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      DDBEnricherData.maximumDamageEffect({
        name: "Festerwood Logger: Plants",
        description: "The extra Acid damage is maximized against Plant creatures.",
        condition: `${this.ac5eSelfItemCondition} && opponentActor.creatureType.includes('plant')`,
        addTo: "acid",
      }),
    ];
  }

}
