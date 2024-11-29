/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FlurryOfBlowsAdditional extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "special",
      activationCondition: "You hit a creature with a Flurry of Blows strike",
    };
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.retainResourceConsumption": true,
      },
    };
  }

  get effects() {
    if (this.ddbParser.originalName === "Flurry of Blows: Topple") {
      return [
        {
          name: "Prone",
          statuses: ["Prone"],
        },
      ];
    }
    return [];
  }
}
