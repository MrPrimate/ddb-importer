import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Wish: casting the spell for anything other than duplicating another spell weakens the caster. The effect records the Strength drop; the necrotic damage per spell cast until a long rest is in the description.
 */
export default class Wish extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Wish Stress",
        changes: [
          DDBEnricherData.ChangeHelper.downgradeChange("3", 20, "system.abilities.str.value"),
        ],
        options: {
          description: "Until you finish a Long Rest, each spell you cast deals 1d10 necrotic damage per spell level to you, and your Strength is 3 if it isn't already lower. Apply only after a wish that didn't duplicate a spell.",
        },
      },
    ];
  }

}
