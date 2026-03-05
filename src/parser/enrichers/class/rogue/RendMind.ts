import DDBEnricherData from "../../data/DDBEnricherData";

export default class RendMind extends DDBEnricherData {

  get activity(): IDDBActivityData {
    if (this.is2014) {
      return {
        addItemConsume: true,
      };
    } else {
      return {
        addItemConsume: true,
        data: {
          save: {
            dc: { formula: "", calculation: "dex" },
            ability: ["wis"],
          },
        },
      };
    }
  }

  get effects(): IDDBEffectHint[] {
    return [];
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
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
                value: "3",
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
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Psychic Blades: Rend Mind",
      max: "1",
      period: "lr",
    });

    return {
      replaceActivityUses: true,
      uses,
    };
  }

}
