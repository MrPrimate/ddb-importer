import CharacterImport from "../../character/import.js";
import logger from "../../logger.js";
import { DDBSetup, isSetupComplete } from "../../lib/Settings.js";

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
  const whiteTitle = (game.settings.get("ddb-importer", "link-title-colour-white")) ? " white" : "";

  pcSheetNames.forEach((sheetName) => {
    Hooks.on("render" + sheetName, (app, html, data) => {
      // only for GMs or the owner of this character
      if (!data.owner || !data.actor || (!allowAllSync && trustedUsersOnly && !game.user.isTrusted)) return;

      let url = null;
      if (app.document.data.flags.ddbimporter?.dndbeyond?.url) {
        url = app.document.data.flags.ddbimporter.dndbeyond.url;
      }

      let jsonURL = null;
      if (app.document.data.flags.ddbimporter?.dndbeyond?.json) {
        jsonURL = app.document.data.flags.ddbimporter.dndbeyond.json;
      }

      let button;

      if (characterLink) {
        button = $(`<a class="ddb-open-url" title="DDB Importer"><i class="fab fa-d-and-d-beyond${whiteTitle}"></i></a>`);
      } else {
        // don't add the button multiple times
        if ($(html).find("#ddbImporterButton").length > 0) return;
        button = $('<button type="button" id="ddbImporterButton" class="inactive"><i class="fab fa-d-and-d-beyond"></button>');
        if (app.document.data.flags.ddbimporter?.dndbeyond?.url) button.removeClass("inactive");
      }

      button.click((event) => {
        if (event.shiftKey) {
          event.preventDefault();
          return renderPopup("web", url);
        }

        if (event.altKey && jsonURL) {
          event.preventDefault();
          return renderPopup("json", jsonURL);
        }
        if (event.altKey && !jsonURL) {
          // get the character ID
          const characterId = url.split("/").pop();
          if (characterId) {
            event.preventDefault();
            return renderPopup("json", API_ENDPOINT + characterId);
          }
        }

        if ((!event.shiftKey && !event.ctrlKey && !event.altKey) || url === null) {
          const setupComplete = isSetupComplete(false);

          if (setupComplete) {
            let characterImport = new CharacterImport(CharacterImport.defaultOptions, data.actor);
            characterImport.render(true);
          } else {
            new DDBSetup().render(true);
          }

          return true;
        }

        return false;
      });

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
      if (!app.document.data.flags?.monsterMunch?.url) return;
      let url = app.document.data.flags.monsterMunch.url;

      let button;

      if (monsterLink) {
        button = $(`<a class="ddb-open-url" title="D&D Beyond"><i class="fab fa-d-and-d-beyond${whiteTitle}"></i></a>`);
      } else {
        button = $('<button type="button" id="ddbImporterButton"><i class="fab fa-d-and-d-beyond"></button>');
      }

      // eslint-disable-next-line no-unused-vars
      button.click((event) => {
        logger.debug(`Clicked for url ${url}`);
        renderPopup("web", url);
      });

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
