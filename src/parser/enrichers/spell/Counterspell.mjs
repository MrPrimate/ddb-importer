/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Counterspell extends DDBEnricherData {

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
