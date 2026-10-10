import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Magus level 5. After failing an ability check, add Intelligence plus the highest level of
 * unexpended spell slot (picked as the scaling); once per Short or Long Rest, and a spell slot of
 * any level restores the use.
 */
export default class ArcaneAbility extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Arcane Ability",
      activationType: "special",
      activationCondition: "You fail an ability check; pick your highest unexpended spell slot level as the scaling",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      addConsumptionScalingMax: "5",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "@abilities.int.mod + @scaling",
          name: "Ability Check Bonus",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
          activationOverride: { type: "none", value: null, condition: "Expend a spell slot" },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: "-1",
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                target: "1",
                value: "1",
                scaling: { mode: "level", formula: "" },
              },
            ],
            scaling: { allowed: true, max: "5" },
          },
        },
        overrides: {
          targetType: "self",
          rangeSelf: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Arcane Ability",
        max: "1",
        period: "sr",
      }),
    };
  }

}
