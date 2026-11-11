import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The beetles a natural 20 leaves on the target deal maximum damage at the start of each of its turns
 * to a plant, Plant creature or wooden object. That damage is not an attack roll AC5e can modify, so
 * the macro activity works the maximum out.
 */
export default class FesterwoodClaymore extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      DDBEnricherData.maximumDamageActivity({
        condition: "The beetles' damage at the start of each turn of a plant, Plant creature or wooden object",
        parameters: { title: "Beetles: Maximum Damage", thisItem: true, damageTypes: ["piercing"] },
      }),
    ];
  }

}
