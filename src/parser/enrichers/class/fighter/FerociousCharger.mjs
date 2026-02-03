/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FerociousCharger extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      name: "vs Prone",
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "str",
            formula: "",
          },
        },
      },
    };
  }

}
