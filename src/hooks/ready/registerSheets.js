import DDBCharacterManager from "../../apps/DDBCharacterManager.js";
import logger from "../../logger.js";
import DDBSetup from "../../apps/DDBSetup.js";
import { DDBAdventureFlags } from "../../apps/DDBAdventureFlags.js";

const API_ENDPOINT = "https://character-service.dndbeyond.com/character/v5/character/";
// reference to the D&D Beyond popup
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

function getCharacterButton(document, actor) {

  const characterLink = game.settings.get("ddb-importer", "character-link-title");
  const whiteTitle = (game.settings.get("ddb-importer", "link-title-colour-white")) ? " white" : "";
  const buttonText = characterLink
    ? `<a class="ddb-open-url" title="DDB Importer"><i class="fab fa-d-and-d-beyond${whiteTitle}"></i></a>`
    : '<button type="button" id="ddbImporterButton" class="inactive"><i class="fab fa-d-and-d-beyond"></button>';

  let url = foundry.utils.hasProperty(document, "flags.ddbimporter.dndbeyond.url")
    ? document.flags.ddbimporter.dndbeyond.url
    : null;

  let jsonURL = foundry.utils.hasProperty(document, "flags.ddbimporter.dndbeyond.json")
    ? document.flags.ddbimporter.dndbeyond.json
    : null;

  let button = $(buttonText);
  if (!characterLink && (!url || url.trim() === "")) button.removeClass("inactive");

  button.click((event) => {
    if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
      new DDBAdventureFlags(document, {}).render(true);
    } else if (event.shiftKey) {
      event.preventDefault();
      return renderPopup("web", url);
    } else if (event.altKey && jsonURL) {
      event.preventDefault();
      return renderPopup("json", jsonURL);
    } else if (event.altKey && !jsonURL) {
      // get the character ID
      const characterId = url.split("/").pop();
      if (characterId) {
        event.preventDefault();
        return renderPopup("json", API_ENDPOINT + characterId);
      }
    } else if ((!event.shiftKey && !event.ctrlKey && !event.altKey) || url === null) {
      const setupComplete = DDBSetup.isSetupComplete(false);

      if (setupComplete) {
        const characterImport = new DDBCharacterManager(DDBCharacterManager.defaultOptions, actor);
        characterImport.render(true);
      } else {
        new DDBSetup().render(true);
      }

      return true;
    }

    return false;
  });

  return button;
}

function getNPCButton(document) {
  const monsterLink = game.settings.get("ddb-importer", "monster-link-title");
  const whiteTitle = (game.settings.get("ddb-importer", "link-title-colour-white")) ? " white" : "";

  let url = document.flags.monsterMunch.url;

  let button = monsterLink
    ? $(`<a class="ddb-open-url" title="D&D Beyond"><i class="fab fa-d-and-d-beyond${whiteTitle}"></i></a>`)
    : $('<button type="button" id="ddbImporterButton"><i class="fab fa-d-and-d-beyond"></button>');

  // eslint-disable-next-line no-unused-vars
  button.click((event) => {
    if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
      new DDBAdventureFlags(document, {}).render(true);
    } else {
      logger.debug(`Clicked for url ${url}`);
      renderPopup("web", url);
    }
  });

  return button;
}

export function tidySheets() {
  const api = game.modules.get('tidy5e-sheet-kgar')?.api ?? game.modules.get('tidy5e-sheet')?.api;
  if (!api) return;

  api.registerCharacterContent(
    new api.models.HtmlContent({
      html: `<div class="ddbCharacterName"></div>`,
      injectParams: {
        selector: `[data-tidy-sheet-part="name-header-row"]`,
        position: "afterbegin",
      },
      enabled: (data) => {
        const trustedUsersOnly = game.settings.get("ddb-importer", "restrict-to-trusted");
        const allowAllSync = game.settings.get("ddb-importer", "allow-all-sync");
        const titleLink = game.settings.get("ddb-importer", "character-link-title");
        const onlyTrustedUser = !allowAllSync && trustedUsersOnly && !game.user.isTrusted;
        return (data.owner || onlyTrustedUser) && !titleLink;
      },
      onRender: (params) => {
        const $ddbCharacterName = $(params.element).find(".ddbCharacterName");
        const button = getCharacterButton(params.app.document, params.data.actor);
        $ddbCharacterName.append(button);
      },
    })
  );

  // api.registerNpcContent(
  //   new api.models.HtmlContent({
  //     html: `<div class="ddbCharacterName"></div>`,
  //     injectParams: {
  //       selector: `[data-tidy-sheet-part="name-header-row"]`,
  //       position: "afterbegin",
  //     },
  //     enabled: (params) => {
  //       return foundry.utils.hasProperty(params, "app.document.flags.monsterMunch.url");
  //     },
  //     onRender: (params) => {
  //       const $ddbCharacterName = $(params.element).find(".ddbCharacterName");
  //       const button = getCharacterButton(params.app.document, params.data.actor);
  //       $ddbCharacterName.append(button);
  //     },
  //   })
  // );
}

export default function () {
  /**
   * Character sheets
   */
  const pcSheetNames = Object.values(CONFIG.Actor.sheetClasses.character)
    .map((sheetClass) => sheetClass.cls)
    .map((sheet) => sheet.name);

  const trustedUsersOnly = game.settings.get("ddb-importer", "restrict-to-trusted");
  const allowAllSync = game.settings.get("ddb-importer", "allow-all-sync");
  const characterLink = game.settings.get("ddb-importer", "character-link-title");
  const monsterLink = game.settings.get("ddb-importer", "monster-link-title");

  // const buttonText = characterLink
  //   ? `<a class="ddb-open-url" title="DDB Importer"><i class="fab fa-d-and-d-beyond${whiteTitle}"></i></a>`
  //   : '<button type="button" id="ddbImporterButton" class="inactive"><i class="fab fa-d-and-d-beyond"></button>';

  tidySheets();
  pcSheetNames.forEach((sheetName) => {
    Hooks.on("render" + sheetName, (app, html, data) => {
      // only for GMs or the owner of this character
      if (!data.owner || !data.actor || (!allowAllSync && trustedUsersOnly && !game.user.isTrusted)) return;
      if ($(html).find("#ddbImporterButton").length > 0) return;

      const button = getCharacterButton(app.document, data.actor);

      if (characterLink) {
        html.closest('.app').find('.ddb-open-url').remove();
        let titleElement = html.closest('.app').find('.window-title');
        if (!app._minimized) button.insertAfter(titleElement);
      } else {
        let wrap = $('<div class="ddbCharacterName"></div>');
        $(html).find("input[name='name']").wrap(wrap);
        $(html).find("input[name='name']").parent().prepend(button);
      }
    });
  });


  /**
   * NPC sheets
   */
  const npcSheetNames = Object.values(CONFIG.Actor.sheetClasses.npc)
    .map((sheetClass) => sheetClass.cls)
    .map((sheet) => sheet.name);

  npcSheetNames.forEach((sheetName) => {
    Hooks.on("render" + sheetName, (app, html, data) => {
      // only for GMs or the owner of this npc
      if (!data.owner || !data.actor) return;
      if (!app.document.flags?.monsterMunch?.url) return;
      if ($(html).find("#ddbImporterButton").length > 0) return;

      let button = getNPCButton(app.document);

      if (monsterLink) {
        html.closest('.app').find('.ddb-open-url').remove();
        let titleElement = html.closest('.app').find('.window-title');
        if (!app._minimized) button.insertAfter(titleElement);
      } else {
        let wrap = $('<div class="ddbCharacterName"></div>');
        $(html).find("input[name='name']").wrap(wrap);
        $(html).find("input[name='name']").parent().prepend(button);
      }
    });
  });
}
