import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

export default class Freeze extends _MonsterFeatureSupport {
  get applies(): boolean {
    return (
      (/until the end of its next turn/i).test(this.text) &&
      (/(?:Speed decreases by|speed is reduced by) (\d+) feet/i).test(this.text)
    );
  }

  override get type(): IDDBActivityType | null {
    return this.applies ? "utility" : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.applies) return null;
    return {
      name: "Freeze",
      targetSelf: true,
      noTemplate: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.applies) return [];
    const C = _MonsterFeatureSupport.ChangeHelper;
    const amount = this.text.match(/(?:Speed decreases by|speed is reduced by) (\d+) feet/i)![1];
    return [
      {
        name: "Freeze: Benefit",
        changes: [C.unsignedAddChange(`-${amount}`, 20, "system.attributes.movement.walk")],
        activityMatch: "Freeze",
        options: { durationSeconds: 6, durationRounds: 1, expiry: "sourceEnd", description: this.text },
      },
    ];
  }
}
