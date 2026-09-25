import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Illusionist (2024) level 6: Summon Beast and Summon Fey are always prepared and each can be
 * cast once per Long Rest without a spell slot (as an Illusion spell with halved creature Hit
 * Points). Each spell has its own once-per-rest, so the uses sit on the activity rather than the
 * feature. DDB's slot-less copies of the spells are dropped by FEATURE_SPELLS_IGNORE while the
 * always-prepared copies stay in the spellbook.
 */
export default class PhantasmalCreatures extends DDBEnricherData {

  static SPELLS = ["Summon Beast", "Summon Fey"];

  /** Once per Long Rest, with the spent count DDB tracks on the feature's copy of the spell. */
  spellUses(spellName: string): I5eSystemLimitedUses {
    const spell = this._getSpellsForFeature({ type: "class", name: "Phantasmal Creatures" })
      .find((s) => s.definition?.name === spellName);
    return {
      spent: spell?.limitedUse?.numberUsed ?? 0,
      max: "1",
      recovery: [{ period: "lr", type: "recoverAll" }],
    };
  }

  castHint(spellName: string): IDDBActivityData {
    return {
      name: spellName,
      addSpellUuid: spellName,
      addActivityConsume: true,
      noSpellslot: true,
      data: {
        spell: {
          spellbook: true,
        },
        uses: this.spellUses(spellName),
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return this.castHint(PhantasmalCreatures.SPELLS[0]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return PhantasmalCreatures.SPELLS.slice(1).map((spellName) => ({
      init: {
        name: spellName,
        type: DDBEnricherData.ACTIVITY_TYPES.CAST,
      },
      build: {
        generateSpell: true,
        generateConsumption: false,
      },
      overrides: this.castHint(spellName),
    }));
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: "<p>Each cast activity carries its own once per Long Rest use; a creature summoned this way has half its Hit Points.</p>",
    };
  }

}
