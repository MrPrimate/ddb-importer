import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * School of Transmutation (2014) level 10: Polymorph can be cast once per Short or Long Rest
 * without a spell slot, targeting only yourself and becoming a Beast of CR 1 or lower. DDB only
 * attaches the slot-less copy of the spell, which FEATURE_SPELLS_IGNORE drops in favour of this
 * cast activity. The AU 2024 Transmuter feature is "Shape-Shifter" and has its own enricher.
 */
export default class Shapechanger extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Polymorph",
      addItemConsume: true,
      noSpellslot: true,
      targetType: "self",
      overrideTarget: true,
      activationCondition: "You can target only yourself and transform into a Beast whose Challenge Rating is 1 or lower",
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
        name: "Shapechanger",
        max: "1",
        period: "sr",
      }),
    };
  }

}
