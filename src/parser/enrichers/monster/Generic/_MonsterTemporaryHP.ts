import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Temporary-HP activities share source formula parsing and removal of duplicate parser healing. */
export default abstract class _MonsterTemporaryHP extends _MonsterFeatureSupport {
  protected get selfTarget(): boolean {
    return false;
  }

  get healing(): I5eDamagePart | null {
    const m = this.text.match(/gains (\d+)(?:\s*\((\d+d\d+(?:\s*[+-]\s*\d+)?)\))? Temporary Hit Points/i);
    return m ? this.damage(m[2] ?? m[1], "temphp") : null;
  }

  override get type(): IDDBActivityType | null {
    return this.healing ? "heal" : null;
  }

  override get activity(): IDDBActivityData | null {
    const healing = this.healing;
    if (!healing) return null;
    return {
      name: "Temporary Hit Points",
      ...(this.selfTarget ? { targetSelf: true, noTemplate: true } : {}),
      data: { healing },
    };
  }

  override async cleanup(): Promise<void> {
    if (!this.healing) return;
    // The monster parser also queues healing from prose independently of the primary type hint.
    const activities = this.document.system.activities as Record<string, IActivityData>;
    for (const [id, activity] of Object.entries(activities)) {
      if (activity.type === "heal" && activity.name === "Heal") delete activities[id];
    }
  }
}
