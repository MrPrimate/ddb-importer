import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Source-guarded activities for Prone Deficiency. */
export default class ProneDeficiency extends _MonsterFeatureSupport {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    if ((/odd number/i).test(this.text)) {
      activities.push(
        this.extra("Prone: Odd or Even", "ddbProneDie00001", "utility", {
          generateRoll: true,
          rollOverride: { formula: "1d6", name: "Odd: Incapacitated", visible: true, prompt: false },
          activationOverride: {
            type: "special",
            value: null,
            condition:
              "When the creature becomes Prone, apply Incapacitated on an odd roll. Use the saving throw at the end of its turns to end Incapacitated.",
          },
        }),
      );
    }
    return activities;
  }
}
