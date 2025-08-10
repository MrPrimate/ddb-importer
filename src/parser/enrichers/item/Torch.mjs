/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";
import GenericLightSource from "./GenericLightSource.mjs";

export default class Torch extends GenericLightSource {

  get effects() {
    const lightAnimation = '{type: "torch", speed: 2, intensity: 2}';
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
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '40'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '20'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '#f8c377'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '0.4'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.UPGRADE, lightAnimation),
        ],
      },
    ];
  }

  get override() {
    return {
      data: {
        "system.uses": {
          autoDestroy: true,
        },
      },
    };
  }


}
