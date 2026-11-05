import DDBEnricherData from "../../data/DDBEnricherData";
import _MasteredSpells from "./_MasteredSpells";

/**
 * Wizard level 20: two level 3 spells from the spellbook are always prepared and each can be cast
 * once at level 3 without a spell slot, recovering on a Short or Long Rest. Each pick is a cast
 * activity carrying its own once-per-rest use; the spellbook copy still spends a slot for higher
 * levels.
 */
export default class SignatureSpells extends _MasteredSpells {

  override get mark(): { activity: string; effect: string; suffix: string } {
    return { activity: "Make Signature", effect: "Signature", suffix: "Signature" };
  }

  /** One free cast per marked spell, tracked by hand as the cast is made from the spellbook. */
  override get markActivities(): IDDBAdditionalActivity[] {
    return ["First", "Second"].map((which) => ({
      init: {
        name: `Expend ${which} Spell`,
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      },
      build: {
        generateConsumption: false,
        generateTarget: true,
        generateActivation: true,
      },
      overrides: {
        activationType: "special",
        activationCondition: "When you cast this Signature Spell without a spell slot",
        targetType: "self",
        addActivityConsume: true,
        data: {
          uses: {
            spent: 0,
            max: "1",
            recovery: [{ period: "sr", type: "recoverAll" }],
          },
        },
      },
    }));
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
