/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

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
