export {};

global {

  /** A compendium spell reference as returned by _getSpellUuidsFromFeatureSpellData */
  interface IDDBSpellLinkUuid {
    name: string;
    uuid: string;
    _id?: string;
    img?: string;
  }

  /** A spell grant entry produced by parseHTMLSpellAdvancementDataForTraits */
  interface IDDBSpellLinkGrant {
    name: string;
    level: number | string;
    amount: string;
  }

  /** A spell choice entry produced by parseHTMLSpellAdvancementDataForTraits */
  interface IDDBSpellLinkChoice {
    level: number | string;
    spellList?: string;
    amount?: string;
  }

  /**
   * An entry pushed into a parser's spellLinks array by AdvancementHelper.
   *
   * - getCantripChoiceAdvancement  → type "choice", choices: string[],          uuids present
   * - getSpellChoiceAdvancement    → type "choice", choices: ISpellLinkChoice,  uuids absent
   * - getCantripGrantAdvancement   → type "grant",  choices: string[],          uuids present
   * - getSpellGrantAdvancement     → type "grant",  choices: ISpellLinkGrant[], uuids present
   */
  interface IDDBSpellLink {
    type: "choice" | "grant";
    advancementId: string;
    choices: string[] | IDDBSpellLinkGrant[] | IDDBSpellLinkChoice;
    uuids?: IDDBSpellLinkUuid[];
    level: number | string;
  }

}
