/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class Acid extends DDBEnricherMixin {

  get activity() {
    return {
      type: "save",
      addItemConsume: true,
      targetType: "creature",
      data: {
        save: {
          ability: "con",
          dc: {
            calculation: "dex",
            formula: "",
          },
        },
      },
    };
  }

}
