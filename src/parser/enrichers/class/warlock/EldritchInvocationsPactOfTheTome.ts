import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Pact of the Tome (2024): the Book of Shadows holds three cantrips and two level 1 rituals from
 * any list, picked through two spell choices as the SRD invocation does. On a character import
 * DDB's picks are linked to them (CharacterFeatureFactory.linkSpells). The 2014 Pact Boon picks
 * its cantrips through DDB's own spell choice, so it gets none.
 */
export default class EldritchInvocationsPactOfTheTome extends DDBEnricherData {

  override get additionalAdvancements(): I5eAdvancement[] {
    if (this.is2014) return [];
    return [
      DDBEnricherData.AdvancementBuilder.buildSpellChoice({
        name: "Book of Shadows Cantrips",
        choices: { 0: { count: 3, replacement: false } },
        level: 0,
        spell: {
          ability: ["cha"],
          method: "pact",
          prepared: 2,
        },
      }),
      DDBEnricherData.AdvancementBuilder.buildSpellChoice({
        name: "Book of Shadows Rituals",
        hint: "Choose two level 1 spells that have the Ritual tag.",
        choices: { 0: { count: 2, replacement: false } },
        level: 1,
        spell: {
          ability: ["cha"],
          method: "pact",
          prepared: 2,
          uses: { max: "", per: "", requireSlot: true },
        },
      }),
    ];
  }

}
