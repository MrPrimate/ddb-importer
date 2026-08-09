import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdaptiveWildShapeFlightSpeed extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Adapt Form",
      activationType: "special",
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Adaptive Wild Shape: Flight Speed",
      activityMatch: "Adapt Form",
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("15", 20, "system.attributes.movement.fly"),
      ],
    }];
  }

}
