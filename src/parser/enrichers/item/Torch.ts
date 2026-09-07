import DDBEnricherData from "../data/DDBEnricherData";
import GenericLightSource from "./GenericLightSource";

export default class Torch extends GenericLightSource {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Torch Light",
        atlOnly: true,
        activityMatch: "Light",
        options: {
          transfer: false,
          durationSeconds: 3600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("40", 20, "ATL.light.dim"),
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "ATL.light.bright"),
          DDBEnricherData.ChangeHelper.overrideChange("#f8c377", 20, "ATL.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.4", 20, "ATL.light.alpha"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 20, "ATL.light.animation.intensity"),
          DDBEnricherData.ChangeHelper.overrideChange("torch", 20, "ATL.light.animation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 20, "ATL.light.animation.speed"),
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
