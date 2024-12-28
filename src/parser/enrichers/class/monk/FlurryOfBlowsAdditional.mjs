/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FlurryOfBlowsAdditional extends DDBEnricherData {
  get type() {
    if (this.ddbParser.originalName === "Flurry of Blows: Addle") {
      return "utility";
    }
    return null;
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
          name: "Toppled: Prone",
          activityMatch: "Topple",
          statuses: ["Prone"],
        },
      ];
    } else if (this.ddbParser.originalName === "Flurry of Blows: Addle") {
      return [
        {
          name: "Addled",
          activityMatch: "Addle",
          options: {
            durationTurns: 1,
            description: "Target cannot make opportunity attacks",
          },
          daeSpecialDurations: ["turnStart"],
        },
      ];
    }
    return [];
  }
}
