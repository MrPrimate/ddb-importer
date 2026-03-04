import DDBEnricherData from "../../data/DDBEnricherData";

export default class HurlThroughHell extends DDBEnricherData {

  get activity() {
    return {
      name: "Hurl Through Hell",
      activationType: "special",
      activationCondition: "1/turn. You hit a creature with an attack roll.",
      data: {
        range: {
          units: "special",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Hurl Through Hell: Incapacitated",
      options: {
        durationSeconds: 12,
      },
      statuses: ["Incapacitated"],
    }];
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Spend Pact Slot to Restore Use",
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
                type: "attribute",
                value: "1",
                target: "spells.pact.value",
              },
            ],
          },
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [
          { period: "lr", type: "recoverAll", formula: undefined },
        ],
      },
      retainOriginalConsumption: true,
    };
  }

}
