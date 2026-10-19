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
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("40", 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.overrideChange("#ff9329", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
          DDBEnricherData.ChangeHelper.overrideChange("torch", 20, "token.light.animation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 20, "token.light.animation.speed"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 20, "token.light.animation.intensity"),
        ],
      },
    ];
  }

}
