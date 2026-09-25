import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Paladin (2024) level 5: Find Steed is always prepared and can be cast once per Long Rest without
 * a spell slot. The free cast is this activity; DDB's slot-less copy of the spell is dropped by
 * FEATURE_SPELLS_IGNORE while the always-prepared copy stays in the spellbook.
 */
export default class FaithfulSteed extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Find Steed",
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
    return {
      uses: this._getSpellUsesWithSpent({
        type: "class",
        name: "Faithful Steed",
        max: "1",
        period: "lr",
      }),
    };
  }

}
