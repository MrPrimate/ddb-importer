import DDBEnricherData from "../../data/DDBEnricherData";

export default class HolyNimbus extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      data: {
        name: "Use/Apply Light",
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Aura Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "@abilities.mod.cha + @prof", types: ["radiant"] })],
        },
      },
      {
        init: {
          name: "Spend Spell Slot to Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "5",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const effects = [
      {
        activityMatch: "Use/Apply Light",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@scale.paladin.aura-of-protection", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.overrideChange("#ffffff", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
        ],
      },
    ];

    return effects;
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({ type: "class", name: "Imbue Aura of Protection", max: "1", period: "lr" });
    return {
      uses,
    };
  }

}
