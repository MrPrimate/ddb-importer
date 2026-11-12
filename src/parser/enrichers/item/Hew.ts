import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Hew deals maximum damage to Plant creatures and to objects made of wood. AC5e maximises it against
 * plants; a wooden object is not a creature AC5e can see, so the macro activity covers that, and
 * plants for tables without AC5e.
 */
export default class Hew extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      DDBEnricherData.maximumDamageActivity({
        condition: "When you hit a Plant creature or an object made of wood",
        parameters: { title: "Maximum Damage", thisItem: true },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      DDBEnricherData.maximumDamageEffect({
        name: "Hew: Plants",
        description: "Hew deals maximum damage to Plant creatures.",
        condition: `${this.ac5eSelfItemCondition} && opponentActor.creatureType.includes('plant')`,
      }),
    ];
  }

}
