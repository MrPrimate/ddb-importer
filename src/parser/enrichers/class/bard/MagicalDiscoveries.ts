import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * College of Lore level 6: two spells of a level the bard can cast, from the Cleric, Druid or
 * Wizard list, always prepared, each replaceable on a later Bard level, as the SRD's spell choice.
 * On a character import DDB's picks are linked to it (CharacterFeatureFactory.linkSpells).
 */
export default class MagicalDiscoveries extends DDBEnricherData {

  override get additionalAdvancements(): I5eAdvancement[] {
    if (this.is2014) return [];
    const choices: TI5eAdvItemChoiceConfigChoices = { 6: { count: 2, replacement: false } };
    for (let level = 7; level <= 20; level++) choices[level] = { count: null, replacement: true };
    return [
      DDBEnricherData.AdvancementBuilder.buildSpellChoice({
        name: "Magical Discoveries",
        hint: "Learn two spells of your choice from the Cleric, Druid or Wizard spell list, of a level you can cast. They count as Bard spells and are always prepared.",
        choices,
        level: "available",
        lists: ["class:cleric", "class:druid", "class:wizard"],
        spell: {
          ability: ["cha"],
          method: "spell",
          prepared: 2,
        },
      }),
    ];
  }

}
