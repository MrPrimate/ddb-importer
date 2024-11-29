/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HarnessDivinePower extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "bonus",
      addItemConsume: true,
    };
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.retainOriginalConsumption": true,
      },
    };
  }

}
