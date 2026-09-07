import DDBEnricherData from "../data/DDBEnricherData";
import GenericLightSource from "./GenericLightSource";

export default class Lamp extends GenericLightSource {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hooded Lantern Light",
        atlOnly: true,
        activityMatch: "Light",
        options: {
          transfer: false,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("45", 20, "ATL.light.dim"),
          DDBEnricherData.ChangeHelper.upgradeChange("15", 20, "ATL.light.bright"),
          DDBEnricherData.ChangeHelper.overrideChange("#f8c377", 20, "ATL.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.4", 20, "ATL.light.alpha"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 20, "ATL.light.animation.intensity"),
          DDBEnricherData.ChangeHelper.overrideChange("torch", 20, "ATL.light.animation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 20, "ATL.light.animation.speed"),
        ],
      },
    ];
  }

}
