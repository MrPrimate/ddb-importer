/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class PotionOfHealing extends DDBEnricherMixin {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      addItemConsume: true,
      activationType: this.is2014 ? "action" : "bonus",
      targetType: "creature",
      data: {
        range: {
          units: "touch",
        },
      },
    };
  }

}
