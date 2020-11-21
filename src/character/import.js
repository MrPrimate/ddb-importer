import utils from "../utils.js";
import logger from "../logger.js";
import { parseJson } from "../parser/character.js";

const EQUIPMENT_TYPES = ["equipment", "consumable", "tool", "loot", "backpack"];

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

// a mapping of compendiums with content type
const compendiumLookup = [
  { type: "inventory", compendium: "entity-item-compendium" },
  { type: "spells", compendium: "entity-spell-compendium" },
  { type: "features", compendium: "entity-feature-compendium" },
  { type: "feat", name: "entity-feature-compendium" },
  { type: "weapon", name: "entity-item-compendium" },
  { type: "consumable", name: "entity-item-compendium" },
  { type: "tool", name: "entity-item-compendium" },
  { type: "loot", name: "entity-item-compendium" },
  { type: "backpack", name: "entity-item-compendium" },
  { type: "spell", name: "entity-spell-compendium" },
  { type: "equipment", name: "entity-item-compendium" },
];

const srdCompendiumLookup = [
  { type: "inventory", name: "dnd5e.items" },
  { type: "spells", name: "dnd5e.spells" },
  { type: "features", name: "dnd5e.classfeatures" },
  { type: "feat", name: "dnd5e.classfeatures" },
  { type: "weapon", name: "dnd5e.items" },
  { type: "consumable", name: "dnd5e.items" },
  { type: "tool", name: "dnd5e.items" },
  { type: "loot", name: "dnd5e.items" },
  { type: "backpack", name: "dnd5e.items" },
  { type: "spell", name: "dnd5e.spells" },
  { type: "equipment", name: "dnd5e.items" },
];

const gameFolderLookup = [
  {
    type: "itemSpells",
    folder: "magic-item-spells",
    itemType: "spell",
  },
];

const getCharacterUpdatePolicyTypes = () => {
  let itemTypes = [];
  itemTypes.push("class");
  if (game.settings.get("ddb-importer", "character-update-policy-feat")) itemTypes.push("feat");
  if (game.settings.get("ddb-importer", "character-update-policy-weapon")) itemTypes.push("weapon");
  if (game.settings.get("ddb-importer", "character-update-policy-equipment"))
    itemTypes = itemTypes.concat(EQUIPMENT_TYPES);
  if (game.settings.get("ddb-importer", "character-update-policy-spell")) itemTypes.push("spell");
  return itemTypes;
};

/**
 * Returns a combined array of all items to process, filtered by the user's selection on what to skip and what to include
 * @param {object} result object containing all character items sectioned as individual properties
 * @param {array[string]} sections an array of object properties which should be filtered
 */
const filterItemsByUserSelection = (result, sections) => {
  let items = [];
  const validItemTypes = getCharacterUpdatePolicyTypes();

  for (const section of sections) {
    items = items.concat(result[section]).filter((item) => validItemTypes.includes(item.type));
  }
  return items;
};

// async function loadCharacterData(characterId) {
//   // const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
//   const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
//   // const body = { cobalt: cobaltCookie };
//   // const body = {};
//   return new Promise((resolve, reject) => {
//     fetch(`${parsingApi}/getCharacter/${characterId}`, {
//       method: "GET",
//       mode: "cors", // no-cors, *cors, same-origin
//       cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
//       credentials: "same-origin", // include, *same-origin, omit
//       headers: {
//         "Content-Type": "application/json",
//       },
//       redirect: "follow", // manual, *follow, error
//       referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
//      // body: JSON.stringify(body), // body data type must match "Content-Type" header
//     })
//       .then((response) => response.json())
//       .then((data) => resolve(data))
//       .catch((error) => reject(error));
//   });
// }

function download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

/**
 * Loads and parses character in the proxy
 * @param {*} characterId
 */

async function getCharacterData(characterId) {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const body = { cobalt: cobaltCookie };

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/getCharacter/${characterId}`, {
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
        // construct the expected { character: {...} } object
        let ddb = data.ddb.character === undefined ? { character: data.ddb } : data.ddb;
        try {
          const character = parseJson(ddb);
          data['character'] = character;
          return data;
        } catch (error) {
          const debug = game.settings.get("ddb-importer", "log-level");
          if (debug == "DEBUG") {
            download(JSON.stringify(data), `${characterId}-raw.json`, 'application/json');
          }
          throw (error);
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

export default class CharacterImport extends Application {
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
          this.actor.data.flags.ddbimporter.dndbeyond.url = apiEndpointUrl;
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
    options.template = "modules/ddb-importer/src/character/import.handlebars";
    options.width = 800;
    options.height = "auto";
    options.classes = ["ddbimporter"];
    return options;
  }

  static showCurrentTask(html, title, message = null, isError = false) {
    let element = $(html).find(".task-name");
    element.html(`<h2 ${isError ? " style='color:red'" : ""}>${title}</h2>${message ? `<p>${message}</p>` : ""}`);
    $(html).parent().parent().css("height", "auto");
  }

  static async copyFlagGroup(flagGroup, originalItem, targetItem) {
    if (targetItem.flags === undefined) targetItem.flags = {};
    if (originalItem.flags && !!originalItem.flags[flagGroup]) {
      utils.log(`Copying ${flagGroup} for ${originalItem.name}`);
      targetItem.flags[flagGroup] = originalItem.flags[flagGroup];
    }
  }

  /**
   * Copies across some flags for existing item
   * @param {*} items
   */
  static async copySupportedItemFlags(originalItem, item) {
    CharacterImport.copyFlagGroup("dynamiceffects", originalItem, item);
    CharacterImport.copyFlagGroup("maestro", originalItem, item);
    CharacterImport.copyFlagGroup("mess", originalItem, item);
    CharacterImport.copyFlagGroup("favtab", originalItem, item);
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
        CharacterImport.copySupportedItemFlags(originalItem, item);
      }
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
            !itemsToRemove.some((originalItem) => item.name === originalItem.name && item.type === originalItem.type)
        )
      );
    });
  }

  async importItems(items) {
    return new Promise((resolve) => {
      resolve(this.actor.createEmbeddedEntity("OwnedItem", items, { displaySheet: false }));
    });
  }

  static getLooseNames(name) {
    let looseNames = [name.toLowerCase()];
    let refactNameArray = name.split("(")[0].trim().split(", ");
    refactNameArray.unshift(refactNameArray.pop());
    const refactName = refactNameArray.join(" ").trim();
    looseNames.push(refactName, refactName.toLowerCase());

    let deconNameArray = name.replace("(", "").replace(")", "").trim().split(", ");
    deconNameArray.unshift(deconNameArray.pop());
    const deconName = deconNameArray.join(" ").trim();
    looseNames.push(deconName, deconName.toLowerCase());

    looseNames.push(name.replace("'", "’").toLowerCase());
    looseNames.push(name.replace("’", "'").toLowerCase());

    // logger.debug(looseNames);
    return looseNames;
  }

  static async looseItemNameMatch(item, items, loose = false) {
    // first pass is a strict match
    // logger.debug(item.name);
    let matchingItem = items.find((matchItem) => {
      let activationMatch = false;

      if (item.data.activation && item.data.activation.type == "") {
        activationMatch = true;
      } else if (matchItem.data.activation && item.data.activation) {
        activationMatch = matchItem.data.activation.type === item.data.activation.type;
      }

      const isMatch = item.name === matchItem.name && item.type === matchItem.type && activationMatch;
      return isMatch;
    });

    if (!matchingItem && loose) {
      const looseNames = CharacterImport.getLooseNames(item.name);
      // lets go loosey goosey on matching equipment, we often get types wrong
      matchingItem = items.find(
        (matchItem) =>
          (looseNames.includes(matchItem.name.toLowerCase()) || looseNames.includes(matchItem.name.toLowerCase().replace(" armor", ""))) &&
          EQUIPMENT_TYPES.includes(item.type) &&
          EQUIPMENT_TYPES.includes(matchItem.type)
      );

      // super loose name match!
      if (!matchingItem) {
        // still no matching item, lets do a final pass
        matchingItem = items.find(
          (matchItem) => looseNames.includes(matchItem.name.split("(")[0].trim().toLowerCase())
        );
      }
    }
    return matchingItem;
  }

  /**
   * gets items from compendium
   * @param {*} items
   */
  static async getCompendiumItems(items, type, compendiumLabel = null, looseMatch = false) {
    if (!compendiumLabel) {
      const compendiumName = compendiumLookup.find((c) => c.type == type).compendium;
      compendiumLabel = game.settings.get("ddb-importer", compendiumName);
    }
    const compendium = await game.packs.find((pack) => pack.collection === compendiumLabel);
    const index = await compendium.getIndex();
    const firstPassItems = await index.filter((i) => items.some((orig) => {
      if (looseMatch) {
        const looseNames = CharacterImport.getLooseNames(orig.name);
        return looseNames.includes(i.name.split("(")[0].trim().toLowerCase());
      } else {
        return i.name === orig.name;
      }
    }));

    let results = [];
    for (const i of firstPassItems) {
      let item = await compendium.getEntry(i._id); // eslint-disable-line no-await-in-loop
      const ddbItem = await CharacterImport.looseItemNameMatch(item, items, looseMatch); // eslint-disable-line no-await-in-loop

      // const ddbItem = items.find((orig) =>
      //   (item.name === orig.name && item.type === orig.type && orig.data.activation
      //     ? orig.data.activation.type === item.data.activation.type
      //     : true)
      // );

      if (ddbItem) {
        if (ddbItem.data.quantity) item.data.quantity = ddbItem.data.quantity;
        if (ddbItem.data.attuned) item.data.attuned = ddbItem.data.attuned;
        if (ddbItem.data.equipped) item.data.equipped = ddbItem.data.equipped;
        if (ddbItem.data.uses) item.data.uses = ddbItem.data.uses;
        if (ddbItem.data.resources) item.data.resources = ddbItem.data.resources;
        if (ddbItem.data.consume) item.data.consume = ddbItem.data.consume;
        if (ddbItem.data.preparation) item.data.preparation = ddbItem.data.preparation;
        // do we want to enrich the compendium item with our parsed flag data?
        // item.flags = { ...ddbItem.flags, ...item.flags };
        delete item["_id"];
        results.push(item);
      }
    }

    return results;
  }

  static async getSRDCompendiumItems(items, type, looseMatch = false) {
    // console.error(game.packs.keys());
    const compendiumName = srdCompendiumLookup.find((c) => c.type == type).name;
    return CharacterImport.getCompendiumItems(items, type, compendiumName, looseMatch);
  }

  static async getSRDIconMatch(type) {
    const compendiumLabel = srdCompendiumLookup.find((c) => c.type == type).name;
    const compendium = await game.packs.find((pack) => pack.collection === compendiumLabel);
    const index = await compendium.getIndex();

    let items = [];
    for (const i of index) {
      const item = await compendium.getEntry(i._id); // eslint-disable-line no-await-in-loop
      let smallItem = {
        name: item.name,
        img: item.img,
        type: item.type,
        data: {}
      };
      if (item.data.activation) smallItem.data.activation = item.data.activation;
      items.push(smallItem);
    }


    return items;
  }

  static async copySRDIcons(items) {
    const compendiumFeatureItems = await CharacterImport.getSRDIconMatch("features");
    const compendiumInventoryItems = await CharacterImport.getSRDIconMatch("inventory");
    const compendiumSpellItems = await CharacterImport.getSRDIconMatch("spells");

    const srdCompendiumItems = compendiumInventoryItems.concat(
      compendiumSpellItems,
      compendiumFeatureItems
    );

    return new Promise((resolve) => {
      const srdItems = items.map((item) => {
        CharacterImport.looseItemNameMatch(item, srdCompendiumItems, true).then((match) => {
          if (match) {
            item.img = match.img;
          }
        });
        return item;
      });
      resolve(srdItems);
    });

  }

  /**
   * Updates a compendium, provide the type.
   * @param {*} type
   */
  async updateCompendium(type) {
    const importPolicy = game.settings.get("ddb-importer", "entity-import-policy");
    const compendiumName = compendiumLookup.find((c) => c.type == type).compendium;
    const compendiumLabel = game.settings.get("ddb-importer", compendiumName);
    const compendium = await game.packs.find((pack) => pack.collection === compendiumLabel);
    compendium.locked = false;

    if (game.user.isGM && importPolicy !== 2) {
      const initialIndex = await compendium.getIndex();
      // remove duplicate items based on name and type
      const compendiumItems = [
        ...new Map(this.result[type].map((item) => [item["name"] + item["type"], item])).values(),
      ];

      const updateItems = async () => {
        if (importPolicy === 0) {
          return Promise.all(
            compendiumItems
              .filter((item) => initialIndex.some((idx) => idx.name === item.name))
              .map(async (item) => {
                const entry = await compendium.index.find((idx) => idx.name === item.name);
                const existing = await compendium.getEntity(entry._id);
                item._id = existing._id;
                await CharacterImport.copySupportedItemFlags(existing, item);
                await compendium.updateEntity(item);
                return item;
              })
          );
        } else {
          return Promise.all([]);
        }
      };

      const createItems = async () => {
        return Promise.all(
          compendiumItems
            .filter((item) => !initialIndex.some((idx) => idx.name === item.name))
            .map(async (item) => {
              const newItem = await Item.create(item, {
                temporary: true,
                displaySheet: false,
              });
              await compendium.importEntity(newItem);
              return newItem;
            })
        );
      };

      await updateItems();
      await createItems();

      const updatedIndex = await compendium.getIndex();
      const getItems = async () => {
        return Promise.all(
          this.result[type].map(async (item) => {
            const searchResult = await updatedIndex.find((idx) => idx.name === item.name);
            if (!searchResult) {
              logger.debug(`Couldn't find ${item.name} in the compendium`);
              return null;
            } else {
              const entity = compendium.getEntity(searchResult._id);
              return entity;
            }
          })
        );
      };

      // lets generate our compendium info like id, pack and img for use
      // by things like magicitems
      const items = getItems().then((entries) => {
        const results = entries.map((result) => {
          return {
            _id: result._id,
            pack: compendium.collection,
            img: result.img,
            name: result.name,
          };
        });
        return results;
      });

      return items;
    }
    return [];
  }

  /**
   * Updates game folder items
   * @param {*} type
   */
  async updateFolderItems(type) {
    const folderLookup = gameFolderLookup.find((c) => c.type == type);
    const magicItemsFolder = await utils.getFolder(folderLookup.folder);
    const existingItems = await game.items.entities.filter(
      (item) => item.type === folderLookup.itemType && item.data.folder === magicItemsFolder._id
    );

    // update or create folder items
    const updateItems = async () => {
      return Promise.all(
        this.result[type]
          .filter((item) => existingItems.some((idx) => idx.name === item.name))
          .map(async (item) => {
            const existingItem = await existingItems.find((existing) => item.name === existing.name);
            item._id = existingItem._id;
            await CharacterImport.copySupportedItemFlags(existingItem, item);
            await Item.update(item);
            return item;
          })
      );
    };

    const createItems = async () => {
      return Promise.all(
        this.result[type]
          .filter((item) => !existingItems.some((idx) => idx.name === item.name))
          .map(async (item) => {
            if (!game.user.can("ITEM_CREATE")) {
              ui.notifications.warn(`Cannot create ${folderLookup.type} ${item.name} for ${type}`);
            } else {
              item.folder = magicItemsFolder._id;
              await Item.create(item);
            }
            return item;
          })
      );
    };

    await updateItems();
    await createItems();

    // lets generate our compendium info like id, pack and img for use
    // by things like magicitems
    const items = Promise.all(
      game.items.entities
        .filter((item) => item.type === folderLookup.itemType && item.data.folder === magicItemsFolder._id)
        .map((result) => {
          return {
            _id: result._id,
            id: result._id,
            pack: "world",
            img: result.img,
            name: result.name,
          };
        })
    );
    return items;
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
  async clearItemsByUserSelection() {
    const invalidItemTypes = getCharacterUpdatePolicyTypes();

    // collect all items belonging to one of those inventory item categories
    const ownedItems = this.actor.getEmbeddedCollection("OwnedItem");
    const toRemove = ownedItems.filter((item) => invalidItemTypes.includes(item.type)).map((item) => item._id);
    await this.actor.deleteEmbeddedEntity("OwnedItem", toRemove);
    return toRemove;
  }

  async updateImage(html, data) {
    // updating the image?
    let imagePath = this.actor.img;
    if (
      game.user.isTrusted &&
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
        this.result.character.flags.ddbimporter['framePath'] = framePath;
      }
    }
  }

  /**
   * This adds magic item spells to a world,
   */
  async addMagicItemSpells() {
    const itemSpells = await this.updateFolderItems("itemSpells");
    // scan the inventory for each item with spells and copy the imported data over
    this.result.inventory.forEach((item) => {
      if (item.flags.magicitems.spells) {
        for (let [i, spell] of Object.entries(item.flags.magicitems.spells)) {
          const itemSpell = itemSpells.find((item) => item.name === spell.name);
          if (itemSpell) {
            for (const [key, value] of Object.entries(itemSpell)) {
              item.flags.magicitems.spells[i][key] = value;
            }
          } else if (!game.user.can("ITEM_CREATE")) {
            ui.notifications.warn(`Magic Item ${item.name} cannot be enriched because of lacking player permissions`);
          }
        }
      }
    });
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

    const daeInstalled = utils.isModuleInstalledAndActive('dae') && utils.isModuleInstalledAndActive('Dynamic-Effects-SRD');

    const importConfig = [
      {
        name: "new",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-new"),
        description: "Import new items only. Doesn't delete or update existing items in Foundry.",
        enabled: true,
      },
      {
        name: "use-existing",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-use-existing"),
        description: "Use existing items from DDB import compendiums, rather than recreating.",
        enabled: true,
      },
      {
        name: "use-srd",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-use-srd"),
        description: "Use existing items from the SRD compendium, rather than DDB.",
        enabled: true,
      },
      {
        name: "use-srd-icons",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-use-srd-icons"),
        description: "Use icons from the SRD compendium.",
        enabled: true,
      },
      {
        name: "dae-copy",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-dae-copy"),
        description: "Copy Dynamic Active Effects (requires DAE and SRD module).",
        enabled: daeInstalled,
      },
    ];

    return {
      actor: this.actor,
      importPolicies: importPolicies,
      importConfig: importConfig,
    };
  }

  /* -------------------------------------------- */

  activateListeners(html) {
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
      .find("#dndbeyond-character-import-start")
      .on("click", async (event) => {
        // retrieve the character data from the proxy
        event.preventDefault();

        try {
          CharacterImport.showCurrentTask(html, "Getting Character data");
          const characterId = this.actor.data.flags.ddbimporter.dndbeyond.characterId;
          const characterData = await getCharacterData(characterId);
          logger.debug("import.js getCharacterData result", characterData);
          const debug = game.settings.get("ddb-importer", "log-level");
          if (debug == "DEBUG") {
            download(JSON.stringify(characterData), `${characterId}.json`, 'application/json');
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
                  url: apiEndpointUrl,
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

  async parseCharacterData(html, data) {
    this.result = data.character;
    // is magicitems installed
    const magicItemsInstalled = utils.isModuleInstalledAndActive("magicitems");

    await this.updateImage(html, data.ddb);

    // manage updates of basic character data more intelligently
    if (!game.settings.get("ddb-importer", "character-update-policy-currency")) {
      // revert currency if user didn't select to update it
      this.result.character.data.currency = this.actorOriginal.data.currency;
    }

    // basic import
    CharacterImport.showCurrentTask(html, "Updating basic character information");
    await this.actor.update(this.result.character);

    // clear items
    const importKeepExistingActorItems = game.settings.get("ddb-importer", "character-update-policy-new");

    if (!importKeepExistingActorItems) {
      CharacterImport.showCurrentTask(html, "Clearing inventory");
      await this.clearItemsByUserSelection();
    }

    // store all spells in the folder specific for Dynamic Items
    if (magicItemsInstalled && this.result.itemSpells && Array.isArray(this.result.itemSpells)) {
      CharacterImport.showCurrentTask(html, "Preparing magicitem spells");
      await this.addMagicItemSpells();
    }

    // Update compendium packs with  features
    // CharacterImport.showCurrentTask(html, "Updating compendium(s)");
    // this.updateCompendium("inventory");
    // this.updateCompendium("spells");
    // this.updateCompendium("features");

    // Adding all items to the actor
    const FILTER_SECTIONS = ["classes", "features", "actions", "inventory", "spells"];
    let items = filterItemsByUserSelection(this.result, FILTER_SECTIONS);

    // If there is no magicitems module fall back to importing the magic
    // item spells as normal spells fo the character
    if (!magicItemsInstalled) {
      items.push(this.result.itemSpells.filter((item) => {
        const active = item.flags.ddbimporter.dndbeyond && item.flags.ddbimporter.dndbeyond.active === true;
        if (!active) logger.warn(`Missing active flag on item spell ${item.name}`);
        return active;
      }));
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
    const useSRDCompendiumIcons = game.settings.get("ddb-importer", "character-update-policy-use-srd-icons");

    /**
     * If SRD is selected, we prefer this
     */
    if (useSRDCompendiumItems) {
      utils.log("Removing compendium items");
      const compendiumFeatureItems = await CharacterImport.getSRDCompendiumItems(items, "features");
      const compendiumInventoryItems = await CharacterImport.getSRDCompendiumItems(items, "inventory");
      const compendiumSpellItems = await CharacterImport.getSRDCompendiumItems(items, "spells");

      srdCompendiumItems = compendiumItems.concat(
        compendiumInventoryItems,
        compendiumSpellItems,
        compendiumFeatureItems
      );
      // removed existing items from those to be imported
      items = await CharacterImport.removeItems(items, srdCompendiumItems);
    }

    if (useExistingCompendiumItems) {
      utils.log("Removing compendium items");
      const compendiumFeatureItems = await CharacterImport.getCompendiumItems(items, "features");
      const compendiumInventoryItems = await CharacterImport.getCompendiumItems(items, "inventory");
      const compendiumSpellItems = await CharacterImport.getCompendiumItems(items, "spells");

      compendiumItems = compendiumItems.concat(compendiumInventoryItems, compendiumSpellItems, compendiumFeatureItems);
      // removed existing items from those to be imported
      items = await CharacterImport.removeItems(items, compendiumItems);
    }

    // if we still have items to add, add them
    if (items.length > 0) {
      CharacterImport.showCurrentTask(html, "Copying existing flags");
      await this.copySupportedCharacterItemFlags(items);
      if (useSRDCompendiumIcons && !useSRDCompendiumItems) {
        items = await CharacterImport.copySRDIcons(items);
      }

      utils.log("Character items", "character");
      utils.log(items, "character");

      CharacterImport.showCurrentTask(html, "Adding items to character");
      await this.importItems(items);
    }

    // now import any compendium items that we matched
    if (useExistingCompendiumItems) {
      CharacterImport.showCurrentTask(html, "Importing compendium items");
      utils.log("Importing compendium items");
      await this.importItems(compendiumItems);
    }

    if (useSRDCompendiumItems) {
      CharacterImport.showCurrentTask(html, "Importing SRD compendium items");
      utils.log("Importing SRD compendium items");
      await this.importItems(srdCompendiumItems);
    }

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

    const daeCopy = game.settings.get("ddb-importer", "character-update-policy-dae-copy");
    const daeInstalled = utils.isModuleInstalledAndActive('dae') && utils.isModuleInstalledAndActive('Dynamic-Effects-SRD');
    if (daeCopy && daeInstalled) {
      CharacterImport.showCurrentTask(html, "Importing DAE Effects");
      await DAE.migrateActorDAESRD(this.actor, false);
    }

    this.close();
  }
}
