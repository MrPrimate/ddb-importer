import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Cartographer (2024) level 3. Portal Jump (the DDB action) keeps its default; Illuminated
 * Cartography adds Faerie Fire as a free cast a number of times equal to the Intelligence modifier
 * (minimum of once) per Long Rest. DDB only attaches the slot-less copy of the spell, which
 * FEATURE_SPELLS_IGNORE drops.
 */
export default class MappingMagic extends DDBEnricherData {

  /** DDB's own action activities stay alongside the cast (Generic's default behaviour). */
  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Illuminated Cartography",
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateSpell: true,
          generateConsumption: false,
        },
        overrides: {
          addSpellUuid: "Faerie Fire",
          addItemConsume: true,
          noSpellslot: true,
          data: {
            spell: {
              spellbook: true,
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        ...this._getSpellUsesWithSpent({
          type: "class",
          name: "Mapping Magic",
          period: "lr",
        }),
        max: "max(1, @abilities.int.mod)",
      },
    };
  }

}
