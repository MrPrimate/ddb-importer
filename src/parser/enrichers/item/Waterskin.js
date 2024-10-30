/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class Waterskin extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      type: "utility",
      activationType: "special",
      addItemConsume: true,
    };
  }

  get override() {
    return {
      data: {
        "system.uses": {
          spent: 0,
          max: 4,
          recovery: [],
          autoDestroy: false,
          autoUse: true,
        },
      },
    };
  }

}
