import DDBEnricherData from "../../data/DDBEnricherData";

export default class PowerOfTheWilds extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      targetType: "self",
      name: "Falcon",
      activationType: "special",
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Lion",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "creature",
            },
          },
        },
      },
      {
        init: {
          name: "Ram",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "creature",
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Falcoln",
        activityMatch: "Falcoln",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
      },
      {
        name: "Lion",
        activityMatch: "Lion",
      },
      {
        name: "Ram",
        activityMatch: "Ram",
      },
      {
        name: "Prone",
        activityMatch: "Ram",
        statuses: ["Prone"],
      },
    ];
  }

}
