import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Environmental harm and staking are separate uses, each with its own trigger and effects. */
export default class VampireWeakness extends _MonsterFeatureSupport {
  get weaknesses(): boolean {
    return (
      (/Running Water\./).test(this.text) && (/Sunlight\./).test(this.text) && this.damageTokens(this.text).length === 2
    );
  }

  override get stopDefaultActivity(): boolean {
    return this.weaknesses;
  }

  override get clearAutoEffects(): boolean {
    return this.weaknesses;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.weaknesses) return [];
    const result = ["Running Water", "Sunlight"].map((name, i) => {
      const section = this.text.split(`${name}.`)[1].split(/(?:Stake to the Heart|Sunlight)\./)[0];
      const activity = this.extra(name, `ddbVampireDmg00${i}`, "damage", {
        generateDamage: true,
        damageParts: this.damageTokens(section).map((p) => p.part),
        targetOverride: { affects: { type: "self", count: "1" } },
        rangeOverride: { units: "self" },
        activationOverride: { type: i === 0 ? "turnEnd" : "turnStart", value: null, condition: section },
      });
      activity.overrides = { noConsumeTargets: true };
      return activity;
    });
    if ((/Stake to the Heart\./).test(this.text)) {
      const stake = this.extra("Stake to the Heart", "ddbVampStake0001", "utility", {
        targetOverride: { affects: { type: "self", count: "1" } },
        rangeOverride: { units: "self" },
        activationOverride: {
          type: "special",
          value: null,
          condition:
            "Only when staked under the conditions in this feature. Remove Paralyzed when the stake is removed.",
        },
      });
      stake.overrides = { noConsumeTargets: true };
      result.push(stake);
    }
    return result;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.weaknesses) return [];
    const C = _MonsterFeatureSupport.ChangeHelper;
    return [
      {
        name: "In Sunlight",
        activityMatch: "Sunlight",
        // checks have core roll modes; attack rolls need midi-qol or automated-conditions-5e
        changes: ["str", "dex", "con", "int", "wis", "cha"].map((ability) => C.disadvantageAbilityCheckChange(ability)),
        midiChanges: [C.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all")],
        ac5eChanges: [C.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage")],
        options: { expiry: null, durationSeconds: null, description: "Remove when no longer in sunlight." },
      },
      {
        name: "Staked",
        activityMatch: "Stake to the Heart",
        statuses: ["Paralyzed"],
        options: { expiry: null, durationSeconds: null, description: "Remove when the stake is removed." },
      },
    ];
  }

  override async cleanup(): Promise<void> {
    if (!this.weaknesses) return;
    const activities = this.document.system.activities as Record<string, IActivityData>;
    for (const [id, activity] of Object.entries(activities)) {
      if (activity.type === "damage" && !activity.name) delete activities[id];
    }
  }
}
