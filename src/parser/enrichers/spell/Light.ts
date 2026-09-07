import DDBEnricherData from "../data/DDBEnricherData";

export default class Light extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "object",
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        "flags.midiProperties.autoFailFriendly": true,
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          durationSeconds: 3600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("40", 20, "ATL.light.dim"),
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "ATL.light.bright"),
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
