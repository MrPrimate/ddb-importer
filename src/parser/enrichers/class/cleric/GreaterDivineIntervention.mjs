/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class GreaterDivineIntervention extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "2d4",
          name: "Long rests till next intervention",
        },
      },
    };
  }

  get effects() {
    return [];
  }

}
