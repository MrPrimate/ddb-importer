/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class DreadfulStrikeSuddenStrike extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Use the Dreadful Strike effect",
    };
  }

}
