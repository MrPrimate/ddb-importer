import _MasteredSpells, { type IMasteredSpell } from "./_MasteredSpells";

/**
 * Wizard level 20: two level 3 spells from the spellbook are always prepared and each can be cast
 * once at level 3 without a spell slot, recovering on a Short or Long Rest. Each pick is a cast
 * activity carrying its own once-per-rest use; the spellbook copy still spends a slot for higher
 * levels.
 */
export default class SignatureSpells extends _MasteredSpells {

  override get featureName(): string {
    return "Signature Spells";
  }

  /** DDB leaves `isSignatureSpell` null on the pick and marks it with the at-will level instead. */
  override isMarked(spell: IDDBSpellEntry): boolean {
    return spell.isSignatureSpell === true || spell.atWillLimitedUseLevel !== null;
  }

  override castHint(spell: IMasteredSpell): IDDBActivityData {
    const hint = super.castHint(spell);
    hint.addActivityConsume = true;
    hint.data = {
      ...hint.data,
      uses: {
        spent: spell.spent,
        max: "1",
        recovery: [{ period: "sr", type: "recoverAll" }],
      },
    };
    return hint;
  }

}
