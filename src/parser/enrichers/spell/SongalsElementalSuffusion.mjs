/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SongalsElementalSuffusion extends DDBEnricherData {

  get activity() {
    return {
      name: "Save vs Damage",
      targetType: "enemy",
      removeSpellSlotConsume: true,
      noConsumeTargets: true,
      data: {
        sort: 2,
        target: {
          override: true,
          template: {
            contiguous: false,
            type: "radius",
            size: "15",
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
          name: "Cast",
          type: "utility",
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateDuration: true,
        },
        overrides: {
          name: "Cast",
          data: {
            sort: 1,
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        activityMatch: "Cast",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.upgradeChange("true", 2, "system.attributes.movement.hover"),
        ],
      },
      {
        activityMatch: "Save vs Damage",
        statuses: ["prone"],
        name: "Prone",
      },
    ];
  }

  get combineDamageTypes() {
    return true;
  }

}
