import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Sylvan Circle level 7. Polymorph is always prepared (FEATURE_SPELLS_FORCE_PREPARED keeps a
 * slot-spending copy) and once per Short or Long Rest is cast on the magus without a slot, needing
 * no Concentration and lasting 8 hours.
 */
export default class NaturesMask extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Polymorph Self",
      addSpellUuid: "Polymorph",
      addItemConsume: true,
      noSpellslot: true,
      targetType: "self",
      overrideTarget: true,
      data: {
        spell: {
          spellbook: true,
          properties: ["concentration"],
        },
        duration: {
          value: "8",
          units: "hour",
          override: true,
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getSpellUsesWithSpent({
        type: "class",
        name: "Nature's Mask",
        max: "1",
        period: "sr",
      }),
    };
  }

}
