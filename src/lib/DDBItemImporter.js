import logger from "../logger.js";
import DICTIONARY from "../dictionary.js";
import SETTINGS from "../settings.js";
import CompendiumHelper from "./CompendiumHelper.js";
import DDBMuncher from "../apps/DDBMuncher.js";
import Iconizer from "./Iconizer.js";
import { DDBCompendiumFolders } from "./DDBCompendiumFolders.js";
import NameMatcher from "./NameMatcher.js";
import { addVision5eStubs } from "../effects/vision5e.js";
import ExternalAutomations from "../effects/external/ExternalAutomations.js";

export default class DDBItemImporter {

  constructor(type, documents, { matchFlags = [], deleteBeforeUpdate = null, indexFilter = {}, useCompendiumFolders = null } = {}) {
    this.type = type;
    this.documents = documents;
    this.useCompendiumFolders = useCompendiumFolders ?? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-compendium-folders");
    this.matchFlags = matchFlags;

    this.compendium = CompendiumHelper.getCompendiumType(this.type);
    this.compendium.configure({ locked: false });
    this.compendiumIndex = null;
    this.indexFilter = indexFilter;

    this.results = [];

    this.deleteBeforeUpdate = deleteBeforeUpdate ?? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-delete-during-update");
  }

  async buildIndex(indexFilter = {}) {
    this.indexFilter = indexFilter;
    this.compendiumIndex = await this.compendium.getIndex(this.indexFilter);
  }

  async init() {
    await this.buildIndex();
  }

  #flagMatch(item1, item2) {
    // console.warn("flagMatch", {item1, item2, matchFlags});
    if (this.matchFlags.length === 0) return true;
    const matched = this.matchFlags.some((flag) =>
      foundry.utils.hasProperty(item1, `flags.ddbimporter.${flag}`)
      && foundry.utils.hasProperty(item2, `flags.ddbimporter.${flag}`)
      && item1.flags.ddbimporter[flag] === item2.flags.ddbimporter[flag]
    );
    return matched;
  }

  static copyFlagGroup(flagGroup, originalItem, targetItem) {
    if (targetItem.flags === undefined) targetItem.flags = {};
    // if we have generated effects we dont want to copy some flag groups. mostly for AE on spells
    const effectsProperty = foundry.utils.getProperty(targetItem, "flags.ddbimporter.effectsApplied")
      && SETTINGS.EFFECTS_IGNORE_FLAG_GROUPS.includes(flagGroup);
    if (originalItem.flags && !!originalItem.flags[flagGroup] && !effectsProperty) {
      // logger.debug(`Copying ${flagGroup} for ${originalItem.name}`);
      targetItem.flags[flagGroup] = originalItem.flags[flagGroup];
    }
  }

  static copySupportedItemFlags(originalItem, targetItem) {
    SETTINGS.SUPPORTED_FLAG_GROUPS.forEach((flagGroup) => {
      this.copyFlagGroup(flagGroup, originalItem, targetItem);
    });
  }


  static updateCharacterItemFlags(itemData, replaceData) {
    if (itemData.flags?.ddbimporter?.importId) foundry.utils.setProperty(replaceData, "flags.ddbimporter.importId", itemData.flags.ddbimporter.importId);
    if (replaceData.flags?.ddbimporter?.ddbCustomAdded) {
      replaceData.system = itemData.system;
      replaceData.type = itemData.type;
    }
    if (itemData.system.quantity) replaceData.system.quantity = itemData.system.quantity;
    if (itemData.system.attuned) replaceData.system.attuned = itemData.system.attuned;
    if (itemData.system.attunement) replaceData.system.attunement = itemData.system.attunement;
    if (itemData.system.equipped) replaceData.system.equipped = itemData.system.equipped;
    if (itemData.system.resources) replaceData.system.resources = itemData.system.resources;
    if (itemData.system.preparation) replaceData.system.preparation = itemData.system.preparation;
    if (itemData.system.proficient) replaceData.system.proficient = itemData.system.proficient;
    if (!DICTIONARY.types.inventory.includes(itemData.type)) {
      if (itemData.system.uses) replaceData.system.uses = itemData.system.uses;
      if (itemData.system.consume) replaceData.system.consume = itemData.system.consume;
      if (itemData.system.ability) replaceData.system.ability = itemData.system.ability;
    }
    if (foundry.utils.hasProperty(itemData, "system.levels")) replaceData.system.levels = itemData.system.levels;
    if (foundry.utils.getProperty(itemData, "flags.ddbimporter.price.xgte")) {
      replaceData.system.price.value = itemData.system.price.value;
      replaceData.system.price.denomination = itemData.system.price.denomination;
      foundry.utils.setProperty(replaceData, "flags.ddbimporter.price", itemData.flags.ddbimporter.price);
    }
    return replaceData;
  }

  static updateMatchingItems(oldItems, newItems,
    { looseMatch = false, monster = false, keepId = false, keepDDBId = false, overrideId = false, linkItemFlags = false } = {}
  ) {
    let results = [];

    for (let newItem of newItems) {
      let item = foundry.utils.duplicate(newItem);

      const matched = overrideId
        ? oldItems.find((oldItem) => foundry.utils.getProperty(oldItem, "flags.ddbimporter.overrideId") == item._id)
        : NameMatcher.looseItemNameMatch(item, oldItems, looseMatch, monster); // eslint-disable-line no-await-in-loop

      if (matched) {
        const match = foundry.utils.duplicate(matched);
        // in some instances we want to keep the ddb id
        if (keepDDBId && foundry.utils.hasProperty(item, "flags.ddbimporter.id")) {
          foundry.utils.setProperty(match, "flags.ddbimporter.id", foundry.utils.duplicate(item.flags.ddbimporter.id));
        }
        if (!item.flags.ddbimporter) {
          foundry.utils.setProperty(item, "flags.ddbimporter", match.flags.ddbimporter);
        } else if (match.flags.ddbimporter && item.flags.ddbimporter) {
          const mergedFlags = foundry.utils.mergeObject(item.flags.ddbimporter, match.flags.ddbimporter);
          foundry.utils.setProperty(item, "flags.ddbimporter", mergedFlags);
        }
        if (!item.flags.monsterMunch && match.flags.monsterMunch) {
          foundry.utils.setProperty(item, "flags.monsterMunch", match.flags.monsterMunch);
        }
        foundry.utils.setProperty(item, "flags.ddbimporter.originalItemName", match.name);
        foundry.utils.setProperty(item, "flags.ddbimporter.replaced", true);
        if (linkItemFlags && foundry.utils.hasProperty(match, "flags.link-item-resource-5e")) {
          foundry.utils.setProperty(item, "flags.link-item-resource-5e", match.flags["link-item-resource-5e"]);
        }
        item = DDBItemImporter.updateCharacterItemFlags(match, item);

        if (!keepId) delete item["_id"];
        results.push(item);
      }
    }

    return results;
  }

  /**
   * Removes items
   * @param {*} itemsToRemove
   */
  removeItems(itemsToRemove, matchDDBId = false) {
    this.documents = this.documents.filter((item) =>
      !itemsToRemove.some((originalItem) =>
        (item.name === originalItem.name || item.flags?.ddbimporter?.originalName === originalItem.name)
        && item.type === originalItem.type
        && (!matchDDBId || (matchDDBId && item.flags?.ddbimporter?.id === originalItem.flags?.ddbimporter?.id))
      )
    );
  }


  async getSRDCompendiumItems(looseMatch = false, keepId = false, monster = false) {
    const compendiumName = SETTINGS.SRD_COMPENDIUMS.find((c) => c.type == this.type).name;
    const srdPack = CompendiumHelper.getCompendium(compendiumName);
    const srdIndices = ["name", "type", "flags.ddbimporter.dndbeyond.alternativeNames"];
    const index = await srdPack.getIndex({ fields: srdIndices });

    const matchedIds = index.filter((i) =>
      index.some((orig) => {
        const extraNames = foundry.utils.getProperty(orig, "flags.ddbimporter.dndbeyond.alternativeNames") ?? [];
        if (looseMatch) {
          const looseNames = NameMatcher.getLooseNames(orig.name, extraNames);
          return looseNames.includes(i.name.split("(")[0].trim().toLowerCase());
        } else {
          return i.name === orig.name || extraNames.includes(i.name);
        }
      })
    ).map((i) => i._id);

    const loadedItems = (await srdPack.getDocuments(matchedIds))
      .map((i) => {
        const item = i.toObject();
        delete i.folder;
        if (item.flags.ddbimporter) {
          item.flags.ddbimporter["pack"] = compendiumName;
        } else {
          item.flags.ddbimporter = { pack: compendiumName };
        }
        return item;
      });
    // logger.debug(`SRD ${type} loaded items:`, loadedItems);

    const matchingOptions = {
      looseMatch,
      monster,
      keepId,
    };

    const results = DDBItemImporter.updateMatchingItems(this.documents, loadedItems, matchingOptions);
    logger.debug(`SRD ${this.type} result items:`, results);

    return results;
  }

  async addCompendiumFolderIds(documents) {
    if (this.useCompendiumFolders) {
      const compendiumFolders = new DDBCompendiumFolders(this.type);
      await compendiumFolders.loadCompendium(this.type);
      const results = await compendiumFolders.addCompendiumFolderIds(documents);
      return results;
    } else {
      return documents;
    }
  }

  async getFilteredItems(item) {
    const indexEntries = this.compendiumIndex.filter((idx) => idx.name === item.name);

    const mapped = await Promise.all(indexEntries.map((idx) => {
      const entry = this.compendium.getDocument(idx._id).then((doc) => doc);
      return entry;
    }));

    const flagFiltered = mapped.filter((idx) => {
      const nameMatch = idx.name === item.name;
      const flagMatched = this.#flagMatch(idx, item);
      return nameMatch && flagMatched;
    });

    return flagFiltered;
  }


  /**
   * Asynchronously creates a new item to be added to a compendium based on its type.
   * @param {object} item - the data for the new item to be created
   * @return {Promise<object|null>} a Promise that resolves with the imported item or null if import failed
   */
  async createCompendiumItem(item) {
    let newItem;
    switch (this.type) {
      case "table":
      case "tables": {
        newItem = new RollTable(item);
        break;
      }
      default: {
        try {
          const options = {
            displaySheet: false,
            keepId: true,
            temporary: true,
          };
          // eslint-disable-next-line no-await-in-loop
          newItem = new Item.implementation(item, options);
        } catch (err) {
          logger.error(`Error creating ${item.name}`, { item, err });
          throw err;
        }

      }
    }
    if (!newItem) {
      logger.error(`Item ${item.name} failed creation`, { item, newItem });
    }
    DDBMuncher.munchNote(`Creating ${item.name}`);
    logger.debug(`Pushing ${item.name} to compendium`);
    return this.compendium.importDocument(newItem);
  }

  async updateCompendiumItem(updateItem, existingItem) {
    // purge existing active effects on this item
    if (existingItem.results) await existingItem.deleteEmbeddedDocuments("TableResult", [], { deleteAll: true });
    if (existingItem.effects) await existingItem.deleteEmbeddedDocuments("ActiveEffect", [], { deleteAll: true });
    if (existingItem.flags) DDBItemImporter.copySupportedItemFlags(existingItem, updateItem);
    DDBMuncher.munchNote(`Updating ${updateItem.name} compendium entry`);
    logger.debug(`Updating ${updateItem.name} compendium entry`);

    const update = existingItem.update(updateItem, { pack: this.compendium.metadata.id, render: false });
    // const update = existingItem.update(updateItem, { pack: compendium.metadata.id, recursive: false, render: false });
    return update;
  }

  async deleteCreateCompendiumItem(updateItem, existingItem) {
    if (existingItem.flags) DDBItemImporter.copySupportedItemFlags(existingItem, updateItem);
    DDBMuncher.munchNote(`Removing and Recreating ${updateItem.name} compendium entry`);
    logger.debug(`Removing and Recreating ${updateItem.name} compendium entry`);
    await existingItem.delete();
    let newItem = await this.createCompendiumItem(updateItem);
    return newItem;
  }


  async updateCompendiumItems(inputItems) {
    let results = [];
    for (const item of inputItems) {
      // eslint-disable-next-line no-await-in-loop
      const existingItems = await this.getFilteredItems(item);
      // we have a match, update first match
      if (existingItems.length >= 1) {
        const existingItem = existingItems[0];
        // eslint-disable-next-line require-atomic-updates
        item._id = existingItem._id;

        if (item.type !== existingItem.type || this.deleteBeforeUpdate) {
          if (item.type !== existingItem.type) {
            logger.warn(`Item type mismatch ${item.name} from ${existingItem.type} to ${item.type}. DDB Importer will delete and recreate this item from scratch. You can most likely ignore this message.`);
          }
          let newItem = this.deleteCreateCompendiumItem(item, existingItem);
          results.push(newItem);
        } else {
          let update = this.updateCompendiumItem(item, existingItem);
          results.push(update);
        }
      }
    }

    return Promise.all(results);
  }

  async createCompendiumItems(inputItems) {
    let promises = [];
    for (const item of inputItems) {
      // eslint-disable-next-line no-await-in-loop
      const existingItems = await this.getFilteredItems(item);
      // we have a single match
      if (existingItems.length === 0) {
        // eslint-disable-next-line no-await-in-loop
        let newItem = await this.createCompendiumItem(item);
        promises.push(newItem);
      }
    };
    return Promise.all(promises);
  }

  async updateCompendium(updateExisting = false, filterDuplicates = true) {
    if (!game.user.isGM) return [];
    logger.debug(`Getting compendium for update of ${this.type} documents (checking ${this.documents.length} docs)`);

    if (this.compendium.metadata.type === "Item" && this.deleteBeforeUpdate) {
      await Item.deleteDocuments([], { pack: this.compendium.metadata.id, deleteAll: true });
    }

    // remove duplicate items based on name and type
    const filterItems = filterDuplicates
      ? [...new Map(this.documents.map((item) => {
        let filterItem = item["name"] + item["type"];
        this.matchFlags.forEach((flag) => {
          filterItem += item.flags.ddbimporter[flag];
        });
        return [filterItem, item];
      })).values()]
      : this.documents;

    // v11 compendium folders - just add to doc before creation/update
    const inputItems = await this.addCompendiumFolderIds(filterItems);

    let results = [];
    // update existing items
    DDBMuncher.munchNote(`Creating and updating ${inputItems.length} ${this.type} items in compendium...`, true);

    if (updateExisting) {
      results = await this.updateCompendiumItems(inputItems);
      logger.debug(`Updated ${results.length} existing ${this.type} items in compendium`);
    }

    // create new items
    const createResults = await this.createCompendiumItems(inputItems);
    logger.debug(`Created ${createResults.length} new ${this.type} items in compendium`);
    DDBMuncher.munchNote("", true);

    this.results = createResults.concat(results);
    return new Promise((resolve) => resolve(this.results));
  }

  async loadPassedItemsFromCompendium(items,
    { looseMatch = false, monsterMatch = false, keepId = false, deleteCompendiumId = true,
      indexFilter = {}, // { fields: ["name", "flags.ddbimporter.id"] }
      keepDDBId = false, linkItemFlags = false } = {}
  ) {

    await this.buildIndex(indexFilter);

    const firstPassItems = await this.compendiumIndex.filter((i) =>
      items.some((orig) => {
        const extraNames = foundry.utils.getProperty(orig, "flags.ddbimporter.dndbeyond.alternativeNames") ?? [];
        if (looseMatch) {
          const looseNames = NameMatcher.getLooseNames(orig.name, extraNames);
          return looseNames.includes(i.name.split("(")[0].trim().toLowerCase());
        } else if (monsterMatch) {
          const monsterNames = NameMatcher.getMonsterNames(orig.name);
          // console.log(magicNames)
          if (i.name === orig.name) {
            return true;
          } else if (monsterNames.includes(i.name.toLowerCase())) {
            return true;
          } else {
            return false;
          }
        } else {
          return i.name === orig.name || extraNames.includes(i.name);
        }
      })
    );

    let loadedItems = [];
    for (const i of firstPassItems) {
      // eslint-disable-next-line no-await-in-loop
      let item = await this.compendium.getDocument(i._id).then((doc) => {
        const docData = doc.toObject();
        if (deleteCompendiumId) delete docData._id;
        delete docData.folder;
        SETTINGS.COMPENDIUM_REMOVE_FLAGS.forEach((flag) => {
          if (foundry.utils.hasProperty(docData, flag)) foundry.utils.setProperty(docData, flag, undefined);
        });

        return docData;
      });
      foundry.utils.setProperty(item, "flags.ddbimporter.pack", `${this.compendium.metadata.id}`);
      loadedItems.push(item);
    }
    logger.debug(`compendium ${this.type} loaded items:`, loadedItems);

    const matchingOptions = {
      looseMatch,
      monster: monsterMatch,
      keepId,
      keepDDBId,
      linkItemFlags,
    };

    const results = await DDBItemImporter.updateMatchingItems(items, loadedItems, matchingOptions);
    logger.debug(`compendium ${this.type} result items:`, results);
    return results;
  }


  /**
   * gets items from compendium
   * @param {*} items
   * @param {*} type
   * @param {*} options
   */
  static async getCompendiumItems(items, type,
    { looseMatch = false, monsterMatch = false, keepId = false,
      deleteCompendiumId = true, keepDDBId = false, linkItemFlags = false } = {}
  ) {

    const itemImporter = new DDBItemImporter(type, []);
    await itemImporter.init();

    const loadOptions = {
      looseMatch,
      monsterMatch,
      keepId,
      keepDDBId,
      deleteCompendiumId,
      linkItemFlags,
    };
    const results = await itemImporter.loadPassedItemsFromCompendium(items, loadOptions);

    return results;
  }

  async srdFiddling(removeDuplicates = true, matchDDBId = false) {
    const useSrd = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-srd");

    if (useSrd) {
      logger.debug("Replacing SRD compendium items");
      const srdItems = await this.getSRDCompendiumItems();
      if (removeDuplicates) this.removeItems(srdItems, matchDDBId);
      this.documents = this.documents.concat(srdItems);
    }
  }

  async iconAdditions() {
    this.documents = await Iconizer.updateIcons(this.documents);
  }

  static async buildHandler(type, documents, updateBool,
    { srdFidding = true, removeSRDDuplicates = true, ids = null, vision5e = false, chrisPremades = false, matchFlags = [],
      deleteBeforeUpdate = null, filterDuplicates = true, useCompendiumFolders = null, updateIcons = true } = {}
  ) {
    const handler = new DDBItemImporter(type, documents, { matchFlags, deleteBeforeUpdate, useCompendiumFolders });
    await handler.init();
    if (srdFidding) await handler.srdFiddling(removeSRDDuplicates);
    if (updateIcons) await handler.iconAdditions();
    const filteredItems = (ids !== null && ids.length > 0)
      ? handler.documents.filter((s) => s.flags?.ddbimporter?.definitionId && ids.includes(String(s.flags.ddbimporter.definitionId)))
      : handler.documents;
    if (vision5e) {
      handler.documents = addVision5eStubs(filteredItems);
    }
    if (chrisPremades) {
      handler.documents = await ExternalAutomations.applyChrisPremadeEffects({ documents: handler.documents, compendiumItem: true });
    }
    DDBMuncher.munchNote(`Importing ${handler.documents.length} ${type} documents!`, true);
    logger.debug(`Importing ${handler.documents.length} ${type} documents!`, foundry.utils.deepClone(documents));
    await handler.updateCompendium(updateBool, filterDuplicates);
    await handler.buildIndex();
    return handler;
  }

}
