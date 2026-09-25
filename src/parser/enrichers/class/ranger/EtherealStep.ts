import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Horizon Walker (XGtE) level 7: as a Bonus Action, cast Etherealness without a spell slot, the
 * spell ending at the end of the current turn, once per Short or Long Rest. DDB only attaches the
 * slot-less copy of the spell, which FEATURE_SPELLS_IGNORE drops in favour of this cast activity.
 */
export default class EtherealStep extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Etherealness",
      addItemConsume: true,
      noSpellslot: true,
      activationType: "bonus",
      overrideActivation: true,
      data: {
        spell: {
          spellbook: true,
        },
        duration: {
          value: "1",
          units: "turn",
          override: true,
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getSpellUsesWithSpent({
        type: "class",
        name: "Ethereal Step",
        max: "1",
        period: "sr",
      }),
    };
  }

}
