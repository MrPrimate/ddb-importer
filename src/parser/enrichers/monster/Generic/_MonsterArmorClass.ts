import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Explicit AC reactions share the source guard, amount and expiry; recipients are feature-specific. */
export default abstract class _MonsterArmorClass extends _MonsterFeatureSupport {
  protected get selfTarget(): boolean {
    return false;
  }

  get benefit(): { changes: IActiveEffectChangeData[]; expiry: T5eEffectExpiry } | null {
    const amount = this.text.match(/adds (\d+) to its AC|gains a \+(\d+) bonus to AC/i);
    if (!amount) return null;
    // A melee-only stance needs attack-context filtering that a flat AC effect cannot express.
    if ((/AC against melee attack rolls/i).test(this.text)) return null;
    const expiry = (/until the start of .+?next turn/i).test(this.text) ? "sourceStart" : "turnEnd";
    return {
      changes: [
        _MonsterFeatureSupport.ChangeHelper.unsignedAddChange(amount[1] ?? amount[2], 20, "system.attributes.ac.bonus"),
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
      data: { description: { value: `<p>${this.text}</p>` } },
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
        },
      ]
      : [];
  }
}
