import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The war pick's extra radiant damage is maximised against shapechangers and undead. AC5e maximises
 * the radiant roll; the macro activity works it out for tables without AC5e.
 */
export default class RadiantWarPick extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      DDBEnricherData.maximumDamageActivity({
        condition: "When you hit a shapechanger or Undead",
        parameters: { title: "Maximum Radiant Damage", thisItem: true, damageTypes: ["radiant"] },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const opponent = "(opponentActor.creatureType.includes('shapechanger') || opponentActor.creatureType.includes('undead'))";
    return [
      DDBEnricherData.maximumDamageEffect({
        name: "Radiant War Pick: Shapechangers and Undead",
        description: "The extra Radiant damage is maximized against shapechangers and Undead.",
        condition: `${DDBEnricherData.ChangeHelper.ac5eSelfItemCondition()} && ${opponent}`,
        addTo: "radiant",
      }),
    ];
  }

}
