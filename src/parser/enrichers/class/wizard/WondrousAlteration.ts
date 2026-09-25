import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Transmuter (AU 2024) level 3: Alter Self is always prepared and can be cast once per Long Rest
 * without a spell slot. The free cast is this activity; DDB's slot-less copy of the spell is
 * dropped by FEATURE_SPELLS_IGNORE while the always-prepared copy stays in the spellbook. The
 * per-option riders (Aquatic Adaptation, Change Appearance, Natural Weapons) are DDB choice
 * children and keep their own effects.
 */
export default class WondrousAlteration extends DDBEnricherData {

  /** DDB's own action activities stay alongside the cast (Generic's default behaviour). */
  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Alter Self",
      addItemConsume: true,
      noSpellslot: true,
      // the enricher lands on the chosen option child, whose own action (Dash) is a bonus action
      activationType: "action",
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
        name: "Wondrous Alteration",
        max: "1",
        period: "lr",
      }),
    };
  }

}
