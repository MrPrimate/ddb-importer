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
    choices: string[] | IDDBSpellLinkGrant[] | IDDBSpellLinkChoice | ISpellAdvancementGrant[];
    uuids?: IDDBSpellLinkUuid[];
    level: number | string;
  }

  type TAdvancementFeatureDefinitions = TDDBFeatureMixinDefinitions | IDDBClassDefinitionFeature;

  interface ISpellAdvancementGrant {
    level: number;
    name: string;
    amount?: string;
  }

  interface IBasicAdvancementParseResponse {
    choices: string[];
    grants: string[];
    number: number;
    allowReplacements?: boolean;
    hint?: string;
  }

  interface ISpellCastingAbilitiesParseResponse {
    hint: string;
    abilities: string[];
    properties: I5eActivityCastSpellProperties[];
    concentration: boolean;
  }

  interface ISpellAdvancementChoice {
    level: number;
    spellList: string;
    amount: string;
  }

  interface IParsedSpellAdvancementData {
    spellListCantripChoice: string | null;
    spellListCantripChoiceNum?: number | string | null;
    spellListChoiceReplace?: boolean;
    cantripChoices: string[];
    cantripGrants: string[];
    spellGrants: ISpellAdvancementGrant[];
    spellChoices: ISpellAdvancementChoice[];
    hint: string;
  }

  interface IAdvancementGetterOptions  {
    mods: IModifiersMod[];
    feature: TAdvancementFeatureDefinitions;
    availableToMulticlass?: boolean;
    level: number;
  }

  interface IAdvancementGetterCantripGrantAdvancement {
    choices?: string[];
    abilities?: string[];
    hint?: string;
    name: string;
    spellLinks: IDDBSpellLink[];
    is2024?: boolean;
    spellData?: I5eSpellItem[];
  }

  interface IAdvancementGetterCantripChoiceAdvancement extends IAdvancementGetterCantripGrantAdvancement {
    grants?: string[];
    spellListChoice?: string | null;
    choiceLevel?: number;
    count?: number;
    allowReplacements?: boolean;
  }

  type TPreparedSpellValue =
    typeof CONFIG.DND5E.spellPreparationStates.always.value
    | typeof CONFIG.DND5E.spellPreparationStates.prepared.value
    | typeof CONFIG.DND5E.spellPreparationStates.unprepared.value;

  interface IAdvancementGetterSpellGrantAdvancement {
    spellGrants: ISpellAdvancementGrant[];
    abilities?: string[];
    hint?: string;
    name: string;
    spellLinks: IDDBSpellLink[];
    method?: "innate" | "spell" | "pact";
    requireSlot?: boolean;
    prepared?: TPreparedSpellValue;
    level?: number | string;
    is2024: boolean;
    forceNoAmount?: boolean;
    spellData?: I5eSpellItem[];
  }

  interface IAdvancementGetterSpellChoiceAdvancement {
    spellChoice: ISpellAdvancementChoice;
    abilities?: string[];
    hint?: string;
    name: string;
    spellLinks: IDDBSpellLink[];
    method?: "innate" | "spell" | "pact";
    requireSlot?: boolean;
    prepared?: TPreparedSpellValue;
    level?: number | string;
    is2024: boolean;
    spellData?: I5eSpellItem[];
    choiceLevel?: number | string;
    choices?: string[];
    allowReplacements?: boolean;
    count?: number;
  }

}
