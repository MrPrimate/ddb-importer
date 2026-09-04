import DDBEnricherData from "../data/DDBEnricherData";

export default class OrbOfSorcery extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Sorcerous Reservoir",
      targetType: "self",
      activationType: "action",
      addItemConsume: true,
      additionalConsumptionTargets: [],
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Regain 2 Sorcery Points", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          activationOverride: { type: "none", value: null, condition: "Use with Sorcerous Reservoir" },
        },
        overrides: {
          targetType: "self",
          addItemConsume: true,
          itemConsumeTargetName: "feat:sorcery-points",
          itemConsumeValue: "-2",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: 0,
        max: "1",
        recovery: [{ period: "dawn", type: "recoverAll" }],
      },
    };
  }

}
