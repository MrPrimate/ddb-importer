import DDBEnricherData from "../data/DDBEnricherData";

/** AU origin feat, three ability variants collapse here: a free Find Familiar cast per long rest. */
export default class FamiliarFriend extends DDBEnricherData {

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
      name: "Cast Find Familiar",
      targetType: "self",
      activationType: "hour",
      addItemConsume: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Helpful Friend", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: { generateActivation: true, generateConsumption: true, generateTarget: true },
        overrides: {
          targetType: "self",
          activationType: "special",
          activationCondition: "Ability check with a proficient skill while your familiar is within 5 feet",
          noConsumeTargets: true,
          addActivityConsume: true,
          data: { uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] } },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll" }],
      },
    };
  }

}
