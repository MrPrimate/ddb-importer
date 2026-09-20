import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

export default class FearOfFire extends _MonsterFeatureSupport {
  get applies(): boolean {
    return (/Disadvantage on attack rolls and ability checks until the end of its next turn/i).test(this.text);
  }

  override get type(): IDDBActivityType | null {
    return this.applies ? "utility" : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.applies) return null;
    return {
      name: "Fear of Fire",
      targetSelf: true,
      noTemplate: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.applies) return [];
    const C = _MonsterFeatureSupport.ChangeHelper;

    return [
      {
        name: "Fear of Fire: Benefit",
        // checks have core roll modes; attack rolls need midi-qol or automated-conditions-5e
        changes: ["str", "dex", "con", "int", "wis", "cha"].map((ability) => C.disadvantageAbilityCheckChange(ability)),
        midiChanges: [C.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all")],
        ac5eChanges: [C.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage")],
        activityMatch: "Fear of Fire",
        options: { durationSeconds: 6, durationRounds: 1, expiry: "sourceEnd", description: this.text },
      },
    ];
  }
}
