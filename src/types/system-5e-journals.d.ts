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
    ddbId?: number;
    bookCode?: string;
    slug?: string | null;
    contentChunkId?: string | null;
    cobaltId?: number;
    parentId?: number;
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

  interface I5eJournalPageFlags {
    ddb?: I5eJournalDDBFlags;
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
