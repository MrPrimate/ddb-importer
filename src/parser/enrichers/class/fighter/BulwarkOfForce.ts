import DDBEnricherData from "../../data/DDBEnricherData";
import Generic from "../Generic";

export default class BulwarkOfForce extends Generic {

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  // "you can't do so again until you finish a Long Rest unless you expend a Psionic Energy Die"
  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Spend Psionic Energy Die to Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: { type: "none", value: null, condition: "" },
          consumptionOverride: {
            targets: [
              { type: "itemUses", target: "", value: -1, scaling: { mode: "", formula: "" } },
              { type: "itemUses", value: "1", target: "Psionic Power", scaling: { allowed: false, max: "" } },
            ],
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Psychic Cover",
        statuses: ["coverHalf"],
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }


}
