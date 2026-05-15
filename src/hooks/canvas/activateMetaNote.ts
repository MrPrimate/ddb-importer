// activateNote fires from Note#_onClickLeft2 (double-click). DDB blocks
// iframe embedding via X-Frame-Options, so meta-data notes open the page in a
// native browser popup window instead of an embedded Foundry application.
export default function activateMetaNote(note: any, _options: any): boolean | void {
  const flag = foundry.utils.getProperty(note?.document ?? note, "flags.ddbimporter.metaDataNote") as
    | { url?: string | null }
    | undefined;
  if (!flag?.url) return;
  window.open(flag.url, "_blank", "popup=true,noopener,noreferrer,width=1024,height=768");
  return false;
}
