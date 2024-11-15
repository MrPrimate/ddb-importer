/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PowerOfTheWilds extends DDBEnricherData {

  get type() {
    return "utility";
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
        constructor: {
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
        constructor: {
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
          this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
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
