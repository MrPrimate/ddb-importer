import DDBEnricherData from "../../data/DDBEnricherData";

export default class Plaguebringer extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Activate",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      activationType: "bonus",
      targetType: "self",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Entropic Radiance Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateTarget: true,
          generateActivation: true,
          noeffect: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "An enemy starts its turn within your Aura of Protection",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "enemy",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@abilities.cha.mod + @prof",
              types: ["necrotic"],
            }),
          ],
        },
        overrides: {
          noConsumeTargets: true,
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
          noeffect: true,
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
                value: "-1",
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "5",
                scaling: { mode: "", formula: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Plaguebringer",
      activitiesMatch: ["Activate"],
      options: {
        durationSeconds: 600,
        description: "One with Plague: Immunity to Poison damage and the Poisoned condition, and Resistance to Necrotic damage. Bolstered by Rot: Hit Point maximum can't be reduced. Entropic Radiance: enemies starting their turn in the Aura of Protection take Necrotic damage equal to Charisma modifier plus Proficiency Bonus.",
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("poison", 20, "system.traits.di.value"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("poisoned", 20, "system.traits.ci.value"),
        DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic"),
      ],
    }];
  }

}
