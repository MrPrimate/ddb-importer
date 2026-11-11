import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Splitter in Quarterstaff form deals maximum damage to plants and Plant creatures. AC5e maximises it
 * against Plant creatures; the macro activity covers other plants, and tables without AC5e.
 */
export default class SplitterQuarterstaff extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      DDBEnricherData.maximumDamageActivity({
        condition: "When you hit a plant or Plant creature",
        parameters: { title: "Maximum Damage", thisItem: true },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      DDBEnricherData.maximumDamageEffect({
        name: "Splitter: Plants",
        description: "The Quarterstaff deals maximum damage to plants and Plant creatures.",
        condition: `${DDBEnricherData.ChangeHelper.ac5eSelfItemCondition()} && opponentActor.creatureType.includes('plant')`,
      }),
    ];
  }

}
