/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CuttingWords extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "creature",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.bard.inspiration",
          name: "Subtraction Roll",
        },
        range: {
          value: 60,
          long: null,
          units: "ft",
        },
      },
    };
  }

}
