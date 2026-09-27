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
        activityTypesMatch: ["attack"],
        statuses: restrained ? ["Grappled", "Restrained"] : ["Grappled"],
        options: { expiry: null, durationSeconds: null, description: this.text },
      },
    ];
  }
}
