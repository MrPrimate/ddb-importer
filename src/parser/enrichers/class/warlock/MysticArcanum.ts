import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Warlock levels 11/13/15/17: one chosen level 6-9 spell that can be cast once per Long Rest
 * without a spell slot. DDB attaches the chosen spell to the feature as a slot-less limited-use
 * spell entry; that copy is dropped by FEATURE_SPELLS_IGNORE and the feature carries a cast
 * activity for it instead, spending the feature's own use. The 2014 "(6th level)" and 2024
 * "(Level 6 Spell)" features share this enricher via DDBClassFeatureEnricher's name hints. A
 * compendium feature import has no chosen spell, so it keeps only the once per Long Rest use.
 */
export default class MysticArcanum extends DDBEnricherData {

  /** DDB's slot-less limited-use copy of the chosen arcanum spell, when the payload carries one. */
  get arcanumSpell(): any | undefined {
    return this._getSpellsForFeature({ type: "class", name: this.ddbParser.originalName })[0];
  }

  get arcanumSpellName(): string | undefined {
    return this.arcanumSpell?.definition?.name;
  }

  override get type(): IDDBActivityType | null {
    return this.arcanumSpellName
      ? DDBEnricherData.ACTIVITY_TYPES.CAST
      : null;
  }

  override get activity(): IDDBActivityData | null {
    const spellName = this.arcanumSpellName;
    if (!spellName) return null;
    return {
      name: spellName,
      addSpellUuid: spellName,
      addItemConsume: true,
      noSpellslot: true,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    const uses: I5eSystemLimitedUses = this.arcanumSpell
      ? this._getSpellUsesWithSpent({
        type: "class",
        name: this.ddbParser.originalName,
        max: "1",
        period: "lr",
      })
      : {
        spent: null,
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll", formula: undefined }],
      };
    return { uses };
  }

}
