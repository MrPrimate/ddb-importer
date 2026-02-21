import DDBEnricherData from "../data/DDBEnricherData";

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
          spent: null,
          max: "4",
          recovery: [],
          autoDestroy: false,
          autoUse: true,
        },
      },
    };
  }

}
