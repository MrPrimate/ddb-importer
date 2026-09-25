import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Source-guarded activities for Deflect Missile. */
export default class DeflectMissile extends _MonsterFeatureSupport {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    const reduction = this.text.match(
      /reduces the damage it takes from the attack by \d+\s*\((\d+d\d+(?:\s*[+-]\s*\d+)?)\)|damage .{0,60}reduced by (\d+d\d+(?:\s*[+-]\s*\d+)?)/i,
    );
    if (reduction)
      activities.push(
        this.extra("Reduce Damage", "ddbDeflectRoll01", "utility", {
          generateRoll: true,
          rollOverride: {
            formula: reduction[1] ?? reduction[2],
            name: "Damage Reduction",
            visible: true,
            prompt: false,
          },
          activationOverride: {
            type: "special",
            value: null,
            condition:
              "As part of the Deflect Missile reaction, subtract this roll from the triggering damage. Redirect only if the source description permits it.",
          },
        }),
      );
    return activities;
  }

  override async cleanup(): Promise<void> {
    if ((/reduces the damage it takes from the attack by/i).test(this.text)) {
      const reduction = this.activities.find((a) => a._id === "ddbDeflectRoll01");
      const save = this.activities.find((a) => a.type === "save");
      if (reduction && save) {
        reduction.activation = { ...save.activation, type: "reaction", value: 1, condition: this.text };
        reduction.consumption = foundry.utils.deepClone(save.consumption);
        save.activation = {
          type: "special",
          value: null,
          condition: "After Deflect Missile reduces the triggering damage to 0.",
        };
        save.consumption = { targets: [], spellSlot: false };
        const activities = this.document.system.activities as Record<string, IActivityData>;
        for (const [id, activity] of Object.entries(activities)) {
          if (activity.type === "attack" && activity.name === "Versatile") delete activities[id];
        }
      }
    }
  }
}
