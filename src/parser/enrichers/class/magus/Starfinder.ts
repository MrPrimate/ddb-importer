import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Sidereal Cabal level 20. Selenite Spell Surge spends the Spell Surge use on First Speech or True
 * Seeing; Weave Destiny (three uses of Seal Fate) lives on the Seal Fate enricher.
 */
export default class Starfinder extends DDBEnricherData {

  static SURGE_SPELLS = ["First Speech", "True Seeing"];

  static surgeCast(spell: string): IDDBActivityData {
    return {
      addSpellUuid: spell,
      addItemConsume: true,
      itemConsumeTargetName: "Spell Surge",
      noSpellslot: true,
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
      name: `Spell Surge: ${Starfinder.SURGE_SPELLS[0]}`,
      ...Starfinder.surgeCast(Starfinder.SURGE_SPELLS[0]),
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return Starfinder.SURGE_SPELLS.slice(1).map((spell) => ({
      init: {
        name: `Spell Surge: ${spell}`,
        type: DDBEnricherData.ACTIVITY_TYPES.CAST,
      },
      build: {
        generateSpell: true,
        generateConsumption: false,
      },
      overrides: Starfinder.surgeCast(spell),
    }));
  }

}
