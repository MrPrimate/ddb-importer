import DDBEnricherData from "../data/DDBEnricherData";
import GenericLightSource from "./GenericLightSource";

export default class BullseyeLantern extends GenericLightSource {

  get effects(): IDDBEffectHint[] {
    const lightAnimation = "{type: \"torch\", speed: 2, intensity: 2}";
    return [
      {
        atlOnly: true,
        name: "Bullseye Lantern Light",
        activityMatch: "Light",
        options: {
          transfer: false,
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", "upgrade", "120"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", "upgrade", "60"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.lockRotation", "override", "false"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.angle", "override", "52.5"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", "upgrade", "#f8c377"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", "upgrade", "0.4"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", "upgrade", lightAnimation),
        ],
      },
    ];
  }

}
