export {};

global {

  // Placeholders for createdata
  interface IPlaceholderJournalPage {
    name: string;
    type: "text";
    text: {
      content: string;
      format: 1 | 2;
    };
  }

  interface IPlaceholderJournalData {
    name: string;
    flags: {
      ddbimporter: {
        metaDataNotesPlaceholder: true;
      };
    };
    pages: IPlaceholderJournalPage[];
  }

  interface I5eJournalDDBFlags {
    ddbId?: string;
    bookCode?: string;
    cobaltId?: number | string;
    parentId?: number | string;
    contentChunkId?: string;
    slug?: string;
    slugLink?: string;
    originalLink?: string;
    linkName?: string;
    themeCss?: string;
    linkId?: string;
  }

  interface I5eJournalPageTitle {
    show?: boolean;
    level?: number;
  }

  interface I5eJournalPageText {
    content?: string;
    markdown?: string;
    format?: number;
  }

  interface I5eJournalPageImage {
    caption?: string;
  }

  interface I5eJournalPageVideo {
    controls?: boolean;
    loop?: boolean;
    autoplay?: boolean;
    volume?: number;
    timestamp?: number;
    width?: number;
    height?: number;
  }

  interface I5eJournalDDBImporterFlags {
    // Stamped by DDBRuleJournalFactory and SpellListFactory.
    type?: string;
    sourceId?: number;
    sourceCode?: string;
    sourceName?: string;

    // Stamped by DDBMapMetaData for the placeholder journal that hosts meta-data Note documents.
    metaDataNotesPlaceholder?: boolean;

    // Stamped by DDBEncounter on the shared "DDB Encounters" world journal.
    encounters?: boolean;
    encounterId?: string;
  }

  interface I5eJournalPageDnd5eFlags {
    tocHidden?: boolean;
  }

  interface I5eJournalPageFlags {
    ddb?: I5eJournalDDBFlags;
    ddbimporter?: I5eJournalDDBImporterFlags;
    dnd5e?: I5eJournalPageDnd5eFlags;
    parentId?: number | string;
    slug?: string;
    contentChunkId?: string;
    userData?: Record<string, unknown>; // from ddb
    labelName?: string;
  }

  interface I5eJournalPageData {
    _id?: string;
    name?: string;
    type?: string;
    title?: I5eJournalPageTitle;
    text?: I5eJournalPageText;
    image?: I5eJournalPageImage;
    video?: I5eJournalPageVideo;
    src?: string | null;
    category?: string;
    sort?: number;
    ownership?: IFoundryOwnership;
    flags?: I5eJournalPageFlags;
  }

  interface I5eJournalEntryFlags {
    ddb?: I5eJournalDDBFlags;
    ddbimporter?: I5eJournalDDBImporterFlags;
    core?: { sheetClass: string };
  }

  /** Keys of CONFIG.DND5E.ruleTypes (dnd5e module/config.mjs). */
  type I5eRuleType =
    | "rule" | "ability" | "areaOfEffect" | "condition" | "creatureType"
    | "damage" | "skill" | "spellComponent" | "spellSchool" | "spellTag"
    | "weaponMastery";

  /** Mirrors dnd5e RuleJournalPageData schema (module/data/journal/rule.mjs). */
  interface I5eRuleJournalPageSystem {
    type?: I5eRuleType;
    tooltip?: string;
  }

  interface I5eRuleJournalPageData extends I5eJournalPageData {
    type?: "rule";
    system: I5eRuleJournalPageSystem;
  }

  /** Keys of SpellListJournalPageData.GROUPING_MODES (dnd5e module/data/journal/spells.mjs). */
  type I5eSpellListGrouping = "none" | "alphabetical" | "level" | "school";

  /**
   * Source sub-schema for an unlinked spell. Mirrors the SourceField used in
   * spells.mjs with license/revision/rules removed and uuid added.
   */
  interface I5eUnlinkedSpellSource {
    book?: string;
    page?: string;
    custom?: string;
    uuid?: string;
  }

  /**
   * Mirrors UnlinkedSpellConfiguration (dnd5e module/data/journal/_types.mjs):
   * spells that can't be linked (outside SRD & current module).
   */
  interface I5eUnlinkedSpellConfiguration {
    _id?: string;
    identifier?: string;
    name: string;
    system?: {
      level?: number;
      school?: string;
    };
    source?: I5eUnlinkedSpellSource;
  }

  /** Mirrors SpellsJournalPageSystemData schema (module/data/journal/spells.mjs). */
  interface I5eSpellsJournalPageSystem {
    /** Type of spell list (e.g. class, subclass, race). */
    type?: string;
    /** Common identifier matching the associated type (e.g. bard, cleric). */
    identifier?: string;
    grouping?: I5eSpellListGrouping;
    description?: {
      value?: string;
    };
    /** UUIDs of spells to display. Stored as a Set, accepts an array on create. */
    spells?: Set<string> | string[];
    unlinkedSpells?: I5eUnlinkedSpellConfiguration[];
  }

  interface I5eSpellsJournalPageData extends I5eJournalPageData {
    type?: "spells";
    system: I5eSpellsJournalPageSystem;
  }

  interface I5eJournalData {
    _id?: string;
    name?: string;
    folder?: string;
    sort?: number;
    ownership?: IFoundryOwnership;
    flags?: I5eJournalEntryFlags;
    pages?: I5eJournalPageData[];
  }

}
