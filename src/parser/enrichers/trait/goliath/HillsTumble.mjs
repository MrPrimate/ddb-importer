/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HillsTumble extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      addItemConsume: true,
    };
  }

  get effects() {
    return [
      {
        statuses: ["Prone"],
      },
    ];
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
