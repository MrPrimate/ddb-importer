import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Veteran's Cane: a Bonus Action turns the cane into an ordinary Longsword and back. DDB ships it as
 * equipment, so, as the official DMG item, it is stubbed as a weapon: an improvised 1d4 bludgeoning
 * cane whose Transform self-enchantment makes it a Longsword (martial melee, 1d8 slashing,
 * Versatile, Sap). Using Transform again turns it back into the cane.
 */
export default class VeteransCane extends DDBEnricherData {

  override get documentStub(): IDDBDocumentStub {
    return {
      documentType: "weapon",
      parsingType: "weapon",
      systemType: { value: "improv", baseItem: "longsword" },
    };
  }

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      noConsumeTargets: true,
      allowCritical: true,
      data: {
        attack: { type: { value: "melee", classification: "weapon" } },
        damage: { includeBase: true, parts: [] },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Transform", type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT },
        build: { generateActivation: true, generateConsumption: false },
        overrides: {
          activationType: "bonus",
          noConsumeTargets: true,
          noTemplate: true,
          targetType: "self",
          allowMagical: true,
          data: {
            enchant: { self: true },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          damage: {
            base: { number: 1, denomination: 4, types: ["bludgeoning"], bonus: "", custom: { enabled: false, formula: "" }, scaling: { number: 1 } },
          },
          range: { value: null, long: null, reach: 5, units: "ft" },
          mastery: "",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Longsword Form",
        type: "enchant",
        activityMatch: "Transform",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("{} (Longsword)", 20, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("Revert to Cane", 20, "activities[enchant].name"),
          DDBEnricherData.ChangeHelper.overrideChange("martialM", 20, "system.type.value"),
          DDBEnricherData.ChangeHelper.overrideChange("sap", 20, "system.mastery"),
          DDBEnricherData.ChangeHelper.overrideChange("8", 20, "system.damage.base.denomination"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("ver", 20, "system.properties"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-bludgeoning", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 20, "system.damage.base.types"),
        ],
      },
    ];
  }

}
