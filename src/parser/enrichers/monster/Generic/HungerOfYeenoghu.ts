import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Source-guarded activities for Hunger of Yeenoghu. */
export default class HungerOfYeenoghu extends _MonsterFeatureSupport {
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
            condition:
              "After a failed save, grant these temporary HP to the gnoll or its chosen creature that it can see.",
          },
        }),
      );
    return activities;
  }
}
