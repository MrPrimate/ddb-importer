import DDBEnricherData from "../../data/DDBEnricherData";

export default class CelestialRevelationInnerRadiance extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "special",
      damageParts: [
        DDBEnricherData.basicDamagePart({ customFormula: "@prof", type: "radiant" }),
      ],
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Inner Radiance Light",
        activityMatch: "Unleash Celestial Energy",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange("12", 20, "token.light.bright"),
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
