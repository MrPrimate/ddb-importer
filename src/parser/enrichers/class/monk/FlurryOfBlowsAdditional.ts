import DDBEnricherData from "../../data/DDBEnricherData";

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
      retainResourceConsumption: true,
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
