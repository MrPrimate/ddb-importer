import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Skulker (2024): Fog of War gives advantage on Dexterity (Stealth) checks. Blindsight comes
 * from the DDB sense modifier, so only the roll mode is added here.
 */
export default class Skulker extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.is2024) return [];
    return [
      {
        name: "Fog of War",
        options: {
          transfer: true,
          description: "Advantage on Dexterity (Stealth) checks while you exploit fog of war.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.skills.ste.roll.mode"),
        ],
      },
    ];
  }

}
