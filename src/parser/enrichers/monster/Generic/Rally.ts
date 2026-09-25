import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

export default class Rally extends _MonsterFeatureSupport {
  get applies(): boolean {
    return (/Advantage on attack rolls and saving throws/i).test(this.text) && (/until the start of/i).test(this.text);
  }

  override get type(): IDDBActivityType | null {
    return this.applies ? "utility" : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.applies) return null;
    return { name: "Rally" };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.applies) return [];
    const C = _MonsterFeatureSupport.ChangeHelper;

    return [
      {
        name: "Rally: Benefit",
        // saves have core roll modes; attack rolls need midi-qol or automated-conditions-5e
        changes: ["str", "dex", "con", "int", "wis", "cha"].map((ability) => C.advantageAbilitySaveChange(ability)),
        midiChanges: [C.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all")],
        ac5eChanges: [C.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.advantage")],
        activityMatch: "Rally",
        options: { durationSeconds: 6, durationRounds: 1, expiry: "sourceStart", description: this.text },
      },
    ];
  }
}
