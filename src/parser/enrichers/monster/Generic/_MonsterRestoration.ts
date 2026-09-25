import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Source-derived return timing for restoration traits; revival and body placement remain manual. */
export default abstract class _MonsterRestoration extends _MonsterFeatureSupport {
  override get activity(): IDDBActivityData | null {
    if ((/regains all|reviv|reforms/i).test(this.text)) {
      const days = this.text.match(/(?:in|after) (\d+d\d+|\d+) days/i);
      return {
        name: "Restoration",
        activationType: "special",
        targetSelf: true,
        noConsumeTargets: true,
        data: {
          roll: { formula: days?.[1] ?? "", name: "Days to Return", visible: true, prompt: false },
        },
      };
    }
    return null;
  }

  override get type(): IDDBActivityType | null {
    return this.activity ? "utility" : null;
  }
}
