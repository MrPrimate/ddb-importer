import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

export default class Rally extends _MonsterFeatureSupport {
  get applies(): boolean {
    return (/Advantage on attack rolls and saving throws/i).test(this.text) && (/until the start of/i).test(this.text);
  }

  override get type(): IDDBActivityType | null {
    return this.applies ? "utility" : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.applies) return null;
    return { name: "Rally", data: { description: { value: `<p>${this.text}</p>` } } };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.applies) return [];
    const C = _MonsterFeatureSupport.ChangeHelper;

    return [
      {
        name: "Rally: Benefit",
        changes: [C.ruleAdvantageChange("attack"), C.ruleAdvantageChange("save")],
        activityMatch: "Rally",
        options: { expiry: "sourceStart", description: this.text },
      },
    ];
  }
}
