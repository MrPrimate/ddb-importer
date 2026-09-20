import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** The death rider belongs to the victim's failed save, never to the wisp's healing roll. */
export default class ConsumeLife extends _MonsterFeatureSupport {
  override get effects(): IDDBEffectHint[] {
    return (/target dies/i).test(this.text) && this.save()
      ? [
        {
          name: "Consumed Life",
          statuses: ["Dead"],
          activityMatch: "Consume Life Save",
          options: { expiry: null, durationSeconds: null },
        },
      ]
      : [];
  }

  override async cleanup(): Promise<void> {
    if (!this.effects.length) return;
    const save = this.activities.find((a) => a.type === "save");
    if (!save) return;
    const effect = (this.document.effects as { _id: string; name: string }[]).find((e) => e.name === "Consumed Life");
    if (effect && !save.effects?.some((link) => link._id === effect._id)) {
      save.effects = [...(save.effects ?? []), { _id: effect._id }];
    }
  }
}
