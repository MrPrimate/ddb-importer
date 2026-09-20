import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Source-guarded activities for Sharpened Beak. */
export default class SharpenedBeak extends _MonsterFeatureSupport {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    if ((/a creature within 5 feet of the target/i).test(this.text)) {
      const parts = this.damageTokens(this.text);
      if (parts.length === 2)
        activities.push(
          this.extra("Nearby Creature Damage", "ddbNearbyDmg0001", "damage", {
            generateDamage: true,
            damageParts: [parts[1].part],
            activationOverride: {
              type: "special",
              value: null,
              condition: "On a hit, choose a creature within 5 feet of the attack's target.",
            },
          }),
        );
    }
    return activities;
  }

  override async cleanup(): Promise<void> {
    if (this.additionalActivities.length) {
      const attack = this.activities.find((a) => a.type === "attack");
      if (attack)
        attack.damage = { ...attack.damage, includeBase: false, parts: [this.damageTokens(this.text)[0].part] };
    }
  }
}
