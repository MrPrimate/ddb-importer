import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdaptiveWildShapeClimbSpeed extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Adapt Form",
      activationType: "special",
      targetType: "self",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Adaptive Wild Shape: Climb Speed",
      activityMatch: "Adapt Form",
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.movement.climb"),
      ],
    }];
  }

}
