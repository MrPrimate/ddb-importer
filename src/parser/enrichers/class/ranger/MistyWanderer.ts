import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Fey Wanderer (2024) level 15: Misty Step can be cast without a spell slot a number of times equal
 * to the Wisdom modifier (minimum of once) per Long Rest, bringing along one willing creature
 * within 5 feet. DDB only attaches the slot-less copy of the spell, which FEATURE_SPELLS_IGNORE
 * drops in favour of this cast activity.
 */
export default class MistyWanderer extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Misty Step",
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
      uses: {
        ...this._getSpellUsesWithSpent({
          type: "class",
          name: "Misty Wanderer",
          period: "lr",
        }),
        max: "max(1, @abilities.wis.mod)",
      },
    };
  }

}
