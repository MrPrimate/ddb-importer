/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class HealersKit extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      addItemConsume: true,
      activationType: "action",
      targetType: "creature",
      data: {
        "range.units": "touch",
      },
    };
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter": {
          retainResourceConsumption: true,
          retainUseSpent: true,
        },
        "system.uses": {
          spent: null,
          max: "10",
          recovery: [],
          autoDestroy: false,
          autoUse: true,
        },
      },
    };
  }

}
