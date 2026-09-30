import DDBEnricherData from "../data/DDBEnricherData";
import _HandheldFlame from "./_HandheldFlame";

export default class Candle extends _HandheldFlame {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Candle Light",
        atlOnly: true,
        activityMatch: "Light",
        options: {
          transfer: false,
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "5"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "10"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "#f8c377"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "0.4"),
        ],
      },
    ];
  }
}
