import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Cartographer (2024) level 15: Unerring Path lets a map holder cast Find the Path without a spell
 * slot, preparation or components once per Long Rest. Safe Haven is bookkeeping. DDB only attaches
 * the slot-less copy of the spell, which FEATURE_SPELLS_IGNORE drops in favour of this cast
 * activity.
 */
export default class SuperiorAtlas extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Unerring Path",
      addSpellUuid: "Find the Path",
      addItemConsume: true,
      noSpellslot: true,
      activationCondition: "You must be one of the map holders for your Adventurer's Atlas",
      data: {
        spell: {
          spellbook: true,
          properties: ["vocal", "somatic", "material"],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getSpellUsesWithSpent({
        type: "class",
        name: "Superior Atlas",
        max: "1",
        period: "lr",
      }),
    };
  }

}
