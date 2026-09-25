import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Alchemist (2024) level 9: Lesser Restoration can be cast without a spell slot or preparation,
 * using Alchemist's Supplies as the focus, a number of times equal to the Intelligence modifier
 * (minimum of once) per Long Rest. DDB only attaches the slot-less copy of the spell, which
 * FEATURE_SPELLS_IGNORE drops in favour of this cast activity.
 */
export default class RestorativeReagents extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Lesser Restoration",
      addItemConsume: true,
      noSpellslot: true,
      activationCondition: "You must use Alchemist's Supplies as the Spellcasting Focus",
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
          name: "Restorative Reagents",
          period: "lr",
        }),
        max: "max(1, @abilities.int.mod)",
      },
    };
  }

}
