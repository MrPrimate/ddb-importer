import _MonsterFeatureSupport from "./_MonsterFeatureSupport";
import { choiceLabel, parseGrantedResistance, parseResistanceDuration, resistanceChanges } from "./_ResistanceText";

const GRANT_ID = "ddbGrantResist01";

/**
 * Monster features that give other creatures damage resistance or immunity: Liquefaction Ritual,
 * Spell Refuge, Protective Bond, Devotion, Sheltering Shield, Bind, Kiss of the Frozen Heart,
 * Alchemical Vapors, Burning Heart. Routed through GENERIC_FEATURE_NAME and text-gated.
 *
 * The effect is applied to a chosen creature. A resistance the text leaves open ("the triggering
 * damage", "the type determined by Apothecary") gets one effect per option, and the user applies
 * the one that fits from the chat card.
 *
 * Where it goes depends on what else the feature rolls. A save before the grant with no damage is
 * the grant's own gate (Bind: the bound creature has the resistance), so the effect rides the
 * parser's save. A
 * feature that also rolls against someone else (Alchemical Vapors' poison, Protective Bond's
 * damage to the witchwoven) keeps the parser's activities and gains a "Grant Resistance" utility.
 * Otherwise the primary activity becomes that utility.
 */
export default class GrantResistance extends _MonsterFeatureSupport {

  get grant(): ReturnType<typeof parseGrantedResistance> {
    return parseGrantedResistance(this.text);
  }

  /**
   * A save earlier in the text than the grant gates it (Bind); one after it ends the grant (Kiss
   * of the Frozen Heart's save to break the charm), so the grant needs its own activity.
   */
  get ridesSave(): boolean {
    const grant = this.grant;
    if (!grant || this.save() === null || this.damageTokens(this.text).length > 0) return false;
    const saveAt = this.text.search(/saving throw|Saving Throw:/);
    return saveAt >= 0 && saveAt < this.text.indexOf(grant.sentence);
  }

  get keepsParsedActivity(): boolean {
    return this.save() !== null || this.damageTokens(this.text).length > 0;
  }

  override get type(): IDDBActivityType | null {
    if (!this.grant || this.keepsParsedActivity) return null;
    return _MonsterFeatureSupport.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.type) return null;
    return {
      name: "Grant Resistance",
      targetType: "creature",
      noTemplate: true,
      removeDamageParts: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.grant || !this.keepsParsedActivity || this.ridesSave) return [];
    const activity = this.extra("Grant Resistance", GRANT_ID, "utility", {
      targetOverride: { affects: { type: "creature", count: "", choice: true }, template: { type: "" } },
      activationOverride: { type: "special", value: null, condition: `When ${this.key} grants its resistance` },
    });
    // extra() keeps secondary rolls effect-free; this activity exists to carry the effects
    activity.overrides = { ...activity.overrides, noeffect: false };
    return [activity];
  }

  override get effects(): IDDBEffectHint[] {
    const grant = this.grant;
    if (!grant) return [];
    const duration = parseResistanceDuration(this.text);
    const C = _MonsterFeatureSupport.ChangeHelper;
    const options = grant.choice ? grant.types.map((type) => [type]) : [grant.types];
    const open = duration.seconds === null && duration.expiry === null;

    return options.map((types) => ({
      name: grant.choice ? `${this.key}: ${choiceLabel(grant, types[0])}` : this.key,
      activityTypesMatch: [this.ridesSave ? "save" : "utility"],
      changes: resistanceChanges(grant, C, types),
      statuses: grant.statuses,
      options: {
        transfer: false,
        durationSeconds: duration.seconds,
        ...(duration.expiry ? { expiry: duration.expiry } : {}),
        description: open ? `${grant.sentence} Remove this effect when the feature ends.` : grant.sentence,
      },
    }));
  }

  // the parser's own status effects would link to the grant as well
  override get clearAutoEffects(): boolean {
    return this.grant !== null;
  }

}
