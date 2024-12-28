/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StepOfTheWind extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: this.is2014 ? "Step of the Wind" : "Step of the Wind: Dash",
      targetType: "self",
      noConsumeTargets: this.is2024,
    };
  }

  get additionalActivities() {
    if (this.is2014) return [];
    return [
      {
        duplicate: true,
        overrides: {
          addItemConsume: true,
          data: { name: "Step of the Wind: Disengage & Dash" },
        },
      },
    ];
  }

  get effects() {
    if (this.is2014) {
      return [];
    } else {
      return [
        {
          name: "Step of the Wind: Disengaged & Dash",
          options: {
            durationRounds: 1,
            durationSeconds: 6,
          },
          statuses: ["disengaged"],
          data: {
            "flags.ddbimporter.activitiesMatch": ["Step of the Wind: Disengage & Dash"],
          },
        },
      ];
    }
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.ignoredConsumptionActivities": ["Step of the Wind: Dash"],
      },
    };
  }
}
