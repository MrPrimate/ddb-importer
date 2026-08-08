import _Mutagen from "./_Mutagen";

/**
 * An extra weapon attack as a bonus action, at the cost of mental saving throws.
 *
 * Only the side effect is automated; the extra attack is made with whatever weapon the blood
 * hunter is holding, so there is no activity to generate here.
 */
export default class FormulaCruelty extends _Mutagen {

  get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        changes: [
          _Mutagen.disadvantageSave("int"),
          _Mutagen.disadvantageSave("wis"),
          _Mutagen.disadvantageSave("cha"),
        ],
      }),
    ];
  }

}
