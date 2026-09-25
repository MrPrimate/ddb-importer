import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Source-guarded activities for Berserk. */
export default class Berserk extends _MonsterFeatureSupport {
  override get activity(): IDDBActivityData | null {
    if ((/roll (?:a |1)d6/i).test(this.text)) {
      return {
        name: "Berserk Check",
        activationType: "special",
        targetSelf: true,
        noConsumeTargets: true,
        data: {
          roll: { formula: "1d6", name: "Berserk", visible: true, prompt: false },
        },
      };
    }
    return null;
  }

  override get type(): IDDBActivityType | null {
    return this.activity ? "utility" : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    const check = this.check();
    if (check)
      activities.push(
        this.extra("Calm Check", "ddbExtraCheck001", "check", {
          generateCheck: true,
          checkOverride: check,
          activationOverride: {
            type: "action",
            value: 1,
            condition:
              "Use the actor, reach, and eligibility requirements in the feature description. Remove the attachment or other condition on success.",
          },
        }),
      );
    return activities;
  }
}
