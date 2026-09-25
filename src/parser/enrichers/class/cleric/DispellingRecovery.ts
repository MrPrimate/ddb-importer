import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Arcana Domain (AU 2024): one free Dispel Magic per short rest, and a use can be bought back
 * with a Channel Divinity charge.
 */
export default class DispellingRecovery extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast Dispel Magic",
      addItemConsume: true,
      targetType: "",
      activationType: "special",
      addSpellUuid: "Dispel Magic",
      activationCondition: "After casting a spell that restores HP or ends a condition",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Recover with Channel Divinity",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          activationOverride: { type: "none", value: null, condition: "" },
          consumptionOverride: {
            scaling: { allowed: false, max: "" },
            targets: [
              { type: "itemUses", target: "", value: -1, scaling: { mode: "", formula: "" } },
            ],
          },
        },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: "Channel Divinity",
          targetType: "self",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      retainUseSpent: true,
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "sr", type: "recoverAll" }],
      },
    };
  }

}
