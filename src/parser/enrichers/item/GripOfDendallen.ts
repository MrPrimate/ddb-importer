import DDBEnricherData from "../data/DDBEnricherData";

/**
 * While wearing the gloves your Unarmed Strikes deal necrotic damage, maximised against a plant or
 * Plant creature. The roll is the Unarmed Strike's, not the gloves', so the AC5e rule checks the
 * attacking item. The macro activity covers plants that are not creatures, and tables without AC5e.
 */
export default class GripOfDendallen extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      DDBEnricherData.maximumDamageActivity({
        condition: "When you hit a plant or Plant creature with an Unarmed Strike",
        parameters: {
          title: "Maximum Damage",
          sources: [{ type: "weapon" }],
          activityTypes: ["attack"],
        },
      }),
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      DDBEnricherData.maximumDamageEffect({
        name: "Grip of Dendallen: Plants",
        description: "Your Unarmed Strikes deal maximum damage to Plant creatures.",
        condition: "item.identifier === 'unarmed-strike' && opponentActor.creatureType.includes('plant')",
      }),
    ];
  }

}
