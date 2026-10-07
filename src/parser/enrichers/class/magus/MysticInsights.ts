import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Arcane Order level 3. Eldritch Eye casts Detect Magic or Identify as a Bonus Action, Intelligence
 * modifier (minimum once) times per Long Rest. DDB's slot-less copies of the two spells are dropped
 * by FEATURE_SPELLS_IGNORE in favour of these casts.
 */
export default class MysticInsights extends DDBEnricherData {

  static SPELLS = ["Detect Magic", "Identify"];

  static eldritchEyeCast(spell: string): IDDBActivityData {
    return {
      addSpellUuid: spell,
      addItemConsume: true,
      noSpellslot: true,
      activationType: "bonus",
      overrideActivation: true,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      name: `Eldritch Eye: ${MysticInsights.SPELLS[0]}`,
      ...MysticInsights.eldritchEyeCast(MysticInsights.SPELLS[0]),
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return MysticInsights.SPELLS.slice(1).map((spell) => ({
      init: {
        name: `Eldritch Eye: ${spell}`,
        type: DDBEnricherData.ACTIVITY_TYPES.CAST,
      },
      build: {
        generateSpell: true,
        generateConsumption: false,
      },
      overrides: MysticInsights.eldritchEyeCast(spell),
    }));
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Mystic Insights: Eldritch Eye",
        max: "max(1, @abilities.int.mod)",
        period: "lr",
      }),
    };
  }

}
