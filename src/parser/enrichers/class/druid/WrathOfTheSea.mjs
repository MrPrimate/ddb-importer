/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class WrathOfTheSea extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Activate Emination/Aura",
      targetType: "self",
      activationType: "bonus",
      data: {
        target: {
          template: {
            type: "radius",
            size: "10",
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
      },
    ];
  }
}
