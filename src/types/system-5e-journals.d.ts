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

  interface I5eJournalPageFlags {
    ddb?: I5eJournalDDBFlags;
    ddbimporter?: I5eJournalDDBImporterFlags;
    parentId?: number | string;
    slug?: string;
    contentChunkId?: string;
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
    ownership?: { default: number };
    flags?: I5eJournalPageFlags;
  }

  interface I5eJournalEntryFlags {
    ddb?: I5eJournalDDBFlags;
    ddbimporter?: I5eJournalDDBImporterFlags;
    core?: { sheetClass: string };
  }

  interface I5eJournalData {
    _id?: string;
    name?: string;
    folder?: string;
    sort?: number;
    ownership?: { default: number };
    flags?: I5eJournalEntryFlags;
    pages?: I5eJournalPageData[];
  }

}
