import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Source-guarded activities for Reflective Carapace. */
export default class ReflectiveCarapace extends _MonsterFeatureSupport {
  override get activity(): IDDBActivityData | null {
    if ((/roll (?:a |1)d6/i).test(this.text)) {
      return {
        name: "Reflection Roll",
        activationType: "special",
        targetSelf: true,
        noConsumeTargets: true,
        data: {
          roll: { formula: "1d6", name: "Reflective Carapace", visible: true, prompt: false },
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
