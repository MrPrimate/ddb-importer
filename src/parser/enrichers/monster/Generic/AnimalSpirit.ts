import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Source-guarded activities for Animal Spirit. */
export default class AnimalSpirit extends _MonsterFeatureSupport {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    const hp = this.text.match(/gains (\d+) Temporary Hit Points/i);
    if (hp)
      activities.push(
        this.extra("Temporary Hit Points", "ddbSecondaryHP01", "heal", {
          generateHealing: true,
          healingPart: this.damage(hp[1], "temphp"),
          activationOverride: {
            type: "special",
            value: null,
            condition: "Forager only, after Animal Spirit: grant these temporary HP to the animal lord.",
          },
          targetOverride: { affects: { type: "self", count: "1" } },
          rangeOverride: { units: "self" },
        }),
      );
    return activities;
  }
}
