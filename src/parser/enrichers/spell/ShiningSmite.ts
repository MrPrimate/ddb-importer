import DDBEnricherData from "../data/DDBEnricherData";

export default class ShiningSmite extends DDBEnricherData {

  get activity(): IDDBActivityData {
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        name: "Shedding Light",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("5", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.overrideChange("#ffffff", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "token.light.animation.intensity"),
          DDBEnricherData.ChangeHelper.overrideChange("pulse", 20, "token.light.animation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("3", 20, "token.light.animation.speed"),
        ],
      },
    ];
  }

}
