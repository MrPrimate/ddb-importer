import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Source-guarded activities for Adhesive. */
export default class Adhesive extends _MonsterFeatureSupport {
  override get activity(): IDDBActivityData | null {
    if ((/grappled/i).test(this.text)) {
      return {
        name: "Adhere",
        activationType: "special",
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
          name: "Adhered",
          statuses: ["Grappled"],
          activityMatch: "Adhere",
          options: { expiry: null, durationSeconds: null, description: this.text },
        },
      ];
    return [];
  }
}
