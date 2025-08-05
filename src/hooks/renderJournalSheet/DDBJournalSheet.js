/**
 * Custom journal sheet for displaying navigation between pages.
 */
class DDBJournalSheet extends dnd5e.applications.journal.JournalEntrySheet5e {
  constructor(doc, options) {
    super(doc, options);
    this.options.classes.push("ddb-journal", "themed", "theme-light");
  }
}

export function registerJournalSheet() {
  DocumentSheetConfig.registerSheet(JournalEntry, "ddb-importer", DDBJournalSheet, {
    types: ["base"],
    label: "D&D Beyond Journal",
    makeDefault: false,
  });
}
