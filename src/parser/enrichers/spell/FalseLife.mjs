/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FalseLife extends DDBEnricherData {

  get activity() {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: "1d4 + 4", types: ["temphp"], scalingMode: "whole", scalingNumber: 5 }),
      },
    };
  }

}
