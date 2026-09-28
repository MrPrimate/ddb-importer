import _MonsterFeatureSupport from "./_MonsterFeatureSupport";
import { parseAllSelfResistances, parseConditionImmunities, resistanceChanges } from "./_ResistanceText";

/**
 * Monster traits whose resistances hold only in one form or state: "Ghostly Body (Ghostwalk Form
 * Only)", "Made of Shadows (Shadow Form Only)", "While inside of the sphere, the salmon has
 * Resistance to Fire damage", "While Bloodied, Rudolph has Resistance ...". Nothing native can
 * watch for the form or state, so, as with Living Shadow, the trait becomes a special-activation
 * toggle whose effect is applied when the monster enters the state and removed by hand when it
 * leaves. Routed through GENERIC_FEATURE_NAME and text-gated.
 */
export default class FormResistance extends _MonsterFeatureSupport {

  get grants(): ReturnType<typeof parseAllSelfResistances> {
    return parseAllSelfResistances(this.text);
  }

  /** "(Ghostwalk Form Only)" in the name, else the text's "While ..." clause. */
  get form(): string | null {
    return this.name.match(/\(([^)]+?) Only\)/i)?.[1] ?? null;
  }

  get state(): string {
    const form = this.form;
    if (form) return `in ${form}`;
    const clause = this.text.match(/\bWhile ([^,]+),/i)?.[1];
    return clause ?? `${this.key} applies`;
  }

  override get type(): IDDBActivityType | null {
    return this.grants.length > 0 ? _MonsterFeatureSupport.ACTIVITY_TYPES.UTILITY : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.type) return null;
    const form = this.form;
    return {
      name: form ? `Enter ${form}` : `Apply ${this.key}`,
      activationType: "special",
      noConsumeTargets: true,
      targetSelf: true,
      noTemplate: true,
      activationCondition: `Apply while ${this.state}. Remove the effect when that ends.`,
    };
  }

  override get effects(): IDDBEffectHint[] {
    const grants = this.grants;
    if (grants.length === 0) return [];
    const C = _MonsterFeatureSupport.ChangeHelper;
    return [
      {
        name: this.key,
        activityMatch: this.activity?.name,
        changes: [
          ...grants.flatMap((grant) => resistanceChanges(grant, C)),
          ...parseConditionImmunities(this.text).map((condition) => C.conditionImmunityChange(condition)),
        ],
        options: {
          transfer: false,
          expiry: null,
          durationSeconds: null,
          description: `Active only while ${this.state}. Apply and remove manually.`,
        },
      },
    ];
  }

}
