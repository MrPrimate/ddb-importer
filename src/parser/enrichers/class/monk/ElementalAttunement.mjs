/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ElementalAttunement extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Elemental Attunement",
      targetType: "self",
      activationType: "special",
      activationCondition: "Start of turn",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Elemental Strike",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateRange: true,
          generateTarget: true,
          generateActivation: true,
          generateConsumption: false,
          damageParts: [
            DDBEnricherData.basicDamagePart({ customFormula: "@scale.monk.martial-arts.die + @mod", types: ["bludgeoning", "acid", "cold", "fire", "lightning", "thunder"] }),
          ],
        },
        overrides: {
          data: {
            target: {
              affects: {
                count: "1",
                type: "creature",
              },
            },
            range: {
              value: 15,
              units: "ft",
            },
            attack: {
              ability: ["dex"],
              type: {
                value: "melee",
                classification: "unarmed",
              },
            },
          },
        },
      },
      {
        constructor: {
          name: "Elemental Save",
          type: "save",
        },
        build: {
          generateSave: true,
          generateRange: false,
          generateTarget: true,
          generateActivation: true,
          generateConsumption: false,
          saveOverride: {
            ability: ["str"],
            dc: { calculation: "wis", formula: "" },
          },
          activationOverride: {
            type: "special",
            condition: "You deal Elemental Strike damage",
          },
        },
        overrides: {
          data: {
            target: {
              affects: {
                count: "1",
                type: "creature",
              },
            },
            range: {
              value: 15,
              units: "ft",
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Elemental Attunement",
        data: {
          "flags.ddbimporter.activityMatch": "Elemental Attunement",
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.ignoredConsumptionActivities": [
          "Elemental Strike",
          "Elemental Save",
        ],
      },
    };
  }
}
