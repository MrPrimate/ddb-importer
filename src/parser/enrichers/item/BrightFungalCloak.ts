import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Unfurling the cloak is a free Bonus Action toggle that sheds light; its one use is the fungus
 * eaten as food, which the light must not spend.
 */
export default class BrightFungalCloak extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Unfurl",
      activationType: "bonus",
      overrideActivation: true,
      noConsumeTargets: true,
      noTemplate: true,
      data: {
        duration: { override: true, units: "perm" },
        target: { override: true, affects: { type: "self", count: "", choice: false, special: "" } },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Unfurled",
        options: { transfer: false },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "5"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "10"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "#a8e6a1"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "0.25"),
        ],
      },
    ];
  }

}
