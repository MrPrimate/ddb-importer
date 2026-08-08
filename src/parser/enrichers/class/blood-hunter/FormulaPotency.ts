import _Mutagen from "./_Mutagen";

/** Strength and its maximum rise by 3 (4 at 11th level, 5 at 18th); Dexterity saves suffer. */
export default class FormulaPotency extends _Mutagen {

  get effects(): IDDBEffectHint[] {
    return this.scoreMutagenEffects("str", _Mutagen.disadvantageSave("dex"));
  }

}
