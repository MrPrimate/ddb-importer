import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Alchemist (2024) level 15. Alchemical Eruption (the DDB action) and the resistance/immunity
 * effect keep their defaults; Conjured Cauldron adds Tasha's Bubbling Cauldron as a free cast
 * once per Long Rest without Material components, using Alchemist's Supplies as the focus. DDB
 * only attaches the slot-less copy of the spell, which FEATURE_SPELLS_IGNORE drops.
 */
export default class ChemicalMastery extends DDBEnricherData {

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
          name: "Conjured Cauldron",
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateSpell: true,
          generateConsumption: false,
        },
        overrides: {
          addSpellUuid: "Tasha's Bubbling Cauldron",
          addItemConsume: true,
          noSpellslot: true,
          activationCondition: "You must use Alchemist's Supplies as the Spellcasting Focus",
          data: {
            spell: {
              spellbook: true,
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
        name: "Chemical Mastery",
        max: "1",
        period: "lr",
      }),
    };
  }

}
