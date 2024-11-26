/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MaskOfTheWild extends DDBEnricherData {

  get type() {
    return "check";
  }

  get activity() {
    return {
      data: {
        check: {
          associated: ["ste"],
          ability: "",
          dc: {
            calculation: "",
            formula: "",
          },
        },
      },
    };
  }

}
