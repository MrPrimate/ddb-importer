import DDBEnricherData from "../data/DDBEnricherData";
import GenericLightSource from "./GenericLightSource";

export default class Candle extends GenericLightSource {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Candle Light",
        activityMatch: "Light",
        options: {
          transfer: false,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("5", 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.overrideChange("#f8c377", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.4", 20, "token.light.alpha"),
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
