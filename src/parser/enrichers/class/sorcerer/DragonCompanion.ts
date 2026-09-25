import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Draconic Sorcery (2024) level 18: Summon Dragon can be cast without a Material component, and
 * once per Long Rest without a spell slot. The free cast is this activity; DDB only attaches the
 * slot-less copy of the spell, which FEATURE_SPELLS_IGNORE drops. The optional no-Concentration,
 * 1 minute casting is left to the player.
 */
export default class DragonCompanion extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Summon Dragon",
      addItemConsume: true,
      noSpellslot: true,
      data: {
        spell: {
          spellbook: true,
          properties: ["material"],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getSpellUsesWithSpent({
        type: "class",
        name: "Dragon Companion",
        max: "1",
        period: "lr",
      }),
      descriptionSuffix: "<p>When you cast the spell you can modify it so it doesn't require Concentration; its duration then becomes 1 minute.</p>",
    };
  }

}
