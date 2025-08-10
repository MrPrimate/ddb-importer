/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";
import GenericLightSource from "./GenericLightSource.mjs";

export default class Candle extends GenericLightSource {

  get effects() {
    return [
      {
        atlOnly: true,
        name: "Candle Light",
        activityMatch: "Light",
        options: {
          transfer: false,
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '5'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '10'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '#f8c377'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '0.4'),
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
