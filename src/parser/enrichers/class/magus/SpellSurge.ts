import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Magus level 18. Once per Long Rest the chosen level 6 surge spell is cast without a slot, and
 * one spell slot of level 5 or lower comes back (its level picked as the scaling). DDB attaches the
 * chosen spell as a slot-less innate copy with its own use, which FEATURE_SPELLS_IGNORE drops so
 * the cast lives here, on one pool with the Spell Surge options of the level 20 capstones.
 */
export default class SpellSurge extends DDBEnricherData {

  /** The surge spell picked in the DDB builder, when there is one. */
  get surgeSpell(): string | null {
    const spells = this._getSpellsForFeature({ type: "class", name: "Spell Surge" });
    return spells[0]?.definition?.name ?? null;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    const spell = this.surgeSpell;
    return {
      name: spell ? "Regain Spell Slot" : "Surge",
      activationType: "special",
      activationCondition: spell
        ? "After casting your surge spell; pick a slot level of 5 or lower as the scaling"
        : "Cast your surge spell without expending a spell slot, then regain a spell slot of level 5 or lower",
      targetType: "self",
      rangeSelf: true,
      // the cast spends the use when there is one; otherwise this activity does
      addItemConsume: !spell,
      addSpellSlotConsume: true,
      spellSlotConsumeTarget: "1",
      spellSlotConsumeValue: "-1",
      addSpellSlotScalingMode: "level",
      addConsumptionScalingMax: "5",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const spell = this.surgeSpell;
    if (!spell) return [];
    return [
      {
        init: {
          name: `Surge: ${spell}`,
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateSpell: true,
          generateConsumption: false,
        },
        overrides: {
          addSpellUuid: spell,
          addItemConsume: true,
          noSpellslot: true,
          data: {
            spell: {
              spellbook: true,
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getSpellUsesWithSpent({
        type: "class",
        name: "Spell Surge",
        max: "1",
        period: "lr",
      }),
    };
  }

}
