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
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("5", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.overrideChange("#a8e6a1", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
        ],
      },
    ];
  }

}
