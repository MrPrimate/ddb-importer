import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverStoicOxenSpirit extends DDBEnricherData {


  override get builtFeaturesFromActionFilters(): string[] {
    return ["Stoic Oxen Spirit: Remove Condition"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "End Condition",
      activationType: "reaction",
      activationCondition: "You become charmed or frightened",
      targetType: "self",
      data: {
        description: {
          chatFlavor: "The triggering charmed or frightened condition ends, and you have advantage on attack rolls against the creature that caused it until the end of your next turn.",
        },
      },
    };
  }

}
