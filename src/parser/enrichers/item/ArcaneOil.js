/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class ArcaneOil extends DDBEnricherMixin {

  get type() {
    return "enchant";
  }

  get effects() {
    return [{
      type: "enchant",
      magicalBonus: {
        makeMagical: false,
        bonus: "2",
      },
    }];
  }

}
