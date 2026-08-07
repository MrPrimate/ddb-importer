import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodHunter from "./_BloodHunter";

/**
 * 10th level. Permanent passive: +5 feet of speed, and a bonus to Strength,
 * Dexterity and Constitution saving throws equal to the hemocraft modifier
 * (minimum of +1). DDB grants no modifiers for this feature, so nothing is
 * double applied.
 */
export default class DarkAugmentation extends _BloodHunter {

  static SAVE_ABILITIES = ["str", "dex", "con"];

  get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];

    const saveBonus = `max(1, ${this.hemocraftModifier})`;

    return [
      {
        name: "Dark Augmentation",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("5", 20, "system.attributes.movement.walk"),
          ...DarkAugmentation.SAVE_ABILITIES.map((ability) =>
            DDBEnricherData.ChangeHelper.unsignedAddChange(saveBonus, 20, `system.abilities.${ability}.bonuses.save`),
          ),
        ],
      },
    ];
  }

}
