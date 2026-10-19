import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/**
 * "While Bloodied, the boar has Advantage on attack rolls" and the Bloodied Frenzy variant that
 * adds saving throws. dnd5e 5.x has no rule changes to read the roller's Bloodied status, so the
 * always-on effect gates the advantage with AC5e conditions on the roller's own status.
 */
export default class BloodiedFury extends _MonsterFeatureSupport {

  override get effects(): IDDBEffectHint[] {
    const text = this.text.toLowerCase();
    if (!text.includes("advantage")) return [];
    const bloodied = "rollingActor.statuses.bloodied";
    const melee = (/melee attack rolls/).test(text);
    return [
      {
        name: this.key,
        options: {
          transfer: true,
          durationSeconds: null,
          expiry: null,
          description: "Advantage while Bloodied. Needs automated-conditions-5e and dnd5e's Bloodied status on the monster.",
        },
        ac5eChanges: [
          _MonsterFeatureSupport.ChangeHelper.ac5eChange(
            melee ? `${bloodied} && (mwak || msak)` : bloodied,
            20,
            "flags.automated-conditions-5e.attack.advantage",
          ),
          ...((/saving throws/).test(text)
            ? [_MonsterFeatureSupport.ChangeHelper.ac5eChange(bloodied, 20, "flags.automated-conditions-5e.save.advantage")]
            : []),
        ],
      },
    ];
  }

}
