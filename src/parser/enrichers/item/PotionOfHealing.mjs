/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class PotionOfHealing extends DDBEnricherData {

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
