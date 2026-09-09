import DDBEnricherData from "../data/DDBEnricherData";
import GenericLightSource from "./GenericLightSource";

export default class Torch extends GenericLightSource {

  override get effects(): IDDBEffectHint[] {
    const lightAnimation = "{type: \"torch\", speed: 2, intensity: 2}";
    return [
      {
        name: "Torch Light",
        atlOnly: true,
        activityMatch: "Light",
        options: {
          transfer: false,
          durationSeconds: 3600,
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "40"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "20"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "#f8c377"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "0.4"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.UPGRADE, lightAnimation),
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
