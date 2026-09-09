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
        atlOnly: true,
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "10"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "20"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "#ffffff"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "0.25"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "{\"type\": \"pulse\", \"speed\": 3,\"intensity\": 1}"),
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
