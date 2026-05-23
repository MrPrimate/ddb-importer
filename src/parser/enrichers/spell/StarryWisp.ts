import DDBEnricherData from "../data/DDBEnricherData";

export default class StarryWisp extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          durationSeconds: 6,
          expiry: "turnEnd",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "token.light.dim"),
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
