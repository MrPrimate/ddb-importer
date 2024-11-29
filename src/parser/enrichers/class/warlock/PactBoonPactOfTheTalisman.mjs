/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PactBoonPactOfTheTalisman extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d4",
          name: "Roll Ability Check Bonus",
        },
      },
    };
  }

}
