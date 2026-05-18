import DDBEnricherData from "../../data/DDBEnricherData";

export default class CoronaOfLight extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      data: {
        name: "Use/Apply Light",
      },
    };
  }


  get effects(): IDDBEffectHint[] {
    return [{
      options: {
      },
      activityMatch: "Use/Apply Light",
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "token.light.bright"),
        DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "token.light.dim"),
        DDBEnricherData.ChangeHelper.overrideChange("#ffffff", 20, "token.light.color"),
        DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
      ],
    }];
  }


}
