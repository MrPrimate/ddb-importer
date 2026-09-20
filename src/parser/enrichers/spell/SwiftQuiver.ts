import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Swift Quiver: the enchant marks the ranged weapon as needing no ammunition for the minute, matching the SRD; the cast itself stays a utility.
 */
export default class SwiftQuiver extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Enchant Weapon",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateActivation: true,
          generateTarget: false,
          generateRange: false,
          generateConsumption: false,
          generateEnchant: true,
          noSpellslot: true,
          activationOverride: {
            type: "bonus",
            value: null,
            condition: "Apply to the ranged weapon that uses the quiver's ammunition",
          },
        },
        overrides: {
          targetType: "self",
          noTemplate: true,
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
              categories: ["simpleR", "martialR"],
              properties: ["amm"],
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        name: "Endless Ammunition",
        activityMatch: "Enchant Weapon",
        magicalBonus: {
          nameAddition: " (Swift)",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-amm", 20, "system.properties"),
        ],
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
