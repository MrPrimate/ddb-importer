/* eslint-disable class-methods-use-this */
import ArcaneShotOption from "./ArcaneShotOption.mjs";

export default class BeguilingArrow extends ArcaneShotOption {

  get type() {
    return this.isAction ? "damage" : "none";
  }

  get activity() {
    return {
      name: "Extra Damage",
      noTemplate: true,
      data: {
        range: {
          value: null,
          units: "spec",
        },
      },
    };
  }

  get additionalActivities() {
    return this.isAction
      ? [
        {
          constructor: {
            name: "Save vs Charmed",
            type: "save",
          },
          build: {
            generateSave: true,
            generateDamage: false,
            generateRange: true,
            noSpellslot: true,
          },
          overrides: {
            noConsumeTargets: true,
            activationType: "special",
            noTemplate: true,
            data: {
              range: {
                value: null,
                units: "spec",
              },
            },
          },
        },
      ]
      : [];
  }

  get effects() {
    if (!this.isAction) return [];
    return [
      {
        name: "Charmed",
        activityMatch: "Save vs Charmed",
        statuses: ["Charmed"],
        options: {
          durationSeconds: 12,
        },
        daeSpecialDurations: ["turnEnd"],
      },
    ];
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter": {
          ignoredConsumptionActivities: ["Save vs Charmed"],
        },
      },
    };
  }

}
