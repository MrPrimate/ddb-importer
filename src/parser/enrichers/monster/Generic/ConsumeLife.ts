import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** The death rider belongs to the victim's failed save, never to the wisp's healing roll. */
export default class ConsumeLife extends _MonsterFeatureSupport {
  override get effects(): IDDBEffectHint[] {
    return (/target dies/i).test(this.text) && this.save()
      ? [
        {
          name: "Consumed Life",
          statuses: ["Dead"],
          activityTypesMatch: ["save"],
          options: { expiry: null, durationSeconds: null },
        },
      ]
      : [];
  }
}
