import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Necromancer (AU 2024) level 6: Animate Dead is always prepared and can be cast once per Long
 * Rest without a spell slot. The free cast is this activity; DDB's slot-less copy of the spell is
 * dropped by FEATURE_SPELLS_IGNORE while the always-prepared copy stays in the spellbook.
 *
 * The 2014 School of Necromancy feature of the same name only adds the spell to the spellbook
 * and keeps its DDB defaults.
 */
export default class UndeadThralls extends DDBEnricherData {

  /** The 2014 feature is its DDB action activities; the AU cast sits alongside them. */
  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return this.is2024;
  }

  override get type(): IDDBActivityType | null {
    return this.is2024 ? DDBEnricherData.ACTIVITY_TYPES.CAST : null;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      addSpellUuid: "Animate Dead",
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
    if (this.is2014) return {};
    return {
      uses: this._getSpellUsesWithSpent({
        type: "class",
        name: "Undead Thralls",
        max: "1",
        period: "lr",
      }),
    };
  }

}
