import _Mutagen from "./_Mutagen";

/** Advantage on Wisdom checks, disadvantage on Charisma checks. */
export default class FormulaPercipient extends _Mutagen {

  get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        changes: [
          _Mutagen.advantageCheck("wis"),
          _Mutagen.disadvantageCheck("cha"),
        ],
      }),
    ];
  }

}
