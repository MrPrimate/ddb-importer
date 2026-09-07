import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Warlock (2024) level 9: Contact Other Plane is always prepared and can be cast once per Long
 * Rest without a spell slot to reach the patron, automatically succeeding on the spell's save.
 * The free cast is this activity; DDB's slot-less copy of the spell is dropped by
 * FEATURE_SPELLS_IGNORE while the always-prepared copy stays in the spellbook.
 */
export default class ContactPatron extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Contact Other Plane",
      addItemConsume: true,
      noSpellslot: true,
      activationCondition: "You automatically succeed on the spell's saving throw when contacting your patron",
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
        name: "Contact Patron",
        max: "1",
        period: "lr",
      }),
    };
  }

}
