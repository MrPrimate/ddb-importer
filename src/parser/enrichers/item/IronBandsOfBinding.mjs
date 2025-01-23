/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class IronBandsOfBinding extends DDBEnricherData {

  get type() {
    return "attack";
  }

  get activity() {
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

  get override() {
    return {
      data: {
        "system.uses": {
          spent: null,
          max: "1",
          recovery: [{
            period: "day",
            type: "recoverAll",
          }],
          autoDestroy: false,
          autoUse: true,
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Escape Check",
          type: "check",
        },
        build: {
          generateTarget: false,
          generateRange: false,
          generateCheck: true,
          checkOverride: {
            associated: [],
            ability: "str",
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
