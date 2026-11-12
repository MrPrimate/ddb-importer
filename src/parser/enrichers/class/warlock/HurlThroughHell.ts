import DDBEnricherData from "../../data/DDBEnricherData";

export default class HurlThroughHell extends DDBEnricherData {

  // DDB types the 2024 action as a save without naming the ability; the 2014 feature has no save at all
  override get type(): IDDBActivityType | null {
    return this.is2024 ? DDBEnricherData.ACTIVITY_TYPES.SAVE : DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  /** Psychic damage on returning, taken only by a creature that isn't a Fiend: 8d10 in 2024, 10d10 in 2014. */
  get damagePart(): I5eDamagePart {
    return DDBEnricherData.basicDamagePart({ number: this.is2024 ? 8 : 10, denomination: 10, types: ["psychic"] });
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
          ? {
            save: { ability: ["cha"], dc: { calculation: "spellcasting", formula: "" } },
            damage: { onSave: "none", parts: [this.damagePart] },
          }
          : { damage: { parts: [this.damagePart] } }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Hurl Through Hell: Incapacitated",
      options: {
        // returns at the end of the warlock's next turn
        expiry: "sourceEnd",
      },
      statuses: ["Incapacitated"],
    }];
  }

  // only the 2024 feature can be restored with a Pact Magic slot
  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
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
