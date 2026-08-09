import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdaptiveWildShapeSwimSpeedAndUnderwaterBreathing extends DDBEnricherData {

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
      name: "Adaptive Wild Shape: Swim Speed and Underwater Breathing",
      activityMatch: "Adapt Form",
      // DDB ships no modifier for the underwater breathing half, and there is no
      // dnd5e field for it, so only the swim speed is automated
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.movement.swim"),
      ],
    }];
  }

}
