import DDBEnricherData from "../../data/DDBEnricherData";

export default class StepOfTheWind extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.is2014 ? "Step of the Wind" : "Step of the Wind: Dash",
      targetType: "self",
      noConsumeTargets: this.is2024,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) {
      return [];
    } else {
      return [
        {
          name: "Step of the Wind: Disengaged & Dash",
          options: {
            // Disengage and Dash last for the turn they are taken on
            expiry: "turnEnd",
          },
          statuses: ["disengaged"],
          activitiesMatch: ["Step of the Wind: Disengage & Dash"],
        },
      ];
    }
  }

  override get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Step of the Wind: Dash"],
    };
  }
}
