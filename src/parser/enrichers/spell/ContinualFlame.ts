import DDBEnricherData from "../data/DDBEnricherData";

export default class ContinualFlame extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    // a target override keeps the spell's Touch range, which targetType would replace with Self
    return {
      data: {
        target: {
          override: true,
          affects: { type: "object", count: "1", choice: false, special: "" },
        },
      },
    };
  }

  // torch brightness: Bright Light 20 feet and Dim Light 20 feet beyond, until dispelled
  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          durationSeconds: null,
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "40"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "20"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "#ff9329"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "0.25"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "{\"type\": \"torch\", \"speed\": 2, \"intensity\": 2}"),
        ],
      },
    ];
  }

}
