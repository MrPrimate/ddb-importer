import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/**
 * "While Bloodied, the boar has Advantage on attack rolls" and the Bloodied Frenzy variant that
 * adds saving throws. dnd5e rule changes read the roller's own Bloodied status at roll time, so
 * the effect stays on.
 */
export default class BloodiedFury extends _MonsterFeatureSupport {

  override get effects(): IDDBEffectHint[] {
    const text = this.text.toLowerCase();
    if (!text.includes("advantage")) return [];
    const bloodied = _MonsterFeatureSupport.ChangeHelper.statusFilter("bloodied");
    const melee = (/melee attack rolls/).test(text);
    return [
      {
        name: this.key,
        options: {
          transfer: true,
          durationSeconds: null,
          expiry: null,
          description: "Advantage while Bloodied. Needs dnd5e's Bloodied status on the monster.",
        },
        changes: [
          _MonsterFeatureSupport.ChangeHelper.ruleAdvantageChange("attack", {
            conditions: melee ? [bloodied, _MonsterFeatureSupport.ChangeHelper.MELEE_ATTACK_FILTER] : [bloodied],
          }),
          ...((/saving throws/).test(text)
            ? [_MonsterFeatureSupport.ChangeHelper.ruleAdvantageChange("save", { conditions: [bloodied] })]
            : []),
        ],
      },
    ];
  }

}
