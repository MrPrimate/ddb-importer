import DDBEnricherData from "../../data/DDBEnricherData";

export default class FlurryOfBlowsAdditional extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    if (this.ddbParser.originalName === "Flurry of Blows: Addle") {
      return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
    }
    return null;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "You hit a creature with a Flurry of Blows strike",
    };
  }

  override get override(): IDDBOverrideData {
    return {
      retainResourceConsumption: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
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
            expiry: "targetStart",
            description: "Target cannot make opportunity attacks",
          },
        },
      ];
    }
    return [];
  }
}
