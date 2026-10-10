import DDBEnricherData from "../../data/DDBEnricherData";

export default class CelestialRevelationInnerRadiance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      damageParts: [
        DDBEnricherData.basicDamagePart({ customFormula: "@prof", type: "radiant" }),
      ],
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Inner Radiance Light",
        activityMatch: "Unleash Celestial Energy",
        options: {
          durationSeconds: 60,
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "ATL.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "ATL.light.dim"),
          DDBEnricherData.ChangeHelper.overrideChange("#ffffff", 20, "ATL.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "ATL.light.alpha"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "ATL.light.animation.intensity"),
          DDBEnricherData.ChangeHelper.overrideChange("pulse", 20, "ATL.light.animation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("3", 20, "ATL.light.animation.speed"),
        ],
      },
    ];
  }

  // Without ATL the light is toggled by the linked macro in the description instead
  override get override(): IDDBOverrideData {
    return {
      ddbMacroDescription: !DDBEnricherData.AutoEffects.effectModules().atlInstalled,
    };
  }

  override get ddbMacroDescriptionData(): IDDBMacroDescriptionData {
    return {
      name: "innerRadiance",
      label: "Toggle Inner Radiance Light", // optional
      type: "feat",
    };
  }

}
