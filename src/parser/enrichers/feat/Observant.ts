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
    return [
      { action: { name: "Quick Search", type: "feat", rename: ["Quick Search"] } },
    ];
  }

}
