/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TandemFootwork extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "special",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.bard.bardic-inspiration",
          name: "Initiative bonus",
        },
      },
    };
  }

}
