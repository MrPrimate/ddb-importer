import DDBEnricherData from "../data/DDBEnricherData";
import GenericLightSource from "./GenericLightSource";

export default class Torch extends GenericLightSource {

  get effects(): IDDBEffectHint[] {
    const lightAnimation = "{type: \"torch\", speed: 2, intensity: 2}";
    return [
      {
        atlOnly: true,
        name: "Torch Light",
        activityMatch: "Light",
        options: {
          transfer: false,
          durationSeconds: 3600,
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", "upgrade", "40"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", "upgrade", "20"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", "upgrade", "#f8c377"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", "upgrade", "0.4"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", "upgrade", lightAnimation),
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
