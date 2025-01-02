/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class PrimalSavagery extends DDBEnricherData {

  get override() {
    return {
      data: {
        "system.range": {
          value: "5",
          units: "ft",
        },
      },
    };
  }

}
