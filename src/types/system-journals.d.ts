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
}
