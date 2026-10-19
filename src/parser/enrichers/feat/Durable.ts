import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Durable: 2024 Speedy Recovery is DDB's action. Defy Death (advantage on death saves) is a DDB
 * modifier; the named effect here replaces the one EffectGenerator builds from it.
 */
export default class Durable extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    return [
      { action: { name: "Speedy Recovery", type: "feat" } },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) return [];
    return [
      {
        name: "Defy Death",
        options: { transfer: true },
        changes: [DDBEnricherData.ChangeHelper.advantageDeathSaveChange()],
      },
    ];
  }

}
