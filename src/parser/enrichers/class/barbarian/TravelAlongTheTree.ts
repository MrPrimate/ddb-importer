import DDBEnricherData from "../../data/DDBEnricherData";

export default class TravelAlongTheTree extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TELEPORT;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      data: {
        name: "Teleport 60 ft",
        range: {
          override: true,
          value: "60",
          units: "ft",
          special: "",
        },
        target: {
          override: true,
          prompt: false,
          affects: {
            count: "1",
            type: "self",
          },
          template: {},
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Group Teleport",
          type: DDBEnricherData.ACTIVITY_TYPES.TELEPORT,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateActivation: true,
          targetOverride: {
            prompt: false,
            affects: {
              count: "7",
              type: "willing",
              special: "Control the barbarian and up to six willing creatures within 10 feet of the barbarian.",
            },
            template: {},
          },
          rangeOverride: {
            value: "150",
            units: "ft",
            special: "",
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
