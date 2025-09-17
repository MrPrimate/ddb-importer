/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ElementalAttunement extends DDBEnricherData {
  get type() {
    return this.is2014 ? null : "enchant";
  }

  get activity() {
    return this.is2014
      ? {}
      : {
        name: "Activate Attunement",
        targetType: "self",
        rangeSelf: true,
        activationType: "turnStart",
        activationCondition: "Start of turn",
        data: {
          enchant: {
            identifier: "monk",
            self: true,
          },
        },
      };
  }

  get additionalActivities() {
    return this.is2014
      ? []
      : [
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
              DDBEnricherData.basicDamagePart({
                customFormula: "@scale.monk.martial-arts.die + @mod",
                types: ["bludgeoning", "acid", "cold", "fire", "lightning", "thunder"],
              }),
            ],
          },
          overrides: {
            id: "ddbElementStriAt",
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
              duration: {
                units: "inst",
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
            id: "ddbElementStriSa",
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
              duration: {
                units: "inst",
              },
            },
          },
        },
      ];
  }

  get effects() {
    return this.is2014
      ? []
      : [
        {
          name: "Elemental Attunement",
          data: {
            flags: {
              activityMatch: "Activate Attunement",
              ddbimporter: {
                activityRiders: ["ddbElementStriAt", "ddbElementStriSa"],
              },
            },
          },
          changes: [
            DDBEnricherData.ChangeHelper.overrideChange("{} (Active)", true, "name"),
            DDBEnricherData.ChangeHelper.overrideChange("spec", true, "activities[enchant].activation.type"),
            DDBEnricherData.ChangeHelper.overrideChange(
              "end of duration",
              true,
              "activities[enchant].activation.condition",
            ),
            DDBEnricherData.ChangeHelper.overrideChange("End Attunement", true, "activities[enchant].name"),
            DDBEnricherData.ChangeHelper.overrideChange("[]", true, "activities[enchant].consumption.targets"),
          ],
          type: "enchant",
        },
      ];
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.ignoredConsumptionActivities": ["Elemental Strike", "Elemental Save"],
      },
    };
  }
}
