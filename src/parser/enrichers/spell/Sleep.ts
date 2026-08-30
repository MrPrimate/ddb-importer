import DDBEnricherData from "../data/DDBEnricherData";

export default class Sleep extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
  }

  override get activity(): IDDBActivityData {
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

  override get clearAutoEffects(): boolean {
    return this.is2024;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] | null {
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

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) return [];
    return [
      {
        name: "Incapacitated",
        statuses: ["Incapacitated"],
        options: {
          expiry: "targetEnd",
        },
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
