import { DDBAdventureFlags } from "../../apps/DDBAdventureFlags.js";
import buildNotes from "./buildNotes.js";

const POPUPS = {
  json: null,
  web: null,
};
const renderPopup = (type, url) => {
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

export function adventureFlags(app, html, data) {
  if (!app.document.flags.ddb) return;
  const isv13 = foundry.utils.isNewerVersion(game.version, "13");
  let journalContent = isv13
    ? html.querySelector('section.journal-page-content')
    : html.closest('.app').find('section.journal-page-content');

  if (isv13)
    journalContent.classList.add('ddb');
  else
    journalContent.addClass('ddb');

  if (!game.user.isGM) return;

  buildNotes(html, data);

}

export function getJournalSheet5eHeaderButtons(config, buttons) {
  if (!config.object.isOwner) return;
  if (!(config.object instanceof JournalEntry)) return;

  const whiteTitle = (game.settings.get("ddb-importer", "link-title-colour-white")) ? " white" : "";

  buttons.unshift({
    label: undefined,
    class: 'ddb-open-url',
    icon: `fab fa-d-and-d-beyond${whiteTitle}`,
    onclick: (event) => {
      if (event.shiftKey && event.ctrlKey) {
        new DDBAdventureFlags(config.document, {}).render(true);
        return true;
      } else {
        event.preventDefault();
        const flags = config.document.flags.ddb;
        const bookSource = CONFIG.DDB.sources.find((book) => flags.bookCode.toLowerCase() === book.name.toLowerCase());
        return renderPopup("web", `https://www.dndbeyond.com/${bookSource.sourceURL}/${flags.slug}`);
      }
    },
  });
}
