import DDBEnricherData from "../../data/DDBEnricherData";

export default class HurlThroughHell extends DDBEnricherData {

  // DDB types the 2024 action as a save without naming the ability; the 2014 feature has no save at all
  override get type(): IDDBActivityType | null {
    return this.is2024 ? DDBEnricherData.ACTIVITY_TYPES.SAVE : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Hurl Through Hell",
      activationType: "special",
      activationCondition: "1/turn. You hit a creature with an attack roll.",
      data: {
        range: {
          units: "spec",
        },
        ...(this.is2024
          ? { save: { ability: ["cha"], dc: { calculation: "spellcasting", formula: "" } } }
          : {}),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Hurl Through Hell: Incapacitated",
      options: {
        durationSeconds: 12,
      },
      statuses: ["Incapacitated"],
    }];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [
          { period: "lr", type: "recoverAll", formula: undefined },
        ],
      },
      retainOriginalConsumption: true,
      retainUseSpent: true,
    };
  }

}
