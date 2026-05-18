import DDBEnricherData from "../data/DDBEnricherData";
import GenericLightSource from "./GenericLightSource";

export default class Lamp extends GenericLightSource {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hooded Lantern Light",
        activityMatch: "Light",
        options: {
          transfer: false,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("45", 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.upgradeChange("15", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.overrideChange("#f8c377", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.4", 20, "token.light.alpha"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 20, "token.light.animation.intensity"),
          DDBEnricherData.ChangeHelper.overrideChange("torch", 20, "token.light.animation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 20, "token.light.animation.speed"),
        ],
      },
    ];
  }

}
