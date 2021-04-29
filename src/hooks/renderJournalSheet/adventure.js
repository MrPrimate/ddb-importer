import { DDBAdventureFlags } from "../../lib/adventureFlags.js";
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
  if (!app.entity.data.flags.ddb) return;

  const title = `DDB Adventure Import Flags`;
  const whiteTitle = (game.settings.get("ddb-importer", "link-title-colour-white")) ? " white" : "";
  let button = $(`<a class="open-adventure-ddb-importer" title="${title}"><i class="fab fa-d-and-d-beyond${whiteTitle}"></i></a>`);
  button.click((event) => {
    if (event.shiftKey) {
      new DDBAdventureFlags(app.entity, {}).render(true);
    } else {
      event.preventDefault();
      const flags = app.entity.data.flags.ddb;
      return renderPopup("web", `https://www.dndbeyond.com/sources/${flags.bookCode}/${flags.slug}`);
    }
    return true;
  });
  html.closest('.app').find('.open-adventure-ddb-importer').remove();
  let titleElement = html.closest('.app').find('.window-title');
  button.insertAfter(titleElement);
  buildNotes(html, data);
}


export default adventureFlags;
// export function adventureSheets() {
//   Hooks.on('renderJournalSheet', initAdventureSheetHook);
// }

