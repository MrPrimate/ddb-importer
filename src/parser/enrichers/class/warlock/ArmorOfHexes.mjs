/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ArmorOfHexes extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "reaction",
      targetType: "self",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d6",
          name: "Roll",
        },
      },
    };
  }

}
