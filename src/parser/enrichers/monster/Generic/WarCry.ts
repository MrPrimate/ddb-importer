import _MonsterTemporaryHP from "./_MonsterTemporaryHP";

export default class WarCry extends _MonsterTemporaryHP {
  override get effects(): IDDBEffectHint[] {
    if (!this.healing || !(/Advantage on attack rolls until the start of/i).test(this.text)) return [];
    return [
      {
        name: "War Cry: Benefit",
        // core dnd5e has no attack roll mode to set
        midiChanges: [_MonsterTemporaryHP.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all")],
        ac5eChanges: [_MonsterTemporaryHP.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.advantage")],
        activityMatch: "Temporary Hit Points",
        options: { durationSeconds: 6, durationRounds: 1, expiry: "sourceStart", description: this.text },
      },
    ];
  }
}
