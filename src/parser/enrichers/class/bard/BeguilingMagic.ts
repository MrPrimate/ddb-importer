import DDBEnricherData from "../../data/DDBEnricherData";

export default class BeguilingMagic extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Save",
      addItemConsume: true,
      activationType: "special",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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

  override get override(): IDDBOverrideData {
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

  override get effects(): IDDBEffectHint[] {
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
