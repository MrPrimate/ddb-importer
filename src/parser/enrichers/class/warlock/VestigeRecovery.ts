import DDBEnricherData from "../../data/DDBEnricherData";

export default class VestigeRecovery extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Vestige Recovery",
      targetType: "self",
      activationType: "reaction",
      activationCondition: "When your Vestige Companion would drop to 0 HP",
      addItemConsume: true,
      additionalConsumptionTargets: [
        {
          type: "attribute",
          value: "1",
          target: "spells.pact.value",
        },
      ],
    };
  }

  override get override(): IDDBOverrideData {
    return {
      retainUseSpent: true,
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll" }],
      },
    };
  }

}
