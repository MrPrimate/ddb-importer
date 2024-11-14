/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class FalseLife extends DDBEnricherMixin {

  get activity() {
    return {
      data: {
        healing: DDBEnricherMixin.basicDamagePart({ customFormula: "1d4 + 4", types: ["temphp"], scalingMode: "whole", scalingNumber: 5 }),
      },
    };
  }

}
