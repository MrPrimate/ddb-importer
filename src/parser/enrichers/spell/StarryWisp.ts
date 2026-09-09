import DDBEnricherData from "../data/DDBEnricherData";

export default class StarryWisp extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          expiry: "sourceEnd",
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "10"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "#ffffff"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "0.25"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "{\"type\": \"pulse\", \"speed\": 3,\"intensity\": 1}"),
        ],
      },
    ];
  }

}
