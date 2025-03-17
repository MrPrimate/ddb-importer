/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Net extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      noTemplate: true,
      noConsumeTargets: true,
      targetType: "creature",
      data: {
        range: {
          value: "15",
          units: "ft",
        },
        save: {
          ability: ["dex"],
          dc: {
            calculation: "dex",
            formula: "",
          },
        },
      },
    };
  }

}
