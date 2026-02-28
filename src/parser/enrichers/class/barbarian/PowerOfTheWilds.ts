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
          type: "utility",
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
          type: "utility",
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
        options: {
        },
        data: {
          "flags.ddbimporter.activityMatch": "Falcoln",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
      },
      {
        name: "Lion",
        options: {
        },
        data: {
          "flags.ddbimporter.activityMatch": "Lion",
        },
      },
      {
        name: "Ram",
        options: {
        },
        data: {
          "flags.ddbimporter.activityMatch": "Ram",
        },
      },
      {
        name: "Prone",
        options: {
        },
        data: {
          "flags.ddbimporter.activityMatch": "Ram",
        },
        statuses: ["Prone"],
      },
    ];
  }

}
