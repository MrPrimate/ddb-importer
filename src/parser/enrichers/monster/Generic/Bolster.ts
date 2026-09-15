import _MonsterTemporaryHP from "./_MonsterTemporaryHP";

export default class Bolster extends _MonsterTemporaryHP {
  protected override get selfTarget(): boolean {
    return true;
  }

  get buffsAllies(): boolean {
    return this.healing !== null && (/Advantage on (?:d20 test;)?D20 Tests until the end/i).test(this.text);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.buffsAllies) return [];
    const radius = this.text.match(/each ally within (\d+) feet/i)?.[1];
    if (!radius) return [];
    const buff = this.extra("Bolster Allies", "ddbBolsterBuff01", "utility", {
      activationOverride: {
        type: "special",
        value: null,
        condition: "Apply to the monster and eligible allies when Bolster is used.",
      },
      targetOverride: {
        affects: { type: "ally", count: "", choice: false },
        template: { type: "radius", size: radius, units: "ft" },
      },
      rangeOverride: { units: "self" },
    });
    buff.overrides = { noConsumeTargets: true };
    return [buff];
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.buffsAllies) return [];
    return [
      {
        name: "Bolster: Benefit",
        changes: ["attack", "save", "check"].map((c) =>
          _MonsterTemporaryHP.ChangeHelper.ruleAdvantageChange(c as "attack" | "save" | "check"),
        ),
        activityMatch: "Bolster Allies",
        options: { expiry: "sourceEnd", description: this.text },
      },
    ];
  }
}
