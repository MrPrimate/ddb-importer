/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StunningStrike extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      data: {
        "range.units": "touch",
        save: {
          ability: ["con"],
          dc: {
            calculation: "wis",
            formula: "",
          },
        },
      },
    };
  }

}
