import { DDBItemConfig } from "../../apps/DDBItemConfig.js";
import { DDBAdventureFlags } from "../../apps/DDBAdventureFlags.js";

function initItemSheetHook(app, html) {
  if (!app.document.isOwned) return;
  // console.error(app.entity);
  // console.log(data);
  const title = `DDB Importer Item Config`;
  const whiteTitle = (game.settings.get("ddb-importer", "link-title-colour-white")) ? " white" : "";
  let button = $(`<a class="open-item-ddb-importer" title="${title}"><i class="fab fa-d-and-d-beyond${whiteTitle}"></i></a>`);
  button.click((event) => {
    if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
      new DDBAdventureFlags(app.document, {}).render(true);
    } else {
      new DDBItemConfig(app.document, {}).render(true);
    }
  });
  html.closest('.app').find('.open-item-ddb-importer').remove();
  let titleElement = html.closest('.app').find('.window-title');
  button.insertAfter(titleElement);
}

export function itemSheets() {
  Hooks.on('renderItemSheet', initItemSheetHook);
}

