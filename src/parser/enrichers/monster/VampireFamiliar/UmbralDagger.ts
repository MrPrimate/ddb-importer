import DDBEnricherData from "../../data/DDBEnricherData";

export default class UmbralDagger extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      noeffect: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Apply Poisoned Condition",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateTarget: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "Target reduced to 0 HP",
        },
      },
    ];
  }

}
