import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Source-guarded activities for Shadow Escape. */
export default class ShadowEscape extends _MonsterFeatureSupport {
  override get activity(): IDDBActivityData | null {
    if ((/Paralyzed condition for 1 hour/i).test(this.text)) {
      return {
        name: "Rest in Shadow",
        activationType: "special",
        targetSelf: true,
        noConsumeTargets: true,
        data: { description: { value: `<p>${this.text}</p>` } },
      };
    }
    return null;
  }

  override get type(): IDDBActivityType | null {
    return this.activity ? "utility" : null;
  }

  override get effects(): IDDBEffectHint[] {
    if (this.activity)
      return [
        {
          name: "Resting",
          statuses: ["Paralyzed"],
          activityMatch: "Rest in Shadow",
          options: { expiry: null, durationSeconds: 3600 },
        },
      ];
    return [];
  }

  override get clearAutoEffects(): boolean {
    return this.activity !== null;
  }
}
