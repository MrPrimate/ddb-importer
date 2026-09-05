import DDBEnricherData from "../../data/DDBEnricherData";

export default class WrathOfTheSea extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate Emanation/Aura",
      targetType: "enemy",
      activationType: "bonus",
      data: {
        // relevantLevel for the Stormborn effect gate counts druid levels, not character level
        visibility: {
          identifier: "druid",
        },
        target: {
          template: {
            type: "radius",
            size: "@scale.sea.wrath-range",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: "Ocean Spray",
            auraeffectsNever: true,
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save for Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateActivation: true,
          activationOverride: {
            type: "bonus",
          },
          generateTarget: true,
          targetOverride: {
            affects: {
              count: "1",
              type: "self",
            },
          },
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(@abilities.wis.mod)d6",
              types: ["cold"],
            }),
          ],
          generateSave: true,
          saveOverride: {
            ability: ["con"],
            dc: { calculation: "spellcasting", formula: "" },
          },
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
    ];
  }

  override get effects():  IDDBEffectHint[] {
    return [
      // Stormborn (level 10): flight and cold/lightning/thunder resistance while the aura is active.
      // The druid applies it to themselves from the activation card; dnd5e hides it below level 10.
      {
        name: "Stormborn",
        activityMatch: "Activate Emanation/Aura",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.fly"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("cold"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("lightning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("thunder"),
        ],
        options: {
          durationSeconds: 600,
          description: "While Wrath of the Sea is active you have a Fly Speed equal to your Speed and Resistance to Cold, Lightning and Thunder damage.",
        },
        data: {
          flags: {
            ddbimporter: {
              effectIdLevel: {
                min: 10,
                max: null,
              },
            },
          },
        },
      },
      {
        name: "Ocean Spray",
        standalone: true,
        auraeffectsNever: true,
        options: {
          durationSeconds: 600,
          description: "Within the Wrath of the Sea emanation; the druid can target this creature with the aura's cold damage.",
        },
      },
      {
        name: "Ocean Spray",
        options: {
          durationSeconds: 600,
        },
        activityMatch: "Activate Emanation/Aura",
        auraeffectsOnly: true,
        auraeffects: {
          applyToSelf: false,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "@scale.sea.wrath-range",
          disposition: -1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }
}
