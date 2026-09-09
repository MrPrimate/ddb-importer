import DDBEnricherData from "../data/DDBEnricherData";

export default class ShiningSmite extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          critical: {
            allow: true,
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        name: "Shedding Light",
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "5"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "#ffffff"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "0.25"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "{\"type\": \"pulse\", \"speed\": 3,\"intensity\": 1}"),
        ],
      },
    ];
  }

}
