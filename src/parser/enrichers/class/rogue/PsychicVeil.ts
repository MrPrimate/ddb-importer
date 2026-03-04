import DDBEnricherData from "../../data/DDBEnricherData";

export default class PsychicVeil extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
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
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "itemUses",
                value: "1",
                target: "Psionic Power",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }
}
