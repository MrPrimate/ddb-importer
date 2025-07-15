/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CloudsJaunt extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
    };
  }

  get override() {
    return {
      data: {
        "system.uses": this._getUsesWithSpent({
          type: "race",
          name: this.ddbParser.originalName,
          max: "@prof",
          period: "lr",
        }),
      },
    };
  }

}
