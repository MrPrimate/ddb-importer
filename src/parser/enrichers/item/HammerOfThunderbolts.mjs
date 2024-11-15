/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class HammerOfThunderbolts extends DDBEnricherData {

  get activity() {
    return {
      noConsumeTargets: true,
      name: "Attack",
      noeffect: true,
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Giant: Save vs Death",
          type: "save",
        },
        build: {
          generateSave: true,
          generateTarget: true,
          targetOverride: {
            affects: {
              type: "creature",
            },
          },
          saveOverride: {
            ability: ["con"],
            dc: {
              calculation: "",
              formula: "17",
            },
          },
        },
      },
      {
        constructor: {
          name: "Ranged Attack (Uses Charge)",
          type: "attack",
        },
        build: {
          generateTarget: true,
          generateRange: true,
          generateDamage: true,
          generateAttack: true,
          generateConsumption: true,
          attackOverride: {
            ability: "str",
            type: {
              value: "ranged",
              classification: "weapon",
            },
          },
          rangeOverride: {
            override: true,
            value: "20",
            long: "60",
            units: "ft",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
            },
          },
        },
      },
      {
        constructor: {
          name: "Save vs Stunned",
          type: "save",
        },
        build: {
          generateSave: true,
          generateTarget: true,
          targetOverride: {
            affects: {
              type: "creature",
            },
            template: {
              type: "radius",
              size: "30",
              units: "ft",
            },
          },
          saveOverride: {
            ability: ["con"],
            dc: {
              calculation: "",
              formula: "17",
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        "system.range.long": "60",
      },
    };
  }

  get effects() {
    return [
      {
        noCreate: true,
        options: {
          transfer: false,
        },
        activityMatch: "Giant: Save vs Death",
      },
      {
        options: {
          transfer: false,
        },
        statuses: ["Stunned"],
        activityMatch: "Save vs Stunned",
      },
    ];
  }

}
