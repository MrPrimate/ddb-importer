import _MonsterTemporaryHP from "./_MonsterTemporaryHP";

export default class WarCry extends _MonsterTemporaryHP {
  override get effects(): IDDBEffectHint[] {
    if (!this.healing || !(/Advantage on attack rolls until the start of/i).test(this.text)) return [];
    return [
      {
        name: "War Cry: Benefit",
        changes: [_MonsterTemporaryHP.ChangeHelper.ruleAdvantageChange("attack")],
        activityMatch: "Temporary Hit Points",
        options: { expiry: "sourceStart", description: this.text },
      },
    ];
  }
}
