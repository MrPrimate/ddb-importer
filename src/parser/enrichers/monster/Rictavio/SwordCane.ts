import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * "4 (1d6 + 1) bludgeoning damage (wooden cane) or 4 (1d6 + 1) piercing damage (silvered sword)".
 *
 * The weapon is the cane until Rictavio draws the sword: a self-enchantment that renames it,
 * makes its damage piercing and silvers it. Using the activity again sheathes the sword.
 */
export default class SwordCane extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Draw Silvered Sword",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateTarget: true,
        },
        overrides: {
          targetType: "self",
          noTemplate: true,
          activationType: "special",
          data: {
            enchant: {
              self: true,
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Silvered Sword",
      type: "enchant",
      activityMatch: "Draw Silvered Sword",
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange("{} (Silvered Sword)", 90, "name"),
        DDBEnricherData.ChangeHelper.overrideChange("Sheathe Sword", 90, "activities[enchant].name"),
        DDBEnricherData.ChangeHelper.overrideChange("[]", 90, "activities[enchant].consumption.targets"),
        DDBEnricherData.ChangeHelper.overrideChange("piercing", 20, "system.damage.base.types"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("sil", 20, "system.properties"),
      ],
    }];
  }

  override get noVersatile(): boolean {
    return true;
  }

}
