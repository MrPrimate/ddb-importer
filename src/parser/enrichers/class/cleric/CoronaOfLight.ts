import DDBEnricherData from "../../data/DDBEnricherData";

export default class CoronaOfLight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      data: {
        name: "Use/Apply Light",
      },
    };
  }


  override get effects(): IDDBEffectHint[] {
    return [{
      options: {
      },
      activityMatch: "Use/Apply Light",
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "ATL.light.bright"),
        DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "ATL.light.dim"),
        DDBEnricherData.ChangeHelper.overrideChange("#ffffff", 20, "ATL.light.color"),
        DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "ATL.light.alpha"),
      ],
    }];
  }


}
