/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Shifting extends DDBEnricherData {

  get override() {
    return {
      data: {
        "system.uses": this._getUsesWithSpent({
          type: "race",
          name: "Shift",
          max: "@prof",
        }),
      },
    };
  }

}
