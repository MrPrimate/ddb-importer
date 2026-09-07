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
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("5", 20, "ATL.light.bright"),
          DDBEnricherData.ChangeHelper.overrideChange("#ffffff", 20, "ATL.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "ATL.light.alpha"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "ATL.light.animation.intensity"),
          DDBEnricherData.ChangeHelper.overrideChange("pulse", 20, "ATL.light.animation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("3", 20, "ATL.light.animation.speed"),
        ],
      },
    ];
  }

}
