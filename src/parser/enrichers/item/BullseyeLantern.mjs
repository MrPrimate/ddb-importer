/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BullseyeLantern extends DDBEnricherData {

  get effects() {
    const lightAnimation = '{type: "torch", speed: 2, intensity: 2}';
    return [
      {
        atlOnly: true,
        name: "Bullseye Lantern Light",
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '120'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '60'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.lockRotation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, 'false'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.angle", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '52.5'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '#f8c377'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '0.4'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.UPGRADE, lightAnimation),
        ],
      },
    ];
  }

}
