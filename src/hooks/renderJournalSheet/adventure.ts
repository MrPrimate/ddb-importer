import { DDBAdventureFlags } from "../../apps/DDBAdventureFlags";
import { logger, utils } from "../../lib/_module";
import buildNotes from "./buildNotes";
import { ensureBookThemeStyle } from "../../muncher/adventure/native/NativeBookStyles";

const POPUPS: Record<string, Window | null> = {
  json: null,
  web: null,
};
const renderPopup = (type: string, url: string) => {
  if (POPUPS[type] && !POPUPS[type].close) {
    POPUPS[type].focus();
    POPUPS[type].location.href = url;
  } else {
    const ratio = window.innerWidth / window.innerHeight;
    const width = Math.round(window.innerWidth * 0.5);
    const height = Math.round(window.innerWidth * 0.5 * ratio);
    POPUPS[type] = window.open(
      url,
      "ddb_sheet_popup",
      `resizeable,scrollbars,location=no,width=${width},height=${height},toolbar=1`,
    );
  }
  return true;
};

export function adventureFlags(app: any, html: HTMLElement, data: Record<string, any>) {
  if (!app.document.flags.ddb) return;
  const journalContent = html.querySelector("section.journal-page-content");
  if (!journalContent) return;
  journalContent.classList.add("ddb");
  const bookCode = foundry.utils.getProperty(data, "document.flags.ddb.bookCode") as string | undefined;
  if (bookCode) {
    const code = bookCode.toLowerCase();
    journalContent.classList.add(code);
    // lazily inject the book's native theme css (stored on the flag at import), once per book.
    ensureBookThemeStyle(code, foundry.utils.getProperty(data, "document.flags.ddb.themeCss") as string | undefined);
  }

  if (!game.user.isGM) return;

  buildNotes(html, data);

}

function onClick(config: Record<string, any>, event: MouseEvent) {
  if (event.shiftKey && event.ctrlKey) {
    new DDBAdventureFlags(config.document, {}).render(true);
    return true;
  } else {
    event.preventDefault();
    const flags = config.document.flags.ddb;
    const bookSource = CONFIG.DDB.sources.find((book) => flags.bookCode.toLowerCase() === book.name.toLowerCase());
    if (!bookSource) {
      logger.warn(`Unable to find DDB book source for ${flags.bookCode}`);
      return false;
    }
    return renderPopup("web", `https://www.dndbeyond.com/${bookSource.sourceURL}/${flags.slug}`);
  }
}

function onClickV2(this: JournalEntry, event: MouseEvent) {
  onClick(this, event);
}


export function getJournalSheet5eHeaderButtons(config: Record<string, any>, buttons: Record<string, any>[]) {
  if (!config.object.isOwner) return;
  if (!(config.object instanceof JournalEntry)) return;

  const whiteTitle = (utils.getSetting<boolean>("link-title-colour-white")) ? " white" : "";

  buttons.unshift({
    label: undefined,
    class: "ddb-open-url",
    icon: `fab fa-d-and-d-beyond${whiteTitle}`,
    onclick: (event: MouseEvent) => onClick(config, event),
  });
}

export function getHeaderControlsJournalEntrySheetButtons(config: Record<string, any>, buttons: Record<string, any>[]) {
  if (!config.entry.isOwner) return;
  if (!(config.entry instanceof JournalEntry)) return;

  const whiteTitle = (utils.getSetting<boolean>("link-title-colour-white")) ? " white" : "";
  config.options.actions["ddbclick"] = onClickV2;
  buttons.unshift({
    label: `D&D Beyond`,
    icon: `fab fa-d-and-d-beyond${whiteTitle}`,
    action: "ddbclick",
    ownership: "OWNER",
  });
}
