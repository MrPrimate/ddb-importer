import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Source-guarded activities for Barbed Hide. */
export default class BarbedHide extends _MonsterFeatureSupport {
  override get activity(): IDDBActivityData | null {
    if (this.damageTokens(this.text).length === 1) {
      return {
        name: "Barbed Hide Damage",
        activationType: "turnStart",
        noConsumeTargets: true,
        removeDamageParts: true,
        damageParts: this.damageTokens(this.text).map((p) => p.part),
        data: { damage: { includeBase: false }, description: { value: `<p>${this.text}</p>` } },
      };
    }
    return null;
  }

  override get type(): IDDBActivityType | null {
    return this.activity ? "damage" : null;
  }
}
