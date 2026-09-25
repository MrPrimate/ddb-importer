import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Only the simple on-hit grapple wording is shared safely by otherwise unrelated Claws/Grab attacks. */
export default class GrappleConditions extends _MonsterFeatureSupport {
  get simpleGrapple(): boolean {
    return (
      (/If the target is a (?:Medium|Large|Huge|Small)(?: or smaller)? creature, it has the Grappled condition/i).test(
        this.text,
      ) && !(/saving throw|Poisoned|Stunned|Paralyzed|Prone|Frightened|Blinded/i).test(this.text)
    );
  }

  override get clearAutoEffects(): boolean {
    return this.simpleGrapple;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.simpleGrapple) return [];
    const restrained = (/Restrained condition until the grapple ends/i).test(this.text);
    return [
      {
        name: "Grapple Conditions",
        activityMatch: "Grappling Hit",
        statuses: restrained ? ["Grappled", "Restrained"] : ["Grappled"],
        options: { expiry: null, durationSeconds: null, description: this.text },
      },
    ];
  }

  override async cleanup(): Promise<void> {
    if (!this.simpleGrapple) return;
    const effect = (this.document.effects as { _id: string; name: string }[]).find(
      (e) => e.name === "Grapple Conditions",
    );
    if (!effect) return;
    for (const activity of this.activities) {
      activity.effects = activity.type === "attack" ? [{ _id: effect._id }] : [];
    }
  }
}
