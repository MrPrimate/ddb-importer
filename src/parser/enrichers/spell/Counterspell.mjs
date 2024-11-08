/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class Counterspell extends DDBEnricherMixin {

  get type() {
    if (this.is2014) {
      return "check";
    } else {
      return "save";
    }
  }

  get activity() {
    if (this.is2014) {
      return {
        type: "check",
        check: {
          associated: [],
          ability: "spellcasting",
          dc: {
            calculation: "",
            formula: "",
          },
        },
      };
    } else {
      return null;
    }
  }

}
