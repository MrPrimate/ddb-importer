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
