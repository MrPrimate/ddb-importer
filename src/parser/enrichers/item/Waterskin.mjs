/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Waterskin extends DDBEnricherData {

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
          max: "4",
          recovery: [],
          autoDestroy: false,
          autoUse: true,
        },
      },
    };
  }

}
