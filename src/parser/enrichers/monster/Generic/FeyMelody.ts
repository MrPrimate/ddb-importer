import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Both songs use the same save and area; only the frightening song deals damage. */
export default class FeyMelody extends _MonsterFeatureSupport {
  get songs(): boolean {
    return (/Charming\./).test(this.text) && (/Frightening\./).test(this.text) && this.save() !== null;
  }

  override get clearAutoEffects(): boolean {
    return this.songs;
  }

  override get activity(): IDDBActivityData | null {
    return this.songs
      ? { name: "Charming Melody", removeDamageParts: true, data: { damage: { includeBase: false } } }
      : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.songs) return [];
    return [
      {
        duplicate: true,
        id: "ddbFeyFright0001",
        overrides: {
          name: "Frightening Melody",
          removeDamageParts: true,
          damageParts: this.damageTokens(this.text.split("Frightening.")[1]).map((p) => p.part),
          data: { damage: { includeBase: false } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.songs) return [];
    return [
      {
        name: "Charming Song",
        statuses: ["Charmed", "Incapacitated"],
        activityMatch: "Charming Melody",
        daeSpecialDurations: ["isDamaged"],
        options: {
          expiry: null,
          durationSeconds: this.seconds(this.text.split("Charming.")[1]),
          description: "Dance in place as described by the feature. Ends early if the target takes damage.",
        },
      },
      {
        name: "Frightening Song",
        statuses: ["Frightened"],
        activityMatch: "Frightening Melody",
        options: {
          expiry: null,
          durationSeconds: this.seconds(this.text.split("Frightening.")[1]),
          description: "Ends early when the target ends its turn out of line of sight of the source.",
        },
      },
    ];
  }
}
