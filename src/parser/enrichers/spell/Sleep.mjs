/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Sleep extends DDBEnricherData {

  get type() {
    return this.is2014 ? "utility" : null;
  }

  get activity() {
    if (this.is2014) {
      return {
        data: {
          roll: {
            prompt: false,
            visible: false,
            formula: "3d8 + (2*@item.level)d8",
            name: "HP Effected",
          },
        },
      };
    }
    return {
      name: "Cast",
    };
  }

  get clearAutoEffects() {
    return this.is2024;
  }

  get additionalActivities() {
    if (this.is2014) return null;
    return [
      {
        duplicate: true,
        overrides: {
          name: "Save vs Unconscious",
          activationType: "special",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          targetType: "creature",
        },
      },
    ];
  }

  get effects() {
    if (this.is2014) return [];
    return [
      {
        name: "Incapacitated",
        statuses: ["Incapacitated"],
        options: {
          durationSeconds: 6,
        },
        daeSpecialDurations: ["turnEnd"],
        activityMatch: "Cast",
      },
      {
        name: "Unconscious",
        statuses: ["Unconscious"],
        options: {
          durationSeconds: 54,
        },
        daeSpecialDurations: ["isDamaged"],
        activityMatch: "Save vs Unconscious",
      },
    ];
  }

}
