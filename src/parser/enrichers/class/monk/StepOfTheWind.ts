import DDBEnricherData from "../../data/DDBEnricherData";

export default class StepOfTheWind extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: this.is2014 ? "Step of the Wind" : "Step of the Wind: Dash",
      targetType: "self",
      noConsumeTargets: this.is2024,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
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

  get effects(): IDDBEffectHint[] {
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
          activitiesMatch: ["Step of the Wind: Disengage & Dash"],
        },
      ];
    }
  }

  get override() {
    return {
      ignoredConsumptionActivities: ["Step of the Wind: Dash"],
    };
  }
}
