import DDBEnricherData from "../data/DDBEnricherData";
import GenericLightSource from "./GenericLightSource";

export default class Candle extends GenericLightSource {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Candle Light",
        atlOnly: true,
        activityMatch: "Light",
        options: {
          transfer: false,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("5", 20, "ATL.light.dim"),
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "ATL.light.bright"),
          DDBEnricherData.ChangeHelper.overrideChange("#f8c377", 20, "ATL.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.4", 20, "ATL.light.alpha"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        autoDestroy: true,
      },
    };
  }

}
