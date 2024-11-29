/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Chef extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Replenishing Meal",
      targetType: "creature",
      activationType: "special",
      activationCondition: "As part of a short rest",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 8,
          type: "healing",
        }),
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Create Bolstering Treats",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: "-@prof",
                scaling: {
                  mode: "",
                  formula: "",
                },
              },
            ],
            scaling: {
              allowed: false,
              max: "",
            },
          },
        },
      },
      {
        constructor: {
          name: "Eat Treat",
          type: "heal",
        },
        build: {
          generateHealing: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@prof",
            type: "temphp",
          }),
        },
        overrides: {
          addItemConsume: true,
          data: {
            target: {
              affects: {
                count: "1",
                type: "creature",
              },
            },
            range: {
              units: "touch",
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter": {
          retainOriginalConsumption: true,
        },
        system: {
          uses: {
            spent: "0",
            max: "@prof",
            recovery: [
              { period: "lr", type: "recoverAll", formula: undefined },
            ],
          },
        },
      },
    };
  }
}
