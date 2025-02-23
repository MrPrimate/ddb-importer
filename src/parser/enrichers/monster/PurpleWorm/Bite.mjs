/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Bite extends DDBEnricherData {

  get type() {
    return "attack";
  }

  get activity() {
    return {
      name: this.is2014
        ? "Bite"
        : this.ddbEnricher?._originalActivity?.type === "check"
          ? "Escape Check"
          : "Bite",
      activationType: this.is2014
        ? "action"
        : this.ddbEnricher?._originalActivity?.type === "check"
          ? "special"
          : "action",
      data: this.is2014
        ? {
          damage: {
            parts: [this.ddbParser.actionInfo.damageParts[0]],
          },
        }
        : {

        },
    };
  }

  get additionalActivities2014() {
    return [
      {
        constructor: {
          name: "Swallowed Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
        },
        overrides: {
          activationType: "special",
        },
      },
      {
        constructor: {
          name: "Escape Check",
          type: "check",
        },
        build: {
          generateCheck: true,
        },
        overrides: {
          activationType: "special",
        },
      },
    ];
  }

  get additionalActivities() {
    if (this.is2014) return this.additionalActivities2014;
    return [];
  }

  get effects() {
    return this.is2014
      ? [
        {
          name: "Purple Worm: Swallowed",
          activityMatch: "Bite",
          statuses: ["Blinded", "Restrained"],
        },
      ]
      : [];
  }

}
