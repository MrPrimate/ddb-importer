import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Path of the Ancestral Guardian (XGtE) level 10: cast Augury or Clairvoyance without a spell slot
 * or material components, using Wisdom, once per Short or Long Rest shared between the two. Both
 * casts draw on the feature's single use; DDB only attaches slot-less copies of the spells, which
 * FEATURE_SPELLS_IGNORE drops in favour of these cast activities.
 */
export default class ConsultTheSpirits extends DDBEnricherData {

  static SPELLS = ["Augury", "Clairvoyance"];

  castHint(spellName: string): IDDBActivityData {
    return {
      name: spellName,
      addSpellUuid: spellName,
      addItemConsume: true,
      noSpellslot: true,
      data: {
        spell: {
          spellbook: true,
          ability: "wis",
          properties: ["material"],
        },
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return this.castHint(ConsultTheSpirits.SPELLS[0]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return ConsultTheSpirits.SPELLS.slice(1).map((spellName) => ({
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
      uses: this._getSpellUsesWithSpent({
        type: "class",
        name: "Consult the Spirits",
        max: "1",
        period: "sr",
      }),
    };
  }

}
