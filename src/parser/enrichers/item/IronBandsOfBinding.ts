import DDBEnricherData from "../data/DDBEnricherData";

export default class IronBandsOfBinding extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        attack: {
          bonus: "@prof",
          ability: "dex",
          type: {
            value: "ranged",
            classification: "weapon",
          },
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [{
          period: "day",
          type: "recoverAll",
        }],
        autoDestroy: false,
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Escape Check",
          type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
        },
        build: {
          generateTarget: false,
          generateRange: false,
          generateCheck: true,
          checkOverride: {
            associated: [],
            ability: ["str"],
            dc: {
              calculation: "",
              formula: "20",
            },
          },
        },
        overrides: {
          addItemConsume: true,
        },
      },
    ];
  }
}
