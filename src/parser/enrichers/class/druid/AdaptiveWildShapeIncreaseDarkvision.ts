import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdaptiveWildShapeIncreaseDarkvision extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  // DDB ships a sense darkvision modifier on this option, which generates an always-on
  // passive effect. This only applies while Wild Shaped, so drop it and use the
  // activity-linked effect below instead.
  override get clearAutoEffects(): boolean {
    return true;
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
      name: "Adaptive Wild Shape: Increase Darkvision",
      activityMatch: "Adapt Form",
      changes: [
        DDBEnricherData.ChangeHelper.addChange("30", 20, "system.attributes.senses.darkvision"),
      ],
    }];
  }

}
