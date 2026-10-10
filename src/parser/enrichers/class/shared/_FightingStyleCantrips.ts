import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The class Fighting Style options that grant two cantrips instead of a combat style (2024
 * Paladin Blessed Warrior, Ranger Druidic Warrior). Like the PHB, the option is a Fighting Style
 * feat under its own name, and a compendium copy carries a "Choose Cantrips" advancement for two
 * cantrips from the class's list. A character import leaves the advancement off: DDB already adds
 * the chosen cantrips to the spellbook, so an unfilled choice beside them would be noise.
 * The 2014 (Tasha's) printings keep their name change and type but not the advancement.
 */
export default abstract class FightingStyleCantrips extends DDBEnricherData {

  abstract get featName(): string;

  /** The class that takes this option, which the feat requires. */
  abstract get className(): string;

  /** The spell list the cantrips come from, e.g. "class:cleric". */
  abstract get spellList(): string;

  abstract get spellAbility(): string;

  override get additionalAdvancements(): I5eAdvancement[] {
    // the 2014 (Tasha's) options already get a cantrip choice from DDB's own spell choice
    if (!this.ddbParser.isMuncher || this.is2014) return [];
    const listName = this.spellList.replace("class:", "");
    return [
      DDBEnricherData.AdvancementBuilder.buildSpellChoice({
        name: "Choose Cantrips",
        hint: `You learn two ${listName.charAt(0).toUpperCase()}${listName.slice(1)} cantrips of your choice. They count as ${this.className} spells for you.`,
        choices: { 0: { count: 2, replacement: false } },
        level: 0,
        lists: [this.spellList],
        spell: {
          ability: [this.spellAbility],
          method: "spell",
          prepared: 2,
        },
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        name: this.featName,
        system: {
          type: { value: "class", subtype: "fightingStyle" },
          requirements: this.className,
          prerequisites: { level: 2, items: ["fighting-style"] },
        },
      },
    };
  }

}
