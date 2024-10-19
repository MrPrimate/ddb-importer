/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class UndyingSentinel extends DDBEnricherMixin {

  get activity() {
    return {
      type: "heal",
      addItemConsume: true,
      targetType: "self",
      activationType: "special",
      condition: "Reduced to 0 HP",
      data: {
        healing: DDBEnricherMixin.basicDamagePart({ customFormula: "3 * @classes.paladin.levels", types: ["healing"] }),
      },
    };
  }

}
