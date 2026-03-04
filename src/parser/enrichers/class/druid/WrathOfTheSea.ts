import DDBEnricherData from "../../data/DDBEnricherData";

export default class WrathOfTheSea extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Activate Emanation/Aura",
      targetType: "self",
      activationType: "bonus",
      data: {
        target: {
          template: {
            type: "radius",
            size: "@scale.sea.wrath-range",
            units: "ft",
          },
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
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

  get effects():  IDDBEffectHint[] {
    return [
      {
        name: "Ocean Spray",
        options: {
          durationSeconds: 600,
        },
        activityMatch: "Activate Emanation/Aura",
        data: {
          flags: {
            ActiveAuras: {
              aura: "Enemy",
              radius: "@scale.sea.wrath-range",
              isAura: true,
              ignoreSelf: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
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
