import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Draconic Sorcery (2024) level 18: Summon Dragon can be cast without a Material component, and
 * once per Long Rest without a spell slot. The free cast is this activity; DDB only attaches the
 * slot-less copy of the spell, which FEATURE_SPELLS_IGNORE drops. The no-Concentration,
 * 1 minute casting is a second free cast, as in the PHB.
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Summon Dragon (No Concentration)",
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateSpell: true,
          generateConsumption: false,
        },
        overrides: {
          addSpellUuid: "Summon Dragon",
          addItemConsume: true,
          noSpellslot: true,
          data: {
            duration: {
              value: "1",
              units: "minute",
              concentration: false,
              override: true,
            },
            spell: {
              spellbook: false,
              properties: ["material"],
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getSpellUsesWithSpent({
        type: "class",
        name: "Dragon Companion",
        max: "1",
        period: "lr",
      }),
    };
  }

}
