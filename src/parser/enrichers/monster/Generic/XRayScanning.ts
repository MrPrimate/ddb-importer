import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** A bonus action that grants the monster Blindsight for a while. */
export default class XRayScanning extends _MonsterFeatureSupport {

  get range(): string | null {
    return this.text.match(/gains Blindsight to a range of (\d+) feet/i)?.[1] ?? null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.range) return null;
    return {
      targetType: "self",
      noTemplate: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    const range = this.range;
    if (!range) return [];
    return [
      {
        name: this.key,
        options: {
          durationSeconds: this.seconds(this.text) ?? 60,
          description: `Blindsight ${range} ft. that ignores thin barriers; ends early if the monster has the Blinded condition.`,
        },
        changes: [
          _MonsterFeatureSupport.ChangeHelper.upgradeChange(range, 20, "system.attributes.senses.blindsight"),
        ],
      },
    ];
  }

}
