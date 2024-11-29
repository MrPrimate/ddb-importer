/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HealingHands extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "creature",
      data: {
        // "range.units": "touch",
        healing: DDBEnricherData.basicDamagePart({ customFormula: "(@prof)d4", types: ["healing"] }),
      },
    };
  }

}
