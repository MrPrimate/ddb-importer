import DDBEnricherData from "../data/DDBEnricherData";

export default class HammerOfThunderbolts extends DDBEnricherData {

  get activity() {
    return {
      noConsumeTargets: true,
      name: "Attack",
      noeffect: true,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Giant: Save vs Death",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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
        init: {
          name: "Ranged Attack (Uses Charge)",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
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
        init: {
          name: "Save vs Stunned",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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

  get effects(): IDDBEffectHint[] {
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
