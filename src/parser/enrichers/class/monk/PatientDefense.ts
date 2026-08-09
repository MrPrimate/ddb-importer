import DDBEnricherData from "../../data/DDBEnricherData";

export default class PatientDefense extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.is2014 ? "Patient Defense: Dodge" : "Patient Defense: Disengage",
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
          data: { name: "Patient Defense: Disengage & Dodge" },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) {
      return [{
        name: "Patient Defense: Dodging",
        options: {
          durationRounds: 1,
          durationSeconds: 6,
        },
        statuses: ["dodging"],
        activitiesMatch: ["Patient Defense: Dodge"],
      }];
    } else {
      return [
        {
          name: "Patient Defense: Disengaged",
          options: {
            durationRounds: 1,
            durationSeconds: 6,
          },
          activitiesMatch: ["Patient Defense: Disengage"],
        },
        {
          name: "Patient Defense: Disengaged & Dodging",
          options: {
            durationRounds: 1,
            durationSeconds: 6,
          },
          statuses: ["dodging"],
          activitiesMatch: ["Patient Defense: Disengage & Dodge"],
        },
      ];
    }
  }

  override get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Patient Defense: Disengage"],
    };
  }
}
