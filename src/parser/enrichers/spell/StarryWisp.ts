import DDBEnricherData from "../data/DDBEnricherData";

export default class StarryWisp extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          expiry: "sourceEnd",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "ATL.light.dim"),
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
