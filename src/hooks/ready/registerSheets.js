import DDBCharacterManager from "../../apps/DDBCharacterManager.js";
import { logger } from "../../lib/_module.mjs";
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
      `resizeable,scrollbars,location=no,width=${width},height=${height},toolbar=1`,
    );
  }
  return true;
};

function characterButtonClick(event, document, actor) {
  let url = foundry.utils.hasProperty(document, "flags.ddbimporter.dndbeyond.url")
    ? document.flags.ddbimporter.dndbeyond.url
    : null;

  let jsonURL = foundry.utils.hasProperty(document, "flags.ddbimporter.dndbeyond.json")
    ? document.flags.ddbimporter.dndbeyond.json
    : null;
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
}

function characterButtonClickV2(event, _target) {
  // eslint-disable-next-line no-invalid-this
  characterButtonClick(event, this.document, this.actor);
}

function getCharacterButton(document, actor) {
  const buttonText = '<button type="button" id="ddbImporterButton" class="inactive"><i class="fab fa-d-and-d-beyond"></button>';

  let url = foundry.utils.hasProperty(document, "flags.ddbimporter.dndbeyond.url")
    ? document.flags.ddbimporter.dndbeyond.url
    : null;

  let button = $(buttonText);
  if (!url || url.trim() === "") button.removeClass("inactive");

  button.click((event) => characterButtonClick(event, document, actor));

  return button;
}

function npcButtonClick(event, document) {
  let url = document.flags.monsterMunch.url;
  if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
    new DDBAdventureFlags(document, {}).render(true);
  } else {
    logger.debug(`Clicked for url ${url}`);
    renderPopup("web", url);
  }
}

function npcButtonClickV2(event, _target) {
  // eslint-disable-next-line no-invalid-this
  npcButtonClick(event, this.document);
}

function getNPCButton(document) {
  let button = $('<button type="button" id="ddbImporterButton"><i class="fab fa-d-and-d-beyond"></button>');
  // eslint-disable-next-line no-unused-vars
  button.click((event) => npcButtonClick(event, document));

  return button;
}


function handlePCHeaderButton(config, buttons, label = true) {
  const whiteTitle = (game.settings.get("ddb-importer", "link-title-colour-white")) ? " white" : "";
  buttons.unshift({
    label: label ? `DDB Importer` : undefined,
    class: 'ddb-open-url',
    icon: `fab fa-d-and-d-beyond${whiteTitle}`,
    onclick: (event) => characterButtonClick(event, config.document, config.actor),
  });
}

function handleNPCHeaderButton(config, buttons, label = true) {
  const whiteTitle = (game.settings.get("ddb-importer", "link-title-colour-white")) ? " white" : "";
  buttons.unshift({
    label: label ? `DDB Importer` : undefined,
    class: 'ddb-open-url',
    icon: `fab fa-d-and-d-beyond${whiteTitle}`,
    onclick: (event) => npcButtonClick(event, config.document),
  });
}

function createActorHeaderButtons(config, buttons, label = true) {
  const isCharacterSheet = config.actor?.type === "character";
  const isNpcSheet = config.actor?.type === "npc";

  if (!isCharacterSheet && !isNpcSheet) return;

  if (!game.settings.get("ddb-importer", "character-link-title") && isCharacterSheet) return;
  if (!game.settings.get("ddb-importer", "monster-link-title") && isNpcSheet) return;

  if (isCharacterSheet) {
    handlePCHeaderButton(config, buttons, label);
  } else if (isNpcSheet) {
    if (!config.object.flags?.monsterMunch?.url) return;
    handleNPCHeaderButton(config, buttons, label);
  }
}

function handlePCHeaderButtonV2(config, buttons, label = true) {
  const whiteTitle = (game.settings.get("ddb-importer", "link-title-colour-white")) ? " white" : "";
  config.options.actions["ddbclick"] = characterButtonClickV2;
  buttons.unshift({
    label: label ? `DDB Importer` : undefined,
    icon: `fab fa-d-and-d-beyond${whiteTitle}`,
    action: "ddbclick",
    ownership: "OWNER",
  });
}

function handleNPCHeaderButtonV2(config, buttons, label = true) {
  const whiteTitle = (game.settings.get("ddb-importer", "link-title-colour-white")) ? " white" : "";
  config.options.actions["ddbclick"] = npcButtonClickV2;
  buttons.unshift({
    label: label ? `DDB Importer` : undefined,
    icon: `fab fa-d-and-d-beyond${whiteTitle}`,
    action: "ddbclick",
    ownership: "OWNER",
  });
}


function createActorHeaderButtonsV2(config, buttons, label = true) {
  const isCharacterSheet = config.actor?.type === "character";
  const isNpcSheet = config.actor?.type === "npc";

  if (!isCharacterSheet && !isNpcSheet) return;

  if (!game.settings.get("ddb-importer", "character-link-title") && isCharacterSheet) return;
  if (!game.settings.get("ddb-importer", "monster-link-title") && isNpcSheet) return;

  if (isCharacterSheet) {
    handlePCHeaderButtonV2(config, buttons, label);
  } else if (isNpcSheet) {
    if (!config.document.flags?.monsterMunch?.url) return;
    handleNPCHeaderButtonV2(config, buttons, label);
  }
}

function createOldSheetHeaderButtons(config, buttons) {
  if (!config.object.isOwner) return;
  if (!(config.object instanceof Actor)) return;

  const isCharacterSheet = config.constructor.name === "ActorSheet5eCharacter2";
  const isNpcSheet = config.constructor.name === "ActorSheet5eNPC2";

  if (isCharacterSheet || isNpcSheet) return;
  createActorHeaderButtons(config, buttons, false);
}

function createDefault5eButtons(config, buttons) {
  if (!config.object.isOwner) return;
  if (!(config.object instanceof Actor)) return;

  const isCharacterSheet = config.constructor.name === "ActorSheet5eCharacter2";
  const isNpcSheet = config.constructor.name === "ActorSheet5eNPC2";

  if (!isCharacterSheet && !isNpcSheet) {
    logger.debug(`Unknown Character Sheet`, {
      config,
    });
    return;
  }
  createActorHeaderButtons(config, buttons, true);
}

function createDefault5eButtonsV2(config, buttons) {
  if (!config.document.isOwner) return;
  if (!(config.document instanceof Actor)) return;

  const isCharacterSheet = config.constructor.name === "CharacterActorSheet";
  const isNpcSheet = config.constructor.name === "NPCActorSheet";

  if (!isCharacterSheet && !isNpcSheet) {
    logger.debug(`Unknown Character Sheet`, {
      config,
    });
    return;
  }
  createActorHeaderButtonsV2(config, buttons, true);
}

function tidySheets() {
  /**
   * All Tidy integrations for DDBI
   * @param {*} api the Tidy 5e Sheets API found at https://kgar.github.io/foundry-vtt-tidy-5e-sheets/classes/Tidy5eSheetsApi.html
   */
  function runTidyIntegrations(api) {

    // Prepare content injections for non-title DDBI logo on character sheets.
    const html = `<div class="ddbCharacterName"></div>`;

    const enabled = (data) => {
      const trustedUsersOnly = game.settings.get("ddb-importer", "restrict-to-trusted");
      const allowAllSync = game.settings.get("ddb-importer", "allow-all-sync");
      const titleLink = game.settings.get("ddb-importer", "character-link-title");
      const onlyTrustedUser = !allowAllSync && trustedUsersOnly && !game.user.isTrusted;
      return (data.owner || onlyTrustedUser) && !titleLink;
    };

    const onRender = (params) => {
      const $ddbCharacterName = $(params.element).find(".ddbCharacterName");
      const button = getCharacterButton(params.app.document, params.data.actor);
      $ddbCharacterName.append(button);
    };

    const classicContent = {
      html: html,
      injectParams: {
        selector: `[data-tidy-sheet-part="name-header-row"]`,
        position: "afterbegin",
      },
      enabled: enabled,
      onRender: onRender,
    };

    // Register content on Tidy's classic sheet
    api.registerCharacterContent(new api.models.HtmlContent(classicContent), {
      layout: "classic",
    });

    const quadroneContent = {
      html: html,
      injectParams: {
        selector: `.sheet-header-actions`,
        position: "afterbegin",
      },
      enabled: enabled,
      onRender: onRender,
    };

    // Register content on Tidy's quadrone sheet
    api.registerCharacterContent(new api.models.HtmlContent(quadroneContent), {
      layout: "quadrone",
    });

    // Provider header controls to Tidy Character and NPC sheets in the App V2 manner
    Hooks.on("getHeaderControlsActorSheetV2", (config, buttons) => {
      if (!config.object.isOwner) return;
      if (!(config.object instanceof Actor)) return;

      const isCharacterSheet = api.isTidy5eCharacterSheet(config);
      const isNpcSheet = api.isTidy5eNpcSheet(config);

      if (!isCharacterSheet && !isNpcSheet) {
        return;
      }

      createActorHeaderButtonsV2(config, buttons, true);
    });
  }

  // onceReady timeout necessitates the two methods of getting the API.
  const api = game.modules.get("tidy5e-sheet")?.api;
  if (api) {
    runTidyIntegrations(api);
  } else {
    Hooks.once("tidy5e-sheet.ready", (api) => {
      runTidyIntegrations(api);
    });
  }
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
  Hooks.on("getHeaderControlsBaseActorSheet", createDefault5eButtonsV2);
  Hooks.on('getActorSheet5eHeaderButtons', createDefault5eButtons);
  Hooks.on('getActorSheetHeaderButtons', createOldSheetHeaderButtons);
  pcSheetNames.forEach((sheetName) => {
    Hooks.on("render" + sheetName, (app, html, data) => {
      // only for GMs or the owner of this character
      if (!data.owner || !data.actor || (!allowAllSync && trustedUsersOnly && !game.user.isTrusted)) return;
      if ($(html).find("#ddbImporterButton").length > 0) return;

      if (!characterLink) {
        const button = getCharacterButton(app.document, data.actor);
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

      if (!monsterLink) {
        let button = getNPCButton(app.document);
        let wrap = $('<div class="ddbCharacterName"></div>');
        $(html).find("input[name='name']").wrap(wrap);
        $(html).find("input[name='name']").parent().prepend(button);
      }
    });
  });
}
