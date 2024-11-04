/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class PatientDefense extends DDBEnricherMixin {

  get activity() {
    const result = {
      name: this.is2014 ? "Patient Defense: Dodge" : "Patient Defense: Disengage",
      targetType: "self",
      type: "utility",
    };
    return result;
  }

  get additionalActivities() {
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

  get effects() {
    if (this.is2014) {
      return [{
        name: "Patient Defense: Dodging",
        options: {
          durationRounds: 1,
          durationSeconds: 6,
        },
        statuses: ["dodging"],
        data: {
          "flags.ddbimporter.activitiesMatch": ["Patient Defense: Dodge"],
        },
      }];
    } else {
      return [
        {
          name: "Patient Defense: Disengaged",
          options: {
            durationRounds: 1,
            durationSeconds: 6,
          },
          data: {
            "flags.ddbimporter.activitiesMatch": ["Patient Defense: Disengage"],
          },
        },
        {
          name: "Patient Defense: Disengaged & Dodging",
          options: {
            durationRounds: 1,
            durationSeconds: 6,
          },
          statuses: ["dodging"],
          data: {
            "flags.ddbimporter.activitiesMatch": ["Patient Defense: Disengage & Dodge"],
          },
        },
      ];
    }
  }
}
