import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Circle of the Stars level 3 (TCoE level 2): while holding the map Guidance and Guiding Bolt are
 * prepared, and Guiding Bolt can be cast without a spell slot a number of times per Long Rest:
 * the Wisdom modifier (minimum of once) in 2024, the Proficiency Bonus in 2014. The free Guiding
 * Bolt is the main activity and Guidance an at-will cast; FEATURE_SPELLS_IGNORE drops DDB's
 * slot-less copies while the 2024 always-prepared Guiding Bolt stays in the spellbook.
 */
export default class StarMap extends DDBEnricherData {

  /** DDB's own action activities stay alongside the cast (Generic's default behaviour). */
  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Guiding Bolt",
      addSpellUuid: "Guiding Bolt",
      addItemConsume: true,
      noSpellslot: true,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Guidance",
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateSpell: true,
          generateConsumption: false,
        },
        overrides: {
          addSpellUuid: "Guidance",
          noSpellslot: true,
          noConsumeTargets: true,
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
          name: "Star Map",
          period: "lr",
        }),
        max: this.is2014 ? "@prof" : "max(1, @abilities.wis.mod)",
      },
    };
  }

}
