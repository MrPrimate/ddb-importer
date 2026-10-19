import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Explicit AC reactions share the source guard, amount and expiry; recipients are feature-specific. */
export default abstract class _MonsterArmorClass extends _MonsterFeatureSupport {
  protected get selfTarget(): boolean {
    return false;
  }

  /** The expiry when the text names no duration. */
  protected get defaultExpiry(): T5eEffectExpiry {
    return "turnEnd";
  }

  /** DAE special durations that end the benefit early. */
  protected get daeSpecialDurations(): TDAEOnlySpecialDuration[] | undefined {
    return undefined;
  }

  get benefit(): { changes: IActiveEffectChangeData[]; expiry: T5eEffectExpiry } | null {
    // "adds 2 to its AC", "add 2 to their AC", "adds 2 to his Armor Class", "increases his AC by 6"
    const amount = this.text.match(
      /adds? (\d+) to (?:its|his|her|their) (?:AC|armor class)|increases (?:its|his|her|their) (?:AC|armor class) by (\d+)|gains a \+(\d+) bonus to AC/i,
    );
    if (!amount) return null;
    // A melee-only stance needs attack-context filtering that a flat AC effect cannot express.
    if ((/AC against melee attack rolls/i).test(this.text)) return null;
    const expiry = (/until the start of .+?next turn/i).test(this.text) ? "sourceStart" : this.defaultExpiry;
    return {
      changes: [
        _MonsterFeatureSupport.ChangeHelper.unsignedAddChange(amount[1] ?? amount[2] ?? amount[3], 20, "system.attributes.ac.bonus"),
      ],
      expiry,
    };
  }

  override get type(): IDDBActivityType | null {
    return this.benefit ? "utility" : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.benefit) return null;
    return {
      name: this.key,
      ...(this.selfTarget ? { targetSelf: true, noTemplate: true } : {}),
    };
  }

  override get effects(): IDDBEffectHint[] {
    const benefit = this.benefit;
    return benefit
      ? [
        {
          name: `${this.key}: Benefit`,
          changes: benefit.changes,
          activityMatch: this.key,
          options: { expiry: benefit.expiry, description: this.text },
          ...(this.daeSpecialDurations ? { daeSpecialDurations: this.daeSpecialDurations } : {}),
        },
      ]
      : [];
  }
}
