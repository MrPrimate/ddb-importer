/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ProduceFlame extends DDBEnricherData {

  get override() {
    return {
      data: {
        "system.range": {
          value: "30",
          units: "ft",
        },
      },
    };
  }

}
