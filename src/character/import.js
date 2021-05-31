import utils from "../utils.js";
import logger from "../logger.js";
import { parseJson } from "../parser/character.js";
import {
  copySupportedItemFlags,
  addMagicItemSpells,
  // updateFolderItems,
  getCompendiumItems,
  getSRDCompendiumItems,
  copySRDIcons,
  getDDBEquipmentIcons,
  getDDBSpellSchoolIcons,
  getDDBGenericItemIcons,
  addItemEffectIcons,
} from "../muncher/import.js";
import { download, getCampaignId, getPatreonTiers } from "../muncher/utils.js";
import { migrateActorDAESRD, addItemsDAESRD } from "../muncher/dae.js";
import { copyInbuiltIcons } from "../icons/index.js";
import { updateDDBCharacter } from "./update.js";
import { characterExtras } from "./extras.js";
import DICTIONARY from "../dictionary.js";
import { getCobalt } from "../lib/Secrets.js";
import { loadSRDRules } from "../parser/templateStrings.js";
import { abilityOverrideEffects } from "../parser/effects/abilityOverrides.js";

const FILTER_SECTIONS = ["classes", "features", "actions", "inventory", "spells"];

const DISABLE_FOUNDRY_UPGRADE = {
  applyFeatures: false,
  addFeatures: false,
  promptAddFeatures: false,
};


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

/**
 * Retrieves the character ID from a given URL, which can be one of the following:
 * - regular character sheet
 * - public sharing link
 * - direct link to the endpoint already
 * @param {string} url A given URL pointing to a character. Contains the character ID
 * @returns {string} characterId or null
 */
const getCharacterId = (url) => {
  let matches;
  const CONFIGS = [
    () => {
      const PATTERN = /.*dndbeyond\.com\/profile\/[\w-_]+\/characters\/(\d+)/;
      matches = url.match(PATTERN);
      if (matches) {
        return matches[1];
      }
      return null;
    },
    () => {
      const PATTERN = /ddb.ac\/characters\/(\d+)\/[\w-_]+/;
      matches = url.match(PATTERN);
      if (matches) {
        return matches[1];
      }
      return null;
    },
    () => {
      const PATTERN = /dndbeyond.com\/characters\/(\d+)/;
      matches = url.match(PATTERN);
      if (matches) {
        return matches[1];
      }
      return null;
    },
    () => {
      const PATTERN = /character-service.dndbeyond.com\/character\/v4\/character\/(\d+)/;
      matches = url.match(PATTERN);
      if (matches) {
        return matches[1];
      }
      return null;
    },
  ];

  return CONFIGS.map((fn) => fn(url)).reduce((prev, cur) => (!prev && cur ? cur : prev), null);
};

/**
 * Creates the Character Endpoint URL from a given character ID
 * @param {string} characterId The character ID
 * @returns {string|null} The API endpoint
 */
const getCharacterAPIEndpoint = (characterId) => {
  return characterId !== null ? `https://character-service.dndbeyond.com/character/v4/character/${characterId}` : null;
};

const getCharacterUpdatePolicyTypes = (invert = false) => {
  let itemTypes = [];

  if (invert) {
    if (!game.settings.get("ddb-importer", "character-update-policy-class")) itemTypes.push("class");
    if (!game.settings.get("ddb-importer", "character-update-policy-feat")) itemTypes.push("feat");
    if (!game.settings.get("ddb-importer", "character-update-policy-weapon")) itemTypes.push("weapon");
    if (!game.settings.get("ddb-importer", "character-update-policy-equipment"))
      itemTypes = itemTypes.concat(DICTIONARY.types.equipment);
    if (!game.settings.get("ddb-importer", "character-update-policy-spell")) itemTypes.push("spell");
  } else {
    if (game.settings.get("ddb-importer", "character-update-policy-class")) itemTypes.push("class");
    if (game.settings.get("ddb-importer", "character-update-policy-feat")) itemTypes.push("feat");
    if (game.settings.get("ddb-importer", "character-update-policy-weapon")) itemTypes.push("weapon");
    if (game.settings.get("ddb-importer", "character-update-policy-equipment"))
      itemTypes = itemTypes.concat(DICTIONARY.types.equipment);
    if (game.settings.get("ddb-importer", "character-update-policy-spell")) itemTypes.push("spell");
  }
  return itemTypes;
};

/**
 * Returns a combined array of all items to process, filtered by the user's selection on what to skip and what to include
 * @param {object} result object containing all character items sectioned as individual properties
 * @param {array[string]} sections an array of object properties which should be filtered
 */
const filterItemsByUserSelection = (result, sections, invert = false) => {
  let items = [];
  const validItemTypes = getCharacterUpdatePolicyTypes(invert);

  for (const section of sections) {
    items = items.concat(result[section]).filter((item) => validItemTypes.includes(item.type));
  }
  return items;
};

const filterActorItemsByUserSelection = (actor, invert = false) => {
  const validItemTypes = getCharacterUpdatePolicyTypes(invert);

  const items = actor.items.filter((item) => validItemTypes.includes(item.type));

  return items;
};

/**
 * Loads and parses character in the proxy
 * @param {*} characterId
 */

export async function getCharacterData(characterId, syncId) {
  const cobaltCookie = getCobalt();
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const campaignId = getCampaignId();
  const proxyCampaignId = campaignId === "" ? null : campaignId;
  let body = { cobalt: cobaltCookie, betaKey: betaKey, characterId: characterId, campaignId: proxyCampaignId };
  if (syncId) {
    body["updateId"] = syncId;
  }

  try {
    const response = await fetch(`${parsingApi}/proxy/character`, {
      method: "POST",
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(body), // body data type must match "Content-Type" header
    });
    const data = await response.json();
    if (!data.success) return data;

    // load some required content
    await loadSRDRules();

    // construct the expected { character: {...} } object
    let ddb = data.ddb.character === undefined ? { character: data.ddb } : data.ddb;
    ddb.classOptions = data.ddb.classOptions;
    logger.debug("DDB Data to parse:", JSON.parse(JSON.stringify(ddb)));
    try {
      const character = parseJson(ddb);
      const shouldChangeName = game.settings.get("ddb-importer", "character-update-policy-name");
      if (!shouldChangeName) {
        character.character.name = undefined;
        character.character.token.name = undefined;
      }
      data["character"] = character;
      return data;
    } catch (error) {
      const debugJson = game.settings.get("ddb-importer", "debug-json");
      if (debugJson) {
        download(JSON.stringify(data), `${characterId}-raw.json`, "application/json");
      }
      throw error;
    }
  } catch (error) {
    logger.error("JSON Fetch and Parse Error");
    logger.error(error);
    logger.error(error.stack);
    throw error;
  }
}

export default class CharacterImport extends FormApplication {
  constructor(options, actor) {
    super(options);
    this.actor = game.actors.get(actor._id);
    this.migrateMetadata();
    this.actorOriginal = JSON.parse(JSON.stringify(this.actor));
    this.result = {};
  }

  migrateMetadata() {
    if (this.actor.data.flags && this.actor.data.flags.ddbimporter && this.actor.data.flags.ddbimporter.dndbeyond) {
      const url = this.actor.data.flags.ddbimporter.dndbeyond.url || this.actor.data.flags.ddbimporter.dndbeyond.roUrl;

      if (url && !this.actor.data.flags.ddbimporter.characterId) {
        const characterId = getCharacterId(url);
        if (characterId) {
          const apiEndpointUrl = getCharacterAPIEndpoint(characterId);
          this.actor.data.flags.ddbimporter.dndbeyond.characterId = characterId;
          this.actor.data.flags.ddbimporter.dndbeyond.apiEndpointUrl = apiEndpointUrl;
          this.actor.data.flags.ddbimporter.dndbeyond.url = url;
        } else {
          // clear the url, because it's malformed anyway
          this.actor.data.flags.ddbimporter.dndbeyond.url = null;
        }
      }
    }
  }

  /**
   * Define default options for the PartySummary application
   */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.title = game.i18n.localize("ddb-importer.module-name");
    options.template = "modules/ddb-importer/handlebars/character.hbs";
    options.width = 900;
    options.height = "auto";
    options.classes = ["ddbimporter", "sheet"];
    options.tabs = [{ navSelector: ".tabs", contentSelector: "form", initial: "import" }];

    return options;
  }

  static showCurrentTask(html, title, message = null, isError = false) {
    let element = $(html).find(".task-name");
    element.html(`<h2 ${isError ? " style='color:red'" : ""}>${title}</h2>${message ? `<p>${message}</p>` : ""}`);
    $(html).parent().parent().css("height", "auto");
  }

  /**
   * Loops through a characters items and updates flags
   * @param {*} items
   */
  async copySupportedCharacterItemFlags(items) {
    items.forEach((item) => {
      const originalItem = this.actorOriginal.items.find(
        (originalItem) => item.name === originalItem.name && item.type === originalItem.type
      );
      if (originalItem) {
        copySupportedItemFlags(originalItem, item);
      }
    });
  }

  copyExistingJournalNotes() {
    if (!this.actorOriginal) return;
    const journalFields = [
      "notes1name",
      "notes2name",
      "notes3name",
      "notes4name",
      "notes1",
      "notes2",
      "notes3",
      "notes4",
      "notes",
    ];
    journalFields.forEach((field) => {
      if (this.actorOriginal.data.details[field]) {
        this.actor.data.data.details[field] = this.actorOriginal.data.details[field];
      }
    });
  }

  async copyCharacterItemEffects(items) {
    return new Promise((resolve) => {
      resolve(
        items.map((item) => {
          const originalItem = this.actorOriginal.items.find(
            (originalItem) => item.name === originalItem.name && item.type === originalItem.type
          );
          if (originalItem) {
            if (item.effects === undefined) item.effects = [];
            if (originalItem.effects) {
              logger.info(`Copying Effects for ${originalItem.name}`);
              item.effects = originalItem.effects;
            }
          }
          return item;
        })
      );
    });
  }

  /**
   * Removes items
   * @param {*} items
   * @param {*} itemsToRemove
   */
  static async removeItems(items, itemsToRemove) {
    return new Promise((resolve) => {
      resolve(
        items.filter(
          (item) =>
            !itemsToRemove.some((originalItem) => {
              const originalNameFlag = ((originalItem.flags || {}).ddbimporter || {}).originalItemName;
              const originalNameMatch = originalNameFlag
                ? originalItem.flags.ddbimporter.originalItemName === item.name
                : false;
              const nameMatch = item.name === originalItem.name || originalNameMatch;
              return nameMatch && item.type === originalItem.type;
            })
        )
      );
    });
  }

  /**
   * Deletes items from the inventory bases on which sections a user wants to update
   * Possible sections:
   * - class
   * - feat
   * - weapon
   * - equipment
   * - inventory: consumable, loot, tool and backpack
   * - spell
   */
  async clearItemsByUserSelection(excludedList = []) {
    const includedItems = getCharacterUpdatePolicyTypes();

    // collect all items belonging to one of those inventory item categories
    const ownedItems = this.actor.getEmbeddedCollection("Item");
    const toRemove = ownedItems
      .filter(
        (item) => includedItems.includes(item.type) && !excludedList.some((excluded) => excluded._id === item.id)
      )
      .filter((item) => !item.data.flags.ddbimporter?.ignoreItemImport)
      .map((item) => item.id);

    if (toRemove.length > 0) await this.actor.deleteEmbeddedDocuments("Item", toRemove);
    // toRemove.forEach(async (item) => {
    //   await this.actor.deleteEmbeddedDocuments("Item", [item]);
    // });
    return toRemove;
  }

  async updateImage(html, data) {
    // updating the image?
    let imagePath = this.actor.img;
    const userHasPermission = !(game.settings.get("ddb-importer", "restrict-to-trusted") && !game.user.isTrusted);
    if (
      userHasPermission &&
      data.avatarUrl &&
      data.avatarUrl !== "" &&
      (imagePath.indexOf("mystery-man") !== -1 || game.settings.get("ddb-importer", "character-update-policy-image"))
    ) {
      CharacterImport.showCurrentTask(html, "Uploading avatar image");
      let filename = data.name
        .replace(/[^a-zA-Z]/g, "-")
        .replace(/-+/g, "-")
        .trim();

      const uploadDirectory = game.settings.get("ddb-importer", "image-upload-directory").replace(/^\/|\/$/g, "");
      imagePath = await utils.uploadImage(data.avatarUrl, uploadDirectory, filename);
      this.result.character.img = imagePath;
      if (data.frameAvatarUrl && data.frameAvatarUrl !== "") {
        const framePath = await utils.uploadImage(data.frameAvatarUrl, uploadDirectory, `frame-${filename}`);
        this.result.character.flags.ddbimporter["framePath"] = framePath;
      }
    }
  }

  async showErrorMessage(html, error) {
    logger.info("%c #### PLEASE PASTE TO DISCORD #####", "color: #ff0000");
    logger.info("%c #### ", "color: #ff0000");
    logger.info("%c #### --------------- COPY BELOW --------------- #####", "color: #ff0000");
    if (
      this.actor.data.flags.ddbimporter &&
      this.actor.data.flags.ddbimporter.dndbeyond &&
      this.actor.data.flags.ddbimporter.dndbeyond.url
    ) {
      const characterId = this.actor.data.flags.ddbimporter.dndbeyond.url.split("/").pop();
      if (characterId) {
        const jsonUrl = "https://character-service.dndbeyond.com/character/v4/character/" + characterId;
        logger.info("%c **Character JSON          :** " + jsonUrl, "color: #ff0000");
      }
    }
    logger.info(`%c **Foundry version         :** ${game.data.version}`, "color: #ff0000");
    logger.info(`%c **DND5e version           :** ${game.system.data.version}`, "color: #ff0000");
    const moduleVersion = game.modules.get("ddb-importer").data.version;
    logger.info(`%c **ddb-importer version    :** ${moduleVersion}`, "color: #ff0000");
    logger.info(error);
    logger.info("%c #### --------------- COPY ABOVE --------------- #####", "color: #ff0000");
    CharacterImport.showCurrentTask(
      html,
      "I guess you are special!",
      `We had trouble understanding this character. But you can help us to improve!</p>
      <p>Please</p>
      <ul>
        <li>open the console with F12</li>
        <li>search for a block of text starting with <b>#### PLEASE PASTE TO ...</b></li>
        <li>Copy the designated lines and submit it to the Discord channel <a href=">#bugs</a></li></ul> Thanks!`,
      true
    );
  }

  /* -------------------------------------------- */

  getData() {
    const importPolicies = [
      {
        name: "name",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-name"),
        description: "Name",
      },
      {
        name: "class",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-class"),
        description: "Classes",
      },
      {
        name: "feat",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-feat"),
        description: "Features",
      },
      {
        name: "weapon",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-weapon"),
        description: "Weapons",
      },
      {
        name: "equipment",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-equipment"),
        description: "Other Equipment",
      },
      {
        name: "currency",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-currency"),
        description: "Currency",
      },
      {
        name: "spell",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-spell"),
        description: "Spells",
      },
      {
        name: "image",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-image"),
        description: "Image",
      },
      {
        name: "bio",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-bio"),
        description: "Bio",
      },
    ];

    const daeInstalled = utils.isModuleInstalledAndActive("dae");
    const daeSRDInstalled = utils.isModuleInstalledAndActive("Dynamic-Effects-SRD");

    // const importExtras = game.settings.get("ddb-importer", "character-update-policy-import-extras");

    const importConfig = [
      {
        name: "use-inbuilt-icons",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-use-inbuilt-icons"),
        description: "Use icons from the inbuilt dictionary. (High coverage of items, feats, and spells).",
        enabled: true,
      },
      {
        name: "use-srd-icons",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-use-srd-icons"),
        description: "Use icons from the SRD compendium. (This can take a while).",
        enabled: true,
      },
      {
        name: "use-ddb-spell-icons",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-use-ddb-spell-icons"),
        description: "Use spell school icons from D&DBeyond.",
        enabled: true,
      },
      {
        name: "use-ddb-item-icons",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-use-ddb-item-icons"),
        description: "Use equipment icons from D&DBeyond (where they exist).",
        enabled: true,
      },
      {
        name: "use-ddb-generic-item-icons",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-use-ddb-generic-item-icons"),
        description: "Use D&D Beyond generic item type images, if available (final fallback)",
        enabled: true,
      },
      {
        name: "use-full-description",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-use-full-description"),
        description: "For actions use full description and snippets, else use snippets only.",
        enabled: true,
      },
      {
        name: "use-action-and-feature",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-use-action-and-feature"),
        description: "[CAUTION] If a feature is marked as an action, import both the action and the feature. This might lead to some weird behaviour.",
        enabled: true,
      },
    ];

    const updateReady = (((this.actorOriginal || {}).flags || {}).ddbimporter || {}).inPlaceUpdateAvailable;

    const advancedImportConfig = [
      {
        name: "inplace",
        isChecked: updateReady && game.settings.get("ddb-importer", "character-update-policy-inplace"),
        title: "Update Existing Items",
        description:
          "<i>Recommended</i>. Update existing items, rather than deleting and recreating new ones. This will retaining hotbar links for modules like Better Rolls. Matched items won't be replaced by compendium items, to retain a custom item on the sheet mark that item as ignored by ddb-importer in it's settings. If it is greyed out it's not yet available with your existing character data and will be available after your next import.",
        enabled: updateReady,
      },
      {
        name: "use-override",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-use-override"),
        title: "Replace Items using those in your Override compendium",
        description:
          "Use existing items from <i>ddb-import Override compendium</i>, rather than parsing from DDB. This is useful if you want to place customised items into the compendium for use by characters.",
        enabled: true,
      },
      {
        name: "use-existing",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-use-existing"),
        title: "[Caution] Replace Items using ddb-importer compendiums",
        description:
          "Use existing items from <i>ddb-import compendiums</i>, rather than parsing from DDB. This is useful if you have customised the items in the compendium, although you will lose any custom effects applied by this module e.g. Improved Divine Smite. Please consider marking the item you wish to keep as ignored by import instead.",
        enabled: true,
      },
      {
        name: "use-srd",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-use-srd"),
        title: "[Caution] Replace Items using SRD compendiums",
        description:
          "Use the <i>SRD compendiums</i>, rather than DDB. Importing using SRD will not include features like fighting style and divine smite in damage calculations. Please consider marking the item you wish to keep as ignored by import instead.",
        enabled: true,
      },
    ];

    const effectImportConfig = [
      {
        name: "add-item-effects",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-add-item-effects") && daeInstalled,
        title: "Generate Active Effects for Equipment",
        description:
          'Dynamically generate active effects for a characters equipment, please only run this on characters you have backups of, or are happy to reimport from scratch. Bugs to <a href="https://discord.gg/CpRtdK6wYq">Discord #auto-effect-bugs channel.</a> (Requires the DAE module)',
        enabled: daeInstalled,
      },
      {
        name: "add-character-effects",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-add-character-effects") && daeInstalled,
        title: "[Experimental] Generate Active Effects for Character Features/Racial Traits/Feats/Backgrounds",
        description:
          'Dynamically generate active effects for a character. Select the effect generations below, a limited selection are available. Only run this on characters you have backups of, or are happy to reimport from scratch. Bugs to <a href="https://discord.gg/CpRtdK6wYq">Discord #auto-effect-bugs channel.</a> (Requires the DAE module)',
        enabled: daeInstalled,
      },
      {
        name: "generate-ac-armor-effects",
        isChecked:
          game.settings.get("ddb-importer", "character-update-policy-generate-ac-armor-effects") && daeInstalled,
        title: "Generate Active Effects ACs for Armor",
        description:
          "Dynamically add AC values as dynamic effects to armor items, it might be useful to untick this if you wish to use DAE auto calculate AC feature. (Requires the DAE module)",
        enabled: daeInstalled,
      },
      {
        name: "generate-ac-feature-effects",
        isChecked:
          game.settings.get("ddb-importer", "character-update-policy-generate-ac-feature-effects") && daeInstalled,
        title: "Generate Active Effects ACs for Character Features & Racial Traits",
        description:
          "Dynamically add AC values as dynamic effects to items, this might not work as expected for some AC calculations. (Requires the DAE module)",
        enabled: daeInstalled,
      },
      {
        name: "generate-ac-override-effects",
        isChecked:
          game.settings.get("ddb-importer", "character-update-policy-generate-ac-override-effects") && daeInstalled,
        title: "Generate DAE Override ACs",
        description:
          "Dynamically generate possible AC combinations as dynamic effects, these are high priority effects that likely override other effects. Useful if you can't calculate your AC correctly using other effects. (Requires the DAE module)",
        enabled: daeInstalled,
      },
      {
        name: "generate-base-ac",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-generate-base-ac"),
        title: "Set AC to base value",
        description: "Calculate AC base to base value, e.g. 10 +dex mod/natural armor rating.",
        enabled: true,
      },
      {
        name: "dae-effect-copy",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-dae-effect-copy") && daeSRDInstalled,
        title: "Copy Active Effect from DAE Compendiums",
        description:
          "<i>Transfer</i> the <i>Dynamic Active Effects Compendiums</i> effect for matching items/features/spells (requires DAE and SRD module). This may result in odd character AC's, HP etc. especially if the generate options above are unticked. Please try importing the character with this option disabled before logging a bug.",
        enabled: daeInstalled && daeSRDInstalled,
      },
      {
        name: "dae-copy",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-dae-copy") && daeSRDInstalled,
        title: "[Caution] Replace Items using DAE compendiums",
        description:
          "Replace parsed item with <i>Dynamic Active Effects Compendiums</i> for matching items/features/spells (requires DAE and SRD module). This will remove any effects applied directly to your character/not via features/items. This may result in odd character AC's, HP etc. especially if the generate options above are unticked. Please try importing the character with this option disabled before logging a bug.",
        enabled: daeInstalled && daeSRDInstalled,
      },
      {
        name: "active-effect-copy",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-active-effect-copy"),
        title: "Retain Active Effects",
        description: "Retain existing Active Effects, if you're using active effects, you probably want this checked.",
        enabled: true,
      },
    ];

    const effectSelectionConfig = {
      class: [
        {
          name: "effect-class-spell-bonus",
          title: "Spell Bonuses",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-class-spell-bonus"),
          enabled: true,
        },
        {
          name: "effect-class-speed",
          title: "Movement",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-class-speed"),
          enabled: true,
        },
        {
          name: "effect-class-senses",
          title: "Senses",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-class-senses"),
          enabled: true,
        },
        {
          name: "effect-class-hp",
          title: "HP",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-class-hp"),
          enabled: true,
        },
        {
          name: "effect-class-damages",
          title: "Imm/Res/Vuln",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-class-damages"),
          enabled: true,
        },
      ],
      race: [
        {
          name: "effect-race-spell-bonus",
          title: "Spell Bonuses",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-race-spell-bonus"),
          enabled: true,
        },
        {
          name: "effect-race-speed",
          title: "Movement",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-race-speed"),
          enabled: true,
        },
        {
          name: "effect-race-senses",
          title: "Senses",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-race-senses"),
          enabled: true,
        },
        {
          name: "effect-race-hp",
          title: "HP",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-race-hp"),
          enabled: true,
        },
        {
          name: "effect-race-damages",
          title: "Imm/Res/Vuln",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-race-damages"),
          enabled: true,
        },
      ],
      background: [
        {
          name: "effect-background-spell-bonus",
          title: "Spell Bonuses",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-background-spell-bonus"),
          enabled: true,
        },
        {
          name: "effect-background-speed",
          title: "Movement",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-background-speed"),
          enabled: true,
        },
        {
          name: "effect-background-senses",
          title: "Senses",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-background-senses"),
          enabled: true,
        },
        {
          name: "effect-background-hp",
          title: "HP",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-background-hp"),
          enabled: true,
        },
        {
          name: "effect-background-ability-bonus",
          title: "Ability Bonuses",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-background-ability-bonus"),
          enabled: true,
        },
        {
          name: "effect-background-proficiencies",
          title: "Proficiencies",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-background-proficiencies"),
          enabled: true,
        },
        {
          name: "effect-background-languages",
          title: "Languages",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-background-languages"),
          enabled: true,
        },
        {
          name: "effect-background-damages",
          title: "Imm/Res/Vuln",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-background-damages"),
          enabled: true,
        },
      ],
      feat: [
        {
          name: "effect-feat-spell-bonus",
          title: "Spell Bonuses",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-feat-spell-bonus"),
          enabled: true,
        },
        {
          name: "effect-feat-speed",
          title: "Movement",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-feat-speed"),
          enabled: true,
        },
        {
          name: "effect-feat-senses",
          title: "Senses",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-feat-senses"),
          enabled: true,
        },
        {
          name: "effect-feat-hp",
          title: "HP",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-feat-hp"),
          enabled: true,
        },
        {
          name: "effect-feat-ability-bonus",
          title: "Ability Bonuses",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-feat-ability-bonus"),
          enabled: true,
        },
        {
          name: "effect-feat-proficiencies",
          title: "Proficiencies",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-feat-proficiencies"),
          enabled: true,
        },
        {
          name: "effect-feat-languages",
          title: "Languages",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-feat-languages"),
          enabled: true,
        },
        {
          name: "effect-feat-damages",
          title: "Imm/Res/Vuln",
          isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-feat-damages"),
          enabled: true,
        },
      ],
    };

    const syncItemReady = this.actorOriginal.flags.ddbimporter?.syncItemReady;
    const syncActionReady = this.actorOriginal.flags.ddbimporter?.syncActionReady;

    const syncConfig = [
      {
        name: "action-use",
        isChecked: game.settings.get("ddb-importer", "sync-policy-action-use"),
        description: "Action Uses",
        enabled: syncActionReady,
      },
      {
        name: "currency",
        isChecked: game.settings.get("ddb-importer", "sync-policy-currency"),
        description: "Currency",
        enabled: true,
      },
      {
        name: "deathsaves",
        isChecked: game.settings.get("ddb-importer", "sync-policy-deathsaves"),
        description: "Death Saves",
        enabled: true,
      },
      {
        name: "equipment",
        isChecked: game.settings.get("ddb-importer", "sync-policy-equipment"),
        description: "Equipment",
        enabled: syncItemReady,
      },
      {
        name: "condition",
        isChecked: game.settings.get("ddb-importer", "sync-policy-condition"),
        description: "Exhaustion",
        enabled: true,
      },
      {
        name: "hitdice",
        isChecked: game.settings.get("ddb-importer", "sync-policy-hitdice"),
        description: "Hit Dice/Short Rest",
        enabled: true,
      },
      {
        name: "hitpoints",
        isChecked: game.settings.get("ddb-importer", "sync-policy-hitpoints"),
        description: "Hit Points",
        enabled: true,
      },
      {
        name: "inspiration",
        isChecked: game.settings.get("ddb-importer", "sync-policy-inspiration"),
        description: "Inspiration",
        enabled: true,
      },
      {
        name: "spells-prepared",
        isChecked: game.settings.get("ddb-importer", "sync-policy-spells-prepared"),
        description: "Spells Prepared",
        enabled: true,
      },
      {
        name: "spells-slots",
        isChecked: game.settings.get("ddb-importer", "sync-policy-spells-slots"),
        description: "Spell Slots",
        enabled: true,
      },
      {
        name: "spells-sync",
        isChecked: game.settings.get("ddb-importer", "sync-policy-spells-sync"),
        description: "Spells Known",
        enabled: false,
      },
      {
        name: "xp",
        isChecked: game.settings.get("ddb-importer", "sync-policy-xp"),
        description: "XP",
        enabled: true,
      },
    ];

    const extrasConfig = [
      // {
      //   name: "update-existing",
      //   isChecked: game.settings.get("ddb-importer", "munching-policy-update-existing"),
      //   description: "Update existing things.",
      //   enabled: true,
      // },
      // {
      //   name: "use-srd",
      //   isChecked: game.settings.get("ddb-importer", "munching-policy-use-srd"),
      //   description: "Use SRD compendium things instead of importing.",
      //   enabled: true,
      // },
      // {
      //   name: "use-inbuilt-icons",
      //   isChecked: game.settings.get("ddb-importer", "munching-policy-use-inbuilt-icons"),
      //   description: "Use icons from the inbuilt dictionary. (High coverage of items, feats, and spells).",
      //   enabled: true,
      // },
      // {
      //   name: "use-srd-icons",
      //   isChecked: game.settings.get("ddb-importer", "munching-policy-use-srd-icons"),
      //   description: "Use icons from the SRD compendiums.",
      //   enabled: true,
      // },
      // {
      //   name: "use-iconizer",
      //   isChecked: (iconizerInstalled) ? game.settings.get("ddb-importer", "munching-policy-use-iconizer") : false,
      //   description: "Use Iconizer (if installed).",
      //   enabled: iconizerInstalled,
      // },
      // {
      //   name: "download-images",
      //   isChecked: game.settings.get("ddb-importer", "munching-policy-download-images"),
      //   description: "Download D&D Beyond images (takes longer and needs space).",
      //   enabled: true,
      // },
      // {
      //   name: "remote-images",
      //   isChecked: game.settings.get("ddb-importer", "munching-policy-remote-images"),
      //   description: "Use D&D Beyond remote images (a lot quicker)",
      //   enabled: true,
      // },
      // {
      //   name: "use-dae-effects",
      //   isChecked: game.settings.get("ddb-importer", "munching-policy-use-dae-effects"),
      //   description: "Copy effects from DAE (items and spells only). (Requires DAE and SRD module)",
      //   enabled: daeInstalled,
      // },
      // {
      //   name: "hide-description",
      //   isChecked: game.settings.get("ddb-importer", "munching-policy-hide-description"),
      //   description: "Hide description from players?",
      //   enabled: true,
      // },
      // {
      //   name: "monster-items",
      //   isChecked: game.settings.get("ddb-importer", "munching-policy-monster-items"),
      //   description: "[Experimental] Load items from DDB compendium instead of parsing action/attack?",
      //   enabled: true,
      // },
      // {
      //   name: "update-images",
      //   isChecked: game.settings.get("ddb-importer", "munching-policy-update-images"),
      //   description: "Update images on existing items?",
      //   enabled: true,
      // },
      // {
      //   name: "dae-copy",
      //   isChecked: game.settings.get("ddb-importer", "munching-policy-dae-copy"),
      //   description: "Use Dynamic Active Effects Compendiums for matching items/features (requires DAE and SRD module).",
      //   enabled: daeInstalled,
      // },
    ];

    const uploadDir = game.settings.get("ddb-importer", "image-upload-directory");
    const badDirs = ["[data]", "[data] ", "", null];
    const dataDirSet = !badDirs.includes(uploadDir);
    const tier = game.settings.get("ddb-importer", "patreon-tier");
    const tiers = getPatreonTiers(tier);
    const syncEnabled = this.actor.data.flags?.ddbimporter?.dndbeyond?.characterId && tiers.all;

    const trustedUsersOnly = game.settings.get("ddb-importer", "restrict-to-trusted");
    const allowAllSync = game.settings.get("ddb-importer", "allow-all-sync");
    const syncOnly = trustedUsersOnly && allowAllSync && !game.user.isTrusted;

    return {
      actor: this.actor,
      importPolicies: importPolicies,
      importConfig: importConfig,
      extrasConfig: extrasConfig,
      advancedImportConfig: advancedImportConfig,
      effectImportConfig: effectImportConfig,
      effectSelectionConfig: effectSelectionConfig,
      dataDirSet: dataDirSet,
      syncConfig: syncConfig,
      syncEnabled: syncEnabled,
      importAllowed: !syncOnly,
      tiers: tiers,
    };
  }

  /* -------------------------------------------- */

  activateListeners(html) {
    super.activateListeners(html);
    // watch the change of the import-policy-selector checkboxes
    $(html)
      .find(
        [
          '.import-policy input[type="checkbox"]',
          '.advanced-import-config input[type="checkbox"]',
          '.effect-policy input[type="checkbox"]',
          '.effect-import-config input[type="checkbox"]',
          '.extras-import-config input[type="checkbox"]',
          '.import-config input[type="checkbox"]',
        ].join(",")
      )
      .on("change", (event) => {
        game.settings.set(
          "ddb-importer",
          "character-update-policy-" + event.currentTarget.dataset.section,
          event.currentTarget.checked
        );
      });

    $(html)
      .find('.sync-policy input[type="checkbox"]')
      .on("change", (event) => {
        game.settings.set(
          "ddb-importer",
          "sync-policy-" + event.currentTarget.dataset.section,
          event.currentTarget.checked
        );
      });

    $(html)
      .find("#dndbeyond-character-import-start")
      .on("click", async (event) => {
        // retrieve the character data from the proxy
        event.preventDefault();

        try {
          $(html).find("#dndbeyond-character-import-start").prop("disabled", true);
          CharacterImport.showCurrentTask(html, "Getting Character data");
          const characterId = this.actor.data.flags.ddbimporter.dndbeyond.characterId;
          const characterData = await getCharacterData(characterId);
          logger.debug("import.js getCharacterData result", characterData);
          const debugJson = game.settings.get("ddb-importer", "debug-json");
          if (debugJson) {
            download(JSON.stringify(characterData), `${characterId}.json`, "application/json");
          }
          if (characterData.success) {
            // begin parsing the character data
            await this.parseCharacterData(html, characterData);
            CharacterImport.showCurrentTask(html, "Loading Character data", "Done.", false);
            this.close();
          } else {
            CharacterImport.showCurrentTask(html, characterData.message, null, true);
            return false;
          }
        } catch (error) {
          switch (error) {
            case "Forbidden":
              CharacterImport.showCurrentTask(html, "Error retrieving Character: " + error, error, true);
              break;
            default:
              logger.error(error);
              logger.error(error.stack);
              CharacterImport.showCurrentTask(html, "Error parsing Character: " + error, error, true);
              break;
          }
          return false;
        }

        $(html).find("#dndbeyond-character-import-start").prop("disabled", false);
        return true;
      });

    $(html)
      .find("#dndbeyond-character-update")
      .on("click", async () => {
        try {
          $(html).find("#dndbeyond-character-update").prop("disabled", true);
          await updateDDBCharacter(this.actor).then((result) => {
            // result.forEach((r) => {
            //   console.warn(r);
            // });
            const updateNotes = result
              .flat()
              .filter((r) => r !== undefined)
              .map((r) => r.message)
              .join(" ");
            logger.debug(updateNotes);
            CharacterImport.showCurrentTask(html, "Update complete", updateNotes);
            $(html).find("#dndbeyond-character-update").prop("disabled", false);
          });
        } catch (error) {
          logger.error(error);
          logger.error(error.stack);
          CharacterImport.showCurrentTask(html, "Error updating character", error, true);
        }
      });

    $(html)
      .find("#dndbeyond-character-extras-start")
      .on("click", async () => {
        try {
          $(html).find("#dndbeyond-character-extras-start").prop("disabled", true);
          CharacterImport.showCurrentTask(html, "Fetching character data");
          const characterId = this.actor.data.flags.ddbimporter.dndbeyond.characterId;
          const characterData = await getCharacterData(characterId);
          logger.debug("import.js getCharacterData result", characterData);
          const debugJson = game.settings.get("ddb-importer", "debug-json");
          if (debugJson) {
            download(JSON.stringify(characterData), `${characterId}.json`, "application/json");
          }
          if (characterData.success) {
            await characterExtras(html, characterData, this.actor);
            CharacterImport.showCurrentTask(html, "Loading Extras", "Done.", false);
            $(html).find("#dndbeyond-character-extras-start").prop("disabled", true);
            this.close();
          } else {
            CharacterImport.showCurrentTask(html, characterData.message, null, true);
            return false;
          }
        } catch (error) {
          switch (error) {
            case "Forbidden":
              CharacterImport.showCurrentTask(html, "Error retrieving Character: " + error, error, true);
              break;
            default:
              logger.error(error);
              logger.error(error.stack);
              CharacterImport.showCurrentTask(html, "Error parsing Character: " + error, error, true);
              break;
          }
          return false;
        }
        return true;
      });

    $(html)
      .find("input[name=dndbeyond-url]")
      .on("input", async (event) => {
        let URL = event.target.value;
        const characterId = getCharacterId(URL);

        if (characterId) {
          const apiEndpointUrl = getCharacterAPIEndpoint(characterId);
          $(html)
            .find(".dndbeyond-url-status i")
            .replaceWith('<i class="fas fa-check-circle" style="color: green"></i>');
          $(html).find("span.dndbeyond-character-id").text(characterId);
          $(html).find("#dndbeyond-character-import-start").prop("disabled", false);
          $(html).find("#open-dndbeyond-url").prop("disabled", false);

          CharacterImport.showCurrentTask(html, "Saving reference");
          await this.actor.update({
            flags: {
              ddbimporter: {
                dndbeyond: {
                  url: URL,
                  apiEndpointUrl: apiEndpointUrl,
                  characterId: characterId,
                },
              },
            },
          });
          CharacterImport.showCurrentTask(html, "Status");
        } else {
          CharacterImport.showCurrentTask(
            html,
            "URL format incorrect",
            "That seems not to be the URL we expected...",
            true
          );
          $(html)
            .find(".dndbeyond-url-status i")
            .replaceWith('<i class="fas fa-exclamation-triangle" style="color:red"></i>');
        }
      });

    $(html)
      .find("#open-dndbeyond-url")
      .on("click", () => {
        try {
          const characterId = this.actor.data.flags.ddbimporter.dndbeyond.characterId;
          const apiEndpointUrl = getCharacterAPIEndpoint(characterId);
          renderPopup("json", apiEndpointUrl);
        } catch (error) {
          CharacterImport.showCurrentTask(html, "Error opening JSON URL", error, true);
        }
      });
  }

  async enrichCharacterItems(html, items) {
    const useInbuiltIcons = game.settings.get("ddb-importer", "character-update-policy-use-inbuilt-icons");
    const useSRDCompendiumItems = game.settings.get("ddb-importer", "character-update-policy-use-srd");
    const useSRDCompendiumIcons = game.settings.get("ddb-importer", "character-update-policy-use-srd-icons");
    const ddbSpellIcons = game.settings.get("ddb-importer", "character-update-policy-use-ddb-spell-icons");
    const ddbItemIcons = game.settings.get("ddb-importer", "character-update-policy-use-ddb-item-icons");
    const ddbGenericItemIcons = game.settings.get("ddb-importer", "character-update-policy-use-ddb-generic-item-icons");
    const activeEffectCopy = game.settings.get("ddb-importer", "character-update-policy-active-effect-copy");
    const daeEffectCopy = game.settings.get("ddb-importer", "character-update-policy-dae-effect-copy");
    const daeSRDInstalled = utils.isModuleInstalledAndActive("Dynamic-Effects-SRD");
    const daeInstalled = utils.isModuleInstalledAndActive("dae");
    const addItemEffects = game.settings.get("ddb-importer", "character-update-policy-add-item-effects");
    const addItemACEffects = game.settings.get("ddb-importer", "character-update-policy-generate-ac-armor-effects");
    const addCharacterEffects = game.settings.get("ddb-importer", "character-update-policy-add-character-effects");

    // if we still have items to add, add them
    if (items.length > 0) {
      CharacterImport.showCurrentTask(html, "Copying existing data flags");
      await this.copySupportedCharacterItemFlags(items);

      if (ddbItemIcons) {
        CharacterImport.showCurrentTask(html, "Fetching DDB Inventory Images");
        items = await getDDBEquipmentIcons(items, true);
      }

      if (useInbuiltIcons) {
        CharacterImport.showCurrentTask(html, "Adding SRD Icons");
        items = await copyInbuiltIcons(items);
      }

      if (useSRDCompendiumIcons && !useSRDCompendiumItems) {
        CharacterImport.showCurrentTask(html, "Adding SRD Icons");
        items = await copySRDIcons(items);
      }

      if (ddbSpellIcons) {
        CharacterImport.showCurrentTask(html, "Fetching DDB Spell School Images");
        items = await getDDBSpellSchoolIcons(items, true);
      }

      if (ddbGenericItemIcons) {
        CharacterImport.showCurrentTask(html, "Fetching DDB Generic Item Images");
        items = await getDDBGenericItemIcons(items, true);
      }

      if (activeEffectCopy) {
        CharacterImport.showCurrentTask(html, "Copying Item Active Effects");
        items = await this.copyCharacterItemEffects(items);
      }

      if (daeEffectCopy && daeInstalled && daeSRDInstalled) {
        CharacterImport.showCurrentTask(html, "Importing DAE Effects");
        items = await addItemsDAESRD(items);
      }

      if (daeInstalled && (addItemEffects || addItemACEffects || addCharacterEffects)) {
        items = addItemEffectIcons(items);
      }
    }

    items = items.map((item) => {
      if (!item.effects) item.effects = [];
      return item;
    });

    return Promise.all(items);
  }

  async importCharacterItems(html, items) {
    if (items.length > 0) {
      items = await this.enrichCharacterItems(html, items);
      CharacterImport.showCurrentTask(html, "Adding items to character");
      logger.debug("Adding the following items:", items);
      const options = DISABLE_FOUNDRY_UPGRADE;
      // DISABLE_FOUNDRY_UPGRADE["keepId"] = true;
      await this.actor.createEmbeddedDocuments("Item", items, options);
      // for (const item of items) {
      //   logger.debug(`Creating ${item.name}`);
      //   // eslint-disable-next-line no-await-in-loop
      //   await this.actor.createEmbeddedDocuments("Item", [item], options);
      // }
    }
  }

  // returns items not updated
  async updateExistingIdMatchedItems(html, items) {
    if (this.actorOriginal.flags.ddbimporter && this.actorOriginal.flags.ddbimporter.inPlaceUpdateAvailable) {
      const ownedItems = this.actor.getEmbeddedCollection("Item");

      let nonMatchedItems = [];
      let matchedItems = [];

      await items.forEach((item) => {
        let matchedItem = ownedItems.find(
          (owned) =>
            item.name === owned.data.name &&
            item.type === owned.data.type &&
            item.flags?.ddbimporter?.id === owned.data.flags?.ddbimporter?.id
        );
        if (matchedItem) {
          if (!matchedItem.data.flags.ddbimporter?.ignoreItemImport) {
            item["_id"] = matchedItem["id"];
            if (matchedItem.data.flags.ddbimporter?.ignoreIcon) item.flags.ddbimporter.matchedImg = matchedItem.data.img;
            if (matchedItem.data.flags.ddbimporter?.retainResourceConsumption) item.data.consume = matchedItem.data.data.consume;
            // update effect ids
            if (matchedItem.data.toObject().effects?.length > 0 && item.effects?.length === 0) {
              item.effects = [];
            } else if (item.effects?.length >= 0) {
              item.effects = item.effects.map((ae) => {
                const matchedEffect = matchedItem.effects.find(
                  (me) =>
                    me.data.flags?.ddbimporter?.itemId &&
                    ae.flags?.ddbimporter?.itemId &&
                    me.data.flags.ddbimporter.itemId === ae.flags.ddbimporter.itemId
                );
                if (matchedEffect) {
                  ae.origin = matchedEffect.data.origin;
                  ae._id = matchedEffect.id;
                }
                return ae;
              });
            }

            matchedItems.push(item);
          }
        } else {
          nonMatchedItems.push(item);
        }
      });

      // enrich matched items
      let enrichedItems = await this.enrichCharacterItems(html, matchedItems);

      // ensure excluded icons are retained
      enrichedItems = enrichedItems.map((item) => {
        if (item.flags.ddbimporter?.matchedImg) item.img = item.flags.ddbimporter.matchedImg;
        return item;
      });

      const addEffects =
        game.settings.get("ddb-importer", "character-update-policy-add-item-effects") ||
        game.settings.get("ddb-importer", "character-update-policy-add-character-effects");

      // there is some kind of race condition when updating more than a
      // couple of items with AE on them, so need to add individually
      logger.debug("Updating items:", enrichedItems);
      if (addEffects) {
        logger.debug("Single item update");
        for (const item of enrichedItems) {
          logger.debug(`Updating ${item.name}`);
          // eslint-disable-next-line no-await-in-loop
          await this.actor.updateEmbeddedDocuments("Item", [item], DISABLE_FOUNDRY_UPGRADE);
        }
      } else {
        logger.debug("Bulk update");
        await this.actor.updateEmbeddedDocuments("Item", enrichedItems, DISABLE_FOUNDRY_UPGRADE);
      }

      logger.debug("Finished updating items");
      return [nonMatchedItems, enrichedItems];
    } else {
      return [items, []];
    }
  }

  async processCharacterItems(html) {
    // is magicitems installed
    const magicItemsInstalled = utils.isModuleInstalledAndActive("magicitems");
    // items for actor
    let items = [];
    // attempt to update existing items
    const updateExistingItems = game.settings.get("ddb-importer", "character-update-policy-inplace");
    const updateReady = this.actorOriginal?.flags?.ddbimporter?.inPlaceUpdateAvailable;

    // store all spells in the folder specific for Dynamic Items
    if (magicItemsInstalled && this.result.itemSpells && Array.isArray(this.result.itemSpells)) {
      CharacterImport.showCurrentTask(html, "Preparing magicitem spells");
      await addMagicItemSpells(this.result);
    }

    if (updateExistingItems && updateReady) {
      logger.debug("Loading items for update");
      items = filterItemsByUserSelection(this.result, FILTER_SECTIONS);
      CharacterImport.showCurrentTask(html, "Attempting existing item update");
      let [newItems, updatedItems] = await this.updateExistingIdMatchedItems(html, items);
      items = newItems;
      CharacterImport.showCurrentTask(html, "Clearing remaining items for re-creation");
      logger.debug("Removing updated items from update list...");
      await this.clearItemsByUserSelection(updatedItems);
      logger.debug("Items remaining for creation:", newItems);
    } else {
      logger.debug("Determining items to recreate...");
      CharacterImport.showCurrentTask(html, "Clearing items");
      await this.clearItemsByUserSelection();
    }

    if (!updateExistingItems || !updateReady) {
      logger.debug("Non-update item load");
      items = filterItemsByUserSelection(this.result, FILTER_SECTIONS);
    }

    // If there is no magicitems module fall back to importing the magic
    // item spells as normal spells fo the character
    if (!magicItemsInstalled) {
      items.push(
        this.result.itemSpells.filter((item) => {
          const active = item.flags.ddbimporter.dndbeyond && item.flags.ddbimporter.dndbeyond.active === true;
          if (!active) logger.warn(`Missing active flag on item spell ${item.name}`);
          return active;
        })
      );
      items = items.flat();
    }

    let compendiumItems = [];
    let srdCompendiumItems = [];
    let overrideCompendiumItems = [];
    const useExistingCompendiumItems = game.settings.get("ddb-importer", "character-update-policy-use-existing");
    const useSRDCompendiumItems = game.settings.get("ddb-importer", "character-update-policy-use-srd");
    const useOverrideCompendiumItems = game.settings.get("ddb-importer", "character-update-policy-use-override");

    /**
     * First choice is override compendium
     */
    if (useOverrideCompendiumItems) {
      logger.info("Removing matching Override compendium items");
      const compendiumOverrideItems = await getCompendiumItems(items, "custom");
      overrideCompendiumItems = compendiumOverrideItems;
      // removed existing items from those to be imported
      items = await CharacterImport.removeItems(items, overrideCompendiumItems);
    }
    /**
     * If SRD is selected, we prefer this
     */
    if (useSRDCompendiumItems) {
      logger.info("Removing compendium items");
      const compendiumFeatureItems = await getSRDCompendiumItems(items, "features");
      const compendiumInventoryItems = await getSRDCompendiumItems(items, "inventory");
      const compendiumSpellItems = await getSRDCompendiumItems(items, "spells");

      srdCompendiumItems = compendiumItems.concat(
        compendiumInventoryItems,
        compendiumSpellItems,
        compendiumFeatureItems
      );
      // removed existing items from those to be imported
      items = await CharacterImport.removeItems(items, srdCompendiumItems);
    }

    if (useExistingCompendiumItems) {
      logger.info("Removing compendium items");
      const compendiumFeatureItems = await getCompendiumItems(items, "features");
      const compendiumInventoryItems = await getCompendiumItems(items, "inventory");
      const compendiumSpellItems = await getCompendiumItems(items, "spells");

      compendiumItems = compendiumItems.concat(compendiumInventoryItems, compendiumSpellItems, compendiumFeatureItems);
      // removed existing items from those to be imported
      items = await CharacterImport.removeItems(items, compendiumItems);
    }

    // import remaining items to character
    if (items.length > 0) {
      logger.debug(`Importing new items`, items);
      await this.importCharacterItems(html, items);
    }

    // now import any compendium items that we matched
    if (useExistingCompendiumItems) {
      CharacterImport.showCurrentTask(html, "Importing DDB compendium items");
      logger.info("Importing compendium items:", compendiumItems);
      await this.actor.createEmbeddedDocuments("Item", compendiumItems, DISABLE_FOUNDRY_UPGRADE);
    }

    if (useSRDCompendiumItems) {
      CharacterImport.showCurrentTask(html, "Importing SRD compendium items");
      logger.info("Importing SRD compendium items:", srdCompendiumItems);
      await this.actor.createEmbeddedDocuments("Item", srdCompendiumItems, DISABLE_FOUNDRY_UPGRADE);
    }

    if (useOverrideCompendiumItems) {
      CharacterImport.showCurrentTask(html, "Importing Override compendium items");
      logger.info("Importing Override compendium items:", overrideCompendiumItems);
      await this.actor.createEmbeddedDocuments("Item", overrideCompendiumItems, DISABLE_FOUNDRY_UPGRADE);
    }

    logger.debug("Finished importing items");
  }

  async removeActiveEffects(activeEffectCopy) {
    // remove current active effects
    const excludedItems = filterActorItemsByUserSelection(this.actorOriginal, true);
    const ignoredItemIds = this.actorOriginal.items
      .filter(
        (item) =>
          item.effects &&
          item.effects.length > 0 &&
          (item.flags.ddbimporter?.ignoreItemImport || excludedItems.some((ei) => ei._id === item._id))
      )
      .map((item) => item._id);

    const itemEffects = this.actor.effects.filter(
      (ae) => ae.data.origin?.includes(".Item.") && !ignoredItemIds.includes(ae.data.origin?.split(".").slice(-1)[0])
    );
    const ignoredEffects = this.actor.effects.filter(
      (ae) =>
        // is this an ignored item
        ignoredItemIds.includes(ae.data.origin?.split(".").slice(-1)[0]) ||
        // is this a core status effect (CUB)
        ae.data.flags?.core?.statusId
    );
    const charEffects = this.actor.effects.filter(
      (ae) => !ae.data.origin?.includes(".Item.") && !ae.data.flags.ddbimporter?.characterEffect
    );
    const ddbGeneratedCharEffects = this.actor.effects.filter(
      (ae) => !ae.data.origin?.includes(".Item.") && ae.data.flags.ddbimporter?.characterEffect
    );

    // console.warn(JSON.parse(JSON.stringify(this.actor)));
    // console.log(itemEffects.map((ae) => ae.id));

    // remove existing active item effects
    await this.actor.deleteEmbeddedDocuments(
      "ActiveEffect",
      itemEffects.map((ae) => ae.id)
    );
    // console.warn(JSON.parse(JSON.stringify(this.actor)));
    // console.log(ddbGeneratedCharEffects.map((ae) => ae.id));
    // clear down ddb generated character effects such as skill bonuses
    await this.actor.deleteEmbeddedDocuments(
      "ActiveEffect",
      ddbGeneratedCharEffects.map((ae) => ae.id)
    );

    if (game.settings.get("ddb-importer", "character-update-policy-generate-ac-override-effects")) {
      const acEffects = this.result.character.flags.ddbimporter.acEffects.map((ae) => {
        ae.origin = `Actor.${this.actor.id}`;
        return ae;
      });
      this.result.character.effects = this.result.character.effects.concat(acEffects);
    }

    if (game.settings.get("ddb-importer", "character-update-policy-generate-base-ac")) {
      // console.warn(this.result.character.data.attributes.ac);
      // console.warn(this.result.character.flags.ddbimporter.baseAC);
      this.result.character.data.attributes.ac.value = this.result.character.flags.ddbimporter.baseAC;
    }

    // are we trying to retain existing effects?
    if (activeEffectCopy) {
      // add retained character effects to result
      this.result.character.effects = this.result.character.effects.concat(charEffects, ignoredEffects);
    } else {
      // if not retaining effects remove character effects
      // console.warn(JSON.parse(JSON.stringify(this.actor)));
      // console.log(charEffects.map((ae) => ae.id));

      await this.actor.deleteEmbeddedDocuments(
        "ActiveEffect",
        charEffects.map((ae) => ae.id)
      );
      this.result.character.effects = this.result.character.effects.concat(ignoredEffects);
    }
    // console.warn(JSON.parse(JSON.stringify(this.actor)));

  }

  fixUpCharacterEffects(character) {
    let abilityOverrides = abilityOverrideEffects(character.flags.ddbimporter.dndbeyond.abilityOverrides);
    if (abilityOverrides.changes.length > 0) {
      character.effects = character.effects.concat(abilityOverrides);
    }

    character.effects.forEach((effect) => {
      const origins = [
        "Ability.Override",
        "AC",
        `Actor.${this.actor.data.flags.ddbimporter.dndbeyond.characterId}`,
      ];
      if (origins.includes(effect.origin)) {
        effect.origin = `Actor.${this.actor.id}`;
      }
    });
  }

  async parseCharacterData(html, data) {
    this.result = data.character;

    logger.debug("Current Actor:", this.actorOriginal);

    // console.warn(JSON.parse(JSON.stringify(this.actor)));
    // handle active effects
    const activeEffectCopy = game.settings.get("ddb-importer", "character-update-policy-active-effect-copy");
    CharacterImport.showCurrentTask(html, "Calculating Active Effect Changes");
    this.fixUpCharacterEffects(this.result.character);
    await this.removeActiveEffects(activeEffectCopy);

    // console.warn(JSON.parse(JSON.stringify(this.actor)));
    // console.warn(JSON.parse(JSON.stringify(this.result.character)));

    // update image
    await this.updateImage(html, data.ddb);

    // manage updates of basic character data more intelligently
    if (!game.settings.get("ddb-importer", "character-update-policy-currency")) {
      // revert currency if user didn't select to update it
      this.result.character.data.currency = this.actorOriginal.data.currency;
    }
    if (!game.settings.get("ddb-importer", "character-update-policy-bio")) {
      // revert bio info
      const bioUpdates = ["alignment", "appearance", "background", "biography", "bond", "flaw", "idea", "trait"];
      bioUpdates.forEach((option) => {
        this.result.character.data.details[option] = this.actorOriginal.data.details[option];
      });
    }

    // flag as having items ids
    this.result.character.flags.ddbimporter["inPlaceUpdateAvailable"] = true;
    this.result.character.flags.ddbimporter["syncItemReady"] = true;
    this.result.character.flags.ddbimporter["syncActionReady"] = true;

    // basic import
    CharacterImport.showCurrentTask(html, "Updating core character information");
    logger.debug("Character data importing: ", this.result.character);
    await this.actor.update(this.result.character);

    // console.warn(JSON.parse(JSON.stringify(this.actor)));
    // copy existing journal notes
    this.copyExistingJournalNotes();

    // items import
    await this.processCharacterItems(html);

    // console.warn(JSON.parse(JSON.stringify(this.actor)));

    // copy items whole from DAE
    const daeCopy = game.settings.get("ddb-importer", "character-update-policy-dae-copy");
    const daeInstalled =
      utils.isModuleInstalledAndActive("dae") && utils.isModuleInstalledAndActive("Dynamic-Effects-SRD");
    if (daeCopy && daeInstalled) {
      CharacterImport.showCurrentTask(html, "Importing DAE SRD");
      await migrateActorDAESRD(this.actor);
    }

    if (activeEffectCopy) {
      // find effects with a matching name that existed on previous actor
      // and that have a different active state and activate them
      const targetEffects = this.actor.data.effects.filter((ae) => {
        const previousEffectDiff = this.actorOriginal.effects.find(
          (oae) => oae.label === ae.label && oae.disabled !== ae.disabled
        );
        if (previousEffectDiff) return true;
        return false;
      });
      targetEffects.forEach((ae) => {
        this.actor.updateEmbeddedDocument("ActiveEffect", { _id: ae._id, disabled: !ae.disabled });
      });
    }

    // this.actor.prepareDerivedData();
    // this.actor.prepareEmbeddedEntities();
    // this.actor.applyActiveEffects();
    this.actor.render();
  }
}
