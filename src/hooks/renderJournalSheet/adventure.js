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
      `resizeable,scrollbars,location=no,width=${width},height=${height},toolbar=1`
    );
  }
  return true;
};

function adventureFlags(app, html, data) {
  if (!app.document.flags.ddb) return;
  let journalContent = html.closest('.app').find('section.journal-page-content');
  journalContent.addClass("ddb-adventure");

  if (!game.user.isGM) return;
  const existingLink = html.closest('.app').find('.open-adventure-ddb-importer');
  if (existingLink.length > 0) return;

  const title = `Go to DDB`;
  const whiteTitle = (game.settings.get("ddb-importer", "link-title-colour-white")) ? " white" : "";
  let button = $(`<a class="open-adventure-ddb-importer" title="${title}"><i class="fab fa-d-and-d-beyond${whiteTitle}"></i></a>`);
  button.click((event) => {
    if (event.shiftKey && event.ctrlKey) {
      new DDBAdventureFlags(app.document, {}).render(true);
    } else {
      event.preventDefault();
      const flags = app.document.flags.ddb;
      const bookSource = CONFIG.DDB.sources.find((book) => flags.bookCode.toLowerCase() === book.name.toLowerCase());
      return renderPopup("web", `https://www.dndbeyond.com/${bookSource.sourceURL}/${flags.slug}`);
    }
    return true;
  });

  let titleElement = html.closest('.app').find('.window-title');
  button.insertAfter(titleElement);
  buildNotes(html, data);

}


export default adventureFlags;
