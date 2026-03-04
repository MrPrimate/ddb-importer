import DDBEnricherData from "../../data/DDBEnricherData";

export default class TravelAlongTheTree extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "bonus",
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
          generateConsumption: true,
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

}
