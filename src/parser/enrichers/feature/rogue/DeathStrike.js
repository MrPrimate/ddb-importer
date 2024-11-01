/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class DeathStrike extends DDBEnricherMixin {

  get type() {
    return "save";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Hit with Sneak Attack in first round",
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
