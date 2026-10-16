import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Source-derived return timing for restoration traits; revival and body placement remain manual. */
export default abstract class _MonsterRestoration extends _MonsterFeatureSupport {
  override get activity(): IDDBActivityData | null {
    if ((/regains all|reviv|reforms/i).test(this.text)) {
      // darklords return in weeks ("in 1d10 weeks"), most others in days
      const delay = this.text.match(/(?:in|after) (\d+d\d+|\d+) (days|weeks)/i);
      const unit = delay?.[2].toLowerCase() === "weeks" ? "Weeks" : "Days";
      return {
        name: "Restoration",
        activationType: "special",
        targetSelf: true,
        noConsumeTargets: true,
        data: {
          roll: { formula: delay?.[1] ?? "", name: `${unit} to Return`, visible: true, prompt: false },
          description: { value: `<p>${this.text}</p>` },
        },
      };
    }
    return null;
  }

  override get type(): IDDBActivityType | null {
    return this.activity ? "utility" : null;
  }
}
