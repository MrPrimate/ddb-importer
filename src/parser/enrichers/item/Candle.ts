import DDBEnricherData from "../data/DDBEnricherData";
import GenericLightSource from "./GenericLightSource";

export default class Candle extends GenericLightSource {

  get effects(): IDDBEffectHint[] {
    return [
      {
        atlOnly: true,
        name: "Candle Light",
        activityMatch: "Light",
        options: {
          transfer: false,
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", "upgrade", "5"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", "upgrade", "10"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", "upgrade", "#f8c377"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", "upgrade", "0.4"),
        ],
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        autoDestroy: true,
      },
    };
  }

}
