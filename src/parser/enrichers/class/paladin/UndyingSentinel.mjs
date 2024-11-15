/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class UndyingSentinel extends DDBEnricherData {

  get activity() {
    return {
      type: "heal",
      addItemConsume: true,
      targetType: "self",
      activationType: "special",
      condition: "Reduced to 0 HP",
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: "3 * @classes.paladin.levels", types: ["healing"] }),
      },
    };
  }

}
