import DDBEnricherData from "../../data/DDBEnricherData";

export default class TravelAlongTheTree extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      noConsumeTargets: true,
      data: {
        name: "Teleport 60 ft",
        range: {
          value: "60",
          units: "ft",
          special: "",
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Group Teleport",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateActivation: true,
          targetOverride: {
            affects: {
              count: "7",
              type: "willing",
              special: "Within 10 feet of you.",
            },
          },
          rangeOverride: {
            value: "150",
            units: "ft",
          },
          durationOverride: {
            units: "inst",
          },
          activationOverride: {
            type: "bonus",
          },
        },
      },
    ];
  }

  // DDB gives the group teleport one use "per Rage" with no reset; like the official PHB item the
  // feature tracks no uses
  override get override(): IDDBOverrideData {
    return {
      uses: { spent: null, max: "" },
    };
  }

}
