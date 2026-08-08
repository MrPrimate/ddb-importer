import _Mutagen from "./_Mutagen";

/** Dexterity and its maximum rise by 3 (4 at 11th level, 5 at 18th); Wisdom saves suffer. */
export default class FormulaCelerity extends _Mutagen {

  get effects(): IDDBEffectHint[] {
    return this.scoreMutagenEffects("dex", _Mutagen.disadvantageSave("wis"));
  }

}
