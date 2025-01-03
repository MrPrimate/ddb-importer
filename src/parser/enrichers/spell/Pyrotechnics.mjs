/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Pyrotechnics extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      name: "Fireworks",
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Smoke",
          type: "utility",
        },
        build: {
          generateDamage: false,
          generateConsumption: false,
          noeffect: true,
          targetOverride: {
            affects: {
              type: "creature",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "20",
              units: "ft",
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        statuses: ["Blinded"],
        activityMatch: "Fireworks",
      },
    ];
  }

}
