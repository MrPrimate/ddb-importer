import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdaptiveWildShapeIncreaseDarkvision extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  // DDB ships a sense darkvision modifier on this option, which generates an always-on
  // passive effect. This only applies while Wild Shaped, so drop it and use the
  // activity-linked effect below instead.
  get clearAutoEffects(): boolean {
    return true;
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
      name: "Adaptive Wild Shape: Increase Darkvision",
      activityMatch: "Adapt Form",
      changes: [
        DDBEnricherData.ChangeHelper.addChange("30", 20, "system.attributes.senses.ranges.darkvision"),
      ],
      atlChanges: [
        DDBEnricherData.ChangeHelper.atlChange("ATL.sight.range", "add", 30, 5),
      ],
    }];
  }

}
