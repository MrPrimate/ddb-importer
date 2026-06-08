import DDBEnricherData from "../../data/DDBEnricherData";

export default class UmbralForm extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: this.is2014 ? "bonus" : "special",
      noConsumeTargets: this.is2024,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return this.is2014
      ? []
      : [
        {
          init: {
            name: "Spend Sorcery Points to Restore Use",
            type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
          },
          build: {
            generateConsumption: true,
            generateTarget: true,
            generateActivation: true,
            generateUtility: true,
            noeffect: true,
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
                  value: "6",
                  target: "sorcery-points",
                  scaling: { allowed: false, max: "" },
                },
              ],
            },
          },
        },
      ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Umbral Form",
        changes: DDBEnricherData.allDamageTypes(["force", "radiant"]).map((t) => {
          return DDBEnricherData.ChangeHelper.damageResistanceChange(t);
        }),
      },
    ];
  }

}
