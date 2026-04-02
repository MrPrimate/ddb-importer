import DDBEnricherData from "../../data/DDBEnricherData";

export default class CoronaOfLight extends DDBEnricherData {

  get type() {
    return DDBEnricherData.AutoEffects.effectModules().atlInstalled
      ? DDBEnricherData.ACTIVITY_TYPES.UTILITY
      : DDBEnricherData.ACTIVITY_TYPES.DDBMACRO;
  }

  get activity(): IDDBActivityData {
    if (DDBEnricherData.AutoEffects.effectModules().atlInstalled) {
      return {
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        data: {
          name: "Use/Apply Light",
        },
      };
    } else {
      return {
        type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
        data: {
          name: "Use/Apply Light",
          macro: {
            name: "Apply Light",
            function: "ddb.generic.light",
            visible: false,
            parameters: `{"targetsSelf":true,"targetsToken":true,"lightConfig":{"dim":60,"bright":30},"flag":"light"}`,
          },
        },
      };
    }
  }


  get effects(): IDDBEffectHint[] {
    if (!DDBEnricherData.AutoEffects.effectModules().atlInstalled) return [];
    return [{
      options: {
      },
      activityMatch: "Use/Apply Light",
      atlChanges: [
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", "override", "30"),
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", "override", "60"),
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", "override", "#ffffff"),
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", "override", "0.25"),
      ],
    }];

  }


}
