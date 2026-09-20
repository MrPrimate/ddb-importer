import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** A second failure changes the condition; it is never another use of the original attack/breath. */
export default class StagedSave extends _MonsterFeatureSupport {
  get staged(): boolean {
    return (
      (/Second Failure:/i).test(this.text) &&
      this.save() !== null &&
      (this.key === "Sleep Breath" ? (/Incapacitated/i).test(this.text) : (/Restrained/i).test(this.text))
    );
  }

  override get clearAutoEffects(): boolean {
    return this.staged;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.staged) return [];
    const second = this.extra("Second Save", "ddbSecondSave001", "save", {
      generateSave: true,
      saveOverride: this.save(),
      activationOverride: {
        type: "turnEnd",
        value: null,
        condition:
          "At the end of the affected creature's next turn, if the first-stage condition still applies. On success remove it; on failure replace it with the second-stage condition.",
      },
    });
    second.overrides = { noConsumeTargets: true };
    return [second];
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.staged) return [];
    const sleep = this.key === "Sleep Breath";
    return [
      {
        name: "First Failure",
        activityMatch: "First Save",
        statuses: [sleep ? "Incapacitated" : "Restrained"],
        options: {
          ...(sleep ? { expiry: "targetEnd" as const } : { expiry: null, durationSeconds: null }),
          description:
            "Resolve Second Save at the end of the affected creature's next turn. Remove this condition on success or replace it on failure.",
        },
      },
      {
        name: "Second Failure",
        activityMatch: "Second Save",
        statuses: [sleep ? "Unconscious" : "Petrified"],
        options: {
          expiry: null,
          durationSeconds: this.seconds(this.text.split(/Second Failure:/i)[1]),
          description: sleep
            ? "Remove the first-stage condition. Ends early on damage or when another creature uses an action to wake the target."
            : "Replaces the first-stage Restrained condition. Use the duration and removal conditions in the feature description.",
        },
        ...(sleep ? { daeSpecialDurations: ["isDamaged" as const] } : {}),
      },
    ];
  }

  override async cleanup(): Promise<void> {
    if (!this.staged) return;
    const first = this.activities.find((a) => a.type === "save" && a._id !== "ddbSecondSave001");
    if (!first) return;
    first.name = "First Save";
    const effects = this.document.effects as { _id: string; name: string }[];
    for (const activity of this.activities) {
      const name = activity === first ? "First Failure" : activity._id === "ddbSecondSave001" ? "Second Failure" : null;
      activity.effects = name ? effects.filter((e) => e.name === name).map((e) => ({ _id: e._id })) : [];
    }
  }
}
