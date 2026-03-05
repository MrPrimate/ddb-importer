import DDBEnricherData from "../../data/DDBEnricherData";

export default class GuidedStrike extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Self",
      targetType: "self",
      activationType: "special",
      activationCondition: "When you miss with an attack",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Other",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "",
          },
          targetOverride: {
            affects: {
              type: "ally",
              count: "1",
            },
          },
          rangeOverride: {
            units: "ft",
            value: "30",
          },
        },
      },
    ];
  }

}
