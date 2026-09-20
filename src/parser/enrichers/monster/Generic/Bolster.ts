import _MonsterTemporaryHP from "./_MonsterTemporaryHP";

export default class Bolster extends _MonsterTemporaryHP {
  protected override get selfTarget(): boolean {
    return true;
  }

  get buffsAllies(): boolean {
    return this.healing !== null && (/Advantage on (?:d20 test;)?D20 Tests until the end/i).test(this.text);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.buffsAllies) return [];
    const radius = this.text.match(/each ally within (\d+) feet/i)?.[1];
    if (!radius) return [];
    const buff = this.extra("Bolster Allies", "ddbBolsterBuff01", "utility", {
      activationOverride: {
        type: "special",
        value: null,
        condition: "Apply to the monster and eligible allies when Bolster is used.",
      },
      targetOverride: {
        affects: { type: "ally", count: "", choice: false },
        template: { type: "radius", size: radius, units: "ft" },
      },
      rangeOverride: { units: "self" },
    });
    buff.overrides = { noConsumeTargets: true };
    return [buff];
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.buffsAllies) return [];
    const C = _MonsterTemporaryHP.ChangeHelper;
    const abilities = ["str", "dex", "con", "int", "wis", "cha"];
    return [
      {
        name: "Bolster: Benefit",
        // saves and checks have core roll modes; attack rolls need midi-qol or automated-conditions-5e
        changes: [
          ...abilities.map((ability) => C.advantageAbilitySaveChange(ability)),
          ...abilities.map((ability) => C.advantageAbilityCheckChange(ability)),
        ],
        midiChanges: [C.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all")],
        ac5eChanges: [C.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.advantage")],
        activityMatch: "Bolster Allies",
        options: { durationSeconds: 6, durationRounds: 1, expiry: "sourceEnd", description: this.text },
      },
    ];
  }
}
