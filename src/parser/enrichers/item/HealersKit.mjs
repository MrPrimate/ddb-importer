/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class HealersKit extends DDBEnricherMixin {

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
          spent: 0,
          max: "10",
          recovery: [],
          autoDestroy: false,
          autoUse: true,
        },
      },
    };
  }

}
