/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SteelDefender extends DDBEnricherData {

  get activity() {
    return {
      noConsumeTargets: true,
      noTemplate: true,
    };
  }

  get override() {
    return {
      data: {
        "system.uses": {
          spent: null,
          max: "",
          recovery: [],
        },
      },
    };
  }

}
