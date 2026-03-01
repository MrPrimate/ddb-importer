import DDBEnricherData from "../data/DDBEnricherData";

export default class Chef extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
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
        init: {
          name: "Create Bolstering Treats",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
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
        init: {
          name: "Eat Treat",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
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
      retainOriginalConsumption: true,
      data: {
        system: {
          uses: {
            spent: null,
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
