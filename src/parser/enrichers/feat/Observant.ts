import DDBEnricherData from "../data/DDBEnricherData";

export default class Observant extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    if (!this.is2014) {
      return [];
    }
    return [
      {
        noCreate: true,
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.observantFeat"),
        ],
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    // Quick Search is a 2024 benefit; the 2014 feat has no action
    if (this.is2014) return [];
    return [
      { action: { name: "Quick Search", type: "feat", rename: ["Quick Search"] } },
    ];
  }

}
