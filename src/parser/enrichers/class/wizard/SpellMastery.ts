import _MasteredSpells from "./_MasteredSpells";

/**
 * Wizard level 18: a level 1 and a level 2 spell from the spellbook are always prepared and can
 * be cast at their lowest level without a spell slot. Each pick is an at-will cast activity at
 * that level; the spellbook copy still spends a slot for higher levels.
 */
export default class SpellMastery extends _MasteredSpells {

  override get featureName(): string {
    return "Spell Mastery";
  }

  override isMarked(spell: IDDBSpellEntry): boolean {
    return spell.baseLevelAtWill === true;
  }

}
