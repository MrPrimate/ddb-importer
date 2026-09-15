import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

export default class FearOfFire extends _MonsterFeatureSupport {
  get applies(): boolean {
    return (/Disadvantage on attack rolls and ability checks until the end of its next turn/i).test(this.text);
  }

  override get type(): IDDBActivityType | null {
    return this.applies ? "utility" : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.applies) return null;
    return {
      name: "Fear of Fire",
      targetSelf: true,
      noTemplate: true,
      data: { description: { value: `<p>${this.text}</p>` } },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.applies) return [];
    const C = _MonsterFeatureSupport.ChangeHelper;

    return [
      {
        name: "Fear of Fire: Benefit",
        changes: [C.ruleDisadvantageChange("attack"), C.ruleDisadvantageChange("check")],
        activityMatch: "Fear of Fire",
        options: { expiry: "sourceEnd", description: this.text },
      },
    ];
  }
}
