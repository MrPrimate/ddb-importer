import DDBEnricherData from "../../data/DDBEnricherData";

export default class BeguilingMagic extends DDBEnricherData {

  get activity() {
    return {
      name: "Save",
      addItemConsume: true,
      activationType: "special",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Recharge",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
            ],
            scaling: { allowed: false, max: "" },
          },
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Beguiling Magic",
        max: "1",
        period: "lr",
      }),
      ignoredConsumptionActivities: ["Save"],
      retainOriginalConsumption: true,
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frightened",
        options: {
        },
        statuses: ["Frightened"],
      },
      {
        name: "Charmed",
        options: {
        },
        statuses: ["Charmed"],
      },
    ];
  }

}
