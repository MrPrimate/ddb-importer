/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class WrathOfTheSea extends DDBEnricherData {
  get type() {
    return "utility";
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

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save for Damage",
          type: "save",
        },
        build: {
          generateActivation: true,
          activationOverride: {
            type: "bonus",
          },
          generateTarget: true,
          targetOverride: {
            affects: {
              value: "1",
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

  get effects() {
    return [
      {
        name: "Ocean Spray",
        options: {
          durationSeconds: 600,
        },
        data: {
          flags: {
            ddbimporter: {
              activityMatch: "Activate Emanation/Aura",
            },
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
