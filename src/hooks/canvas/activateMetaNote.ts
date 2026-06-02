// activateNote fires from Note#_onClickLeft2 (double-click). DDB blocks
// iframe embedding via X-Frame-Options, so meta-data notes open the page in a
// native browser popup window instead of an embedded Foundry application.
export default function activateMetaNote(note: any, _options: any): boolean | void {
  const doc = note?.document ?? note;
  // Prefer the native imported journal: when the note resolves to a real
  // (non-placeholder) JournalEntry, let the default Note#_onClickLeft2 open it
  // (and let anchorInjection's options.anchor scroll to the sub-section).
  //
  // Meta-data notes always carry a valid entryId pointing at the shared
  // placeholder journal (NoteDocument requires one); that placeholder must NOT
  // suppress the D&D Beyond popup. Only a real native journal does.
  const entry = doc?.entry;
  const isPlaceholder = foundry.utils.getProperty(entry ?? {}, "flags.ddbimporter.metaDataNotesPlaceholder") === true;
  if (entry && !isPlaceholder) return;
  const flag = foundry.utils.getProperty(doc, "flags.ddbimporter.metaDataNote") as
    | { url?: string | null }
    | undefined;
  if (!flag?.url) return;
  window.open(flag.url, "_blank", "popup=true,noopener,noreferrer,width=1024,height=768");
  return false;
}
