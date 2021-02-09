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
} from "../muncher/import.js";
import { getCharacterOptions } from "./options.js";
import { download, getCampaignId, getPatreonTiers } from "../muncher/utils.js";
import {
  migrateActorDAESRD,
  addItemsDAESRD
} from "../muncher/dae.js";
import { copyInbuiltIcons } from "../icons/index.js";
import { updateDDBCharacter } from "./update.js";
import { characterExtras } from "./extras.js";

const EQUIPMENT_TYPES = ["equipment", "consumable", "tool", "loot", "backpack"];
const FILTER_SECTIONS = ["classes", "features", "actions", "inventory", "spells"];

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
      itemTypes = itemTypes.concat(EQUIPMENT_TYPES);
    if (!game.settings.get("ddb-importer", "character-update-policy-spell")) itemTypes.push("spell");
  } else {
    if (game.settings.get("ddb-importer", "character-update-policy-class")) itemTypes.push("class");
    if (game.settings.get("ddb-importer", "character-update-policy-feat")) itemTypes.push("feat");
    if (game.settings.get("ddb-importer", "character-update-policy-weapon")) itemTypes.push("weapon");
    if (game.settings.get("ddb-importer", "character-update-policy-equipment"))
      itemTypes = itemTypes.concat(EQUIPMENT_TYPES);
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
    items = items.concat(result[section]).filter((item) =>
      validItemTypes.includes(item.type)
    );
  }
  return items;
};


const filterActorItemsByUserSelection = (actor, invert = false) => {
  const validItemTypes = getCharacterUpdatePolicyTypes(invert);

  const items = actor.items.filter((item) =>
    validItemTypes.includes(item.type)
  );

  return items;
};


/**
 * Loads and parses character in the proxy
 * @param {*} characterId
 */

export async function getCharacterData(characterId, syncId) {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const campaignId = getCampaignId();
  const proxyCampaignId = campaignId === "" ? null : campaignId;
  let body = { cobalt: cobaltCookie, betaKey: betaKey, characterId: characterId, campaignId: proxyCampaignId };
  if (syncId) {
    body['updateId'] = syncId;
  }

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/character`, {
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
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          resolve(data);
        }
        return data;
      })
      .then((data) => {
        if (data.classOptions) {
          return data;
        } else {
          return getCharacterOptions(data.ddb).then((classOptions) => {
            data.classOptions = classOptions;
            return data;
          });
        }
      })
      .then((data) => {
        // construct the expected { character: {...} } object
        let ddb = data.ddb.character === undefined ? { character: data.ddb } : data.ddb;
        ddb.classOptions = data.classOptions;
        try {
          const character = parseJson(ddb);
          data["character"] = character;
          return data;
        } catch (error) {
          const debugJson = game.settings.get("ddb-importer", "debug-json");
          if (debugJson) {
            download(JSON.stringify(data), `${characterId}-raw.json`, "application/json");
          }
          throw error;
        }
      })
      .then((data) => resolve(data))
      .catch((error) => {
        logger.error("JSON Fetch and Parse Error");
        logger.error(error);
        logger.error(error.stack);
        reject(error);
      });
  });
}

export default class CharacterImport extends FormApplication {
  constructor(options, actor) {
    super(options);
    this.actor = game.actors.entities.find((a) => a.id === actor._id);
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
    options.template = "modules/ddb-importer/handlebars/character.handlebars";
    options.width = 800;
    options.height = 'auto';
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
              utils.log(`Copying Effects for ${originalItem.name}`);
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
              const originalNameMatch = (originalNameFlag) ? originalItem.flags.ddbimporter.originalItemName === item.name : false;
              const nameMatch = item.name === originalItem.name || originalNameMatch;
              return nameMatch && item.type === originalItem.type;
            })
        )
      );
    });
  }

  async importItems(items) {
    return new Promise((resolve) => {
      resolve(this.actor.createEmbeddedEntity("OwnedItem", items, { displaySheet: false }));
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
    const ownedItems = this.actor.getEmbeddedCollection("OwnedItem");
    const toRemove = ownedItems
      .filter((item) =>
        includedItems.includes(item.type) &&
        !excludedList.some((excluded) => excluded._id === item._id)
      )
      .filter((item) => !item.flags.ddbimporter?.ignoreItemImport)
      .map((item) => item._id);

    if (toRemove.length > 0) await this.actor.deleteEmbeddedEntity("OwnedItem", toRemove);
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
    logger.info("%c #### PLEASE PASTE TO https://discord.gg/YEnjUHd #####", "color: #ff0000");
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
        <li>Copy the designated lines and submit it to the Discord channel <a href='https://discord.gg/YEnjUHd'>#parsing-errors</a></li></ul> Thanks!`,
      true
    );
  }

  /* -------------------------------------------- */

  getData() {
    const importPolicies = [
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
    ];

    const daeInstalled =
      utils.isModuleInstalledAndActive("dae") && utils.isModuleInstalledAndActive("Dynamic-Effects-SRD");

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
      }
    ];

    const updateReady = (((this.actorOriginal || {}).flags || {}).ddbimporter || {}).inPlaceUpdateAvailable;

    const advancedImportConfig = [
      {
        name: "inplace",
        isChecked: updateReady && game.settings.get("ddb-importer", "character-update-policy-inplace"),
        title: "Update Existing Items",
        description: "<i>Recommended</i>. Update existing items, rather than deleting and recreating new ones. This will retaining hotbar links for modules like Better Rolls. Matched items won't be replaced by compendium items, to retain a custom item on the sheet mark that item as ignored by ddb-importer in it's settings. If it is greyed out it's not yet available with your existing character data and will be available after your next import.",
        enabled: updateReady,
      },
      {
        name: "new",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-new"),
        title: "[Deprecated] Import new items only",
        description: "Doesn't delete or update existing items in Foundry. If this is checked features managed by the Class such as levels and spell progression won't be updated. Attributes such as HP, AC, stats, speeds, skills and special traits are always updated. Please consider marking the item you wish to keep as ignored by import instead.",
        enabled: true,
      },
      {
        name: "use-existing",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-use-existing"),
        title: "[Caution] Replace Items using ddb-importer compendiums",
        description: "Use existing items from <i>ddb-import compendiums</i>, rather than parsing from DDB. This is useful if you have customised the items in the compendium, although you will lose any custom effects applied by this module e.g. Improved Divine Smite. Please consider marking the item you wish to keep as ignored by import instead.",
        enabled: true,
      },
      {
        name: "use-srd",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-use-srd"),
        title: "[Caution] Replace Items using SRD compendiums",
        description: "Use the <i>SRD compendiums</i>, rather than DDB. Importing using SRD will not include features like fighting style and divine smite in damage calculations. Please consider marking the item you wish to keep as ignored by import instead.",
        enabled: true,
      },
      {
        name: "dae-effect-copy",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-dae-effect-copy"),
        title: "Copy Active Effect from DAE Compendiums",
        description: "<i>Transfer</i> the <i>Dynamic Active Effects Compendiums</i> effect for matching items/features/spells (requires DAE and SRD module).",
        enabled: daeInstalled,
      },
      {
        name: "dae-copy",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-dae-copy"),
        title: "[Caution] Replace Items using DAE compendiums",
        description: "Replace parsed item with <i>Dynamic Active Effects Compendiums</i> for matching items/features/spells (requires DAE and SRD module). This will remove any effects applied directly to your character/not via features/items.",
        enabled: daeInstalled,
      },
      {
        name: "active-effect-copy",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-active-effect-copy"),
        title: "Retain Active Effects",
        description: "Retain existing Active Effects, if you're using active effects, you probably want this checked.",
        enabled: true,
      },
    ];

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
    const syncEnabled = this.actor.data.flags?.ddbimporter?.dndbeyond?.characterId && tiers.supporter;

    const trustedUsersOnly = game.settings.get("ddb-importer", "restrict-to-trusted");
    const allowAllSync = game.settings.get("ddb-importer", "allow-all-sync");
    const syncOnly = trustedUsersOnly && allowAllSync && !game.user.isTrusted;

    return {
      actor: this.actor,
      importPolicies: importPolicies,
      importConfig: importConfig,
      extrasConfig: extrasConfig,
      advancedImportConfig: advancedImportConfig,
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
      .find('.import-policy input[type="checkbox"]')
      .on("change", (event) => {
        game.settings.set(
          "ddb-importer",
          "character-update-policy-" + event.currentTarget.dataset.section,
          event.currentTarget.checked
        );
      });

    $(html)
      .find('.import-config input[type="checkbox"]')
      .on("change", (event) => {
        game.settings.set(
          "ddb-importer",
          "character-update-policy-" + event.currentTarget.dataset.section,
          event.currentTarget.checked
        );
      });

    $(html)
      .find('.advanced-import-config input[type="checkbox"]')
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
            const updateNotes = result.flat().filter((r) => r !== undefined).map((r) => r.message).join(" ");
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
      .on("click", async() => {
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
    const daeInstalled = utils.isModuleInstalledAndActive("dae") && utils.isModuleInstalledAndActive("Dynamic-Effects-SRD");

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

      if (daeEffectCopy && daeInstalled) {
        CharacterImport.showCurrentTask(html, "Importing DAE Effects");
        items = await addItemsDAESRD(items);
      }

    }
    return Promise.all(items);
  }

  async importCharacterItems(html, items) {
    if (items.length > 0) {
      items = await this.enrichCharacterItems(html, items);
      CharacterImport.showCurrentTask(html, "Adding items to character");
      await this.importItems(items);
    }
  }

  // returns items not updated
  async updateExistingIdMatchedItems(html, items) {
    if (this.actorOriginal.flags.ddbimporter && this.actorOriginal.flags.ddbimporter.inPlaceUpdateAvailable) {
      const ownedItems = this.actor.getEmbeddedCollection("OwnedItem");

      let nonMatchedItems = [];
      let matchedItems = [];

      await items.forEach((item) => {
        let matchedItem = ownedItems
          .find((owned) =>
            item.name === owned.name &&
            item.type === owned.type &&
            item.flags?.ddbimporter?.id === owned.flags?.ddbimporter?.id
          );
        if (matchedItem) {
          if (!matchedItem.flags.ddbimporter?.ignoreItemImport) {
            item['_id'] = matchedItem['_id'];
            if (matchedItem.effects?.length > 0 && item.effects?.length === 0) item.effects = matchedItem.effects;
            if (matchedItem.flags.ddbimporter?.ignoreIcon) item.flags.ddbimporter.matchedImg = matchedItem.img;
            if (matchedItem.flags.ddbimporter?.retainResourceConsumption) item.data.consume = matchedItem.data.consume;

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

      await this.actor.updateEmbeddedEntity("OwnedItem", enrichedItems);

      return new Promise((resolve) => {
        resolve([nonMatchedItems, enrichedItems]);
      });
    } else {
      return new Promise((resolve) => {
        resolve(items);
      });
    }
  }

  async processCharacterItems(html) {
    // is magicitems installed
    const magicItemsInstalled = utils.isModuleInstalledAndActive("magicitems");
    // items for actor
    let items = [];
    // should we try and keep existing actor items?
    const importKeepExistingActorItems = game.settings.get("ddb-importer", "character-update-policy-new");
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
      await this.clearItemsByUserSelection(updatedItems);
    } else if (!importKeepExistingActorItems) {
      logger.debug("Clearing items");
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

    if (importKeepExistingActorItems) {
      // removed existing items from those to be imported
      items = await CharacterImport.removeItems(items, this.actorOriginal.items);
    }

    let compendiumItems = [];
    let srdCompendiumItems = [];
    const useExistingCompendiumItems = game.settings.get("ddb-importer", "character-update-policy-use-existing");
    const useSRDCompendiumItems = game.settings.get("ddb-importer", "character-update-policy-use-srd");

    /**
     * If SRD is selected, we prefer this
     */
    if (useSRDCompendiumItems) {
      utils.log("Removing compendium items");
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
    await this.importCharacterItems(html, items);

    // now import any compendium items that we matched
    if (useExistingCompendiumItems) {
      CharacterImport.showCurrentTask(html, "Importing compendium items");
      logger.info("Importing compendium items");
      await this.importItems(compendiumItems);
    }

    if (useSRDCompendiumItems) {
      CharacterImport.showCurrentTask(html, "Importing SRD compendium items");
      logger.info("Importing SRD compendium items");
      await this.importItems(srdCompendiumItems);
    }
  }

  async removeActiveEffects(activeEffectCopy) {
    // remove current active effects
    const excludedItems = filterActorItemsByUserSelection(this.actorOriginal, true);
    const ignoredItemIds = this.actorOriginal.items.filter((item) =>
      item.effects && item.effects.length > 0 &&
      (item.flags.ddbimporter?.ignoreItemImport || excludedItems.some((ei) => ei._id === item._id))
    ).map((item) => item._id);
    // `Actor.${this.actorOriginal._id}.OwnedItem.${item._id}`

    const itemEffects = this.actor.data.effects.filter((ae) =>
      ae.origin?.includes('OwnedItem') &&
      !ignoredItemIds.includes(ae.origin?.split('.').slice(-1)[0])
    );
    const ignoredEffects = this.actor.data.effects.filter((ae) =>
      // is this and ignored item
      ignoredItemIds.includes(ae.origin?.split('.').slice(-1)[0]) ||
      // is this a core status effect (CUB)
      ae.flags?.core?.statusId
    );
    const charEffects = this.actor.data.effects.filter((ae) => !ae.origin?.includes('OwnedItem'));

    // always remove existing active item effects
    await this.actor.deleteEmbeddedEntity("ActiveEffect", itemEffects.map((ae) => ae._id));

    // are we trying to retain existing effects?
    if (activeEffectCopy) {
      // add retained character effects to result
      this.result.character.effects = charEffects.concat(ignoredEffects);
    } else {
      // if not retaining effects remove character effects
      await this.actor.deleteEmbeddedEntity("ActiveEffect", charEffects.map((ae) => ae._id));
      this.result.character.effects = ignoredEffects;
    }
  }

  async parseCharacterData(html, data) {
    this.result = data.character;

    logger.debug("Current Actor:", this.actorOriginal);

    // handle active effects
    const activeEffectCopy = game.settings.get("ddb-importer", "character-update-policy-active-effect-copy");
    CharacterImport.showCurrentTask(html, "Calculating Active Effect Changes");
    await this.removeActiveEffects(activeEffectCopy);

    // update image
    await this.updateImage(html, data.ddb);

    // manage updates of basic character data more intelligently
    if (!game.settings.get("ddb-importer", "character-update-policy-currency")) {
      // revert currency if user didn't select to update it
      this.result.character.data.currency = this.actorOriginal.data.currency;
    }

    // flag as having items ids
    this.result.character.flags.ddbimporter['inPlaceUpdateAvailable'] = true;
    this.result.character.flags.ddbimporter['syncItemReady'] = true;
    this.result.character.flags.ddbimporter['syncActionReady'] = true;

    // basic import
    CharacterImport.showCurrentTask(html, "Updating core character information");
    logger.debug("Character data importing: ", this.result.character);
    await this.actor.update(this.result.character);

    // copy existing journal notes
    this.copyExistingJournalNotes();

    // items import
    await this.processCharacterItems(html);

    // We loop back over the spell slots to update them to our computed
    // available value as per DDB.
    let actorUpdates = [];
    CharacterImport.showCurrentTask(html, "Updating spell slots");
    for (const [type, info] of Object.entries(this.result.character.data.spells)) {
      actorUpdates.push(
        this.actor.update({
          [`data.spells.${type}.value`]: parseInt(info.value),
        })
      );
    }

    await Promise.all(actorUpdates);

    // copy items whole from DAE
    const daeCopy = game.settings.get("ddb-importer", "character-update-policy-dae-copy");
    const daeInstalled =
      utils.isModuleInstalledAndActive("dae") && utils.isModuleInstalledAndActive("Dynamic-Effects-SRD");
    if (daeCopy && daeInstalled) {
      CharacterImport.showCurrentTask(html, "Importing DAE Effects");
      await migrateActorDAESRD(this.actor);
    }

    if (activeEffectCopy) {
      // find effects with a matching name that existed on previous actor
      // and that have a different active state and activate them
      const targetEffects = this.actor.data.effects.filter((ae) => {
        const previousEffectDiff = this.actorOriginal.effects.find((oae) =>
          oae.label === ae.label && oae.disabled !== ae.disabled
        );
        if (previousEffectDiff) return true;
        return false;
      });
      targetEffects.forEach((ae) => {
        this.actor.updateEmbeddedEntity("ActiveEffect", { "_id": ae._id, "disabled": !ae.disabled });
      });
    }

    this.close();
  }
}
