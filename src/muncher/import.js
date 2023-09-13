import logger from "../logger.js";
import DICTIONARY from "../dictionary.js";
import SETTINGS from "../settings.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import DDBMuncher from "../apps/DDBMuncher.js";
import { addItemsDAESRD } from "./dae.js";
import Iconizer from "../lib/Iconizer.js";
import { DDBCompendiumFolders } from "../lib/DDBCompendiumFolders.js";
import NameMatcher from "../lib/NameMatcher.js";
import FolderHelper from "../lib/FolderHelper.js";

/**
 * Removes items
 * @param {*} items
 * @param {*} itemsToRemove
 */
export async function removeItems(items, itemsToRemove, matchDDBId = false) {
  return new Promise((resolve) => {
    resolve(
      items.filter(
        (item) =>
          !itemsToRemove.some((originalItem) =>
            (item.name === originalItem.name || item.flags?.ddbimporter?.originalName === originalItem.name)
            && item.type === originalItem.type
            && (!matchDDBId || (matchDDBId && item.flags?.ddbimporter?.id === originalItem.flags?.ddbimporter?.id))
          )
      )
    );
  });
}

function copyFlagGroup(flagGroup, originalItem, targetItem) {
  if (targetItem.flags === undefined) targetItem.flags = {};
  // if we have generated effects we dont want to copy some flag groups. mostly for AE on spells
  const effectsProperty = getProperty(targetItem, "flags.ddbimporter.effectsApplied")
    && SETTINGS.EFFECTS_IGNORE_FLAG_GROUPS.includes(flagGroup);
  if (originalItem.flags && !!originalItem.flags[flagGroup] && !effectsProperty) {
    // logger.debug(`Copying ${flagGroup} for ${originalItem.name}`);
    targetItem.flags[flagGroup] = originalItem.flags[flagGroup];
  }
}

/**
 * Copies across some flags for existing item
 * @param {*} items
 */
export function copySupportedItemFlags(originalItem, targetItem) {
  SETTINGS.SUPPORTED_FLAG_GROUPS.forEach((flagGroup) => {
    copyFlagGroup(flagGroup, originalItem, targetItem);
  });
}

function flagMatch(item1, item2, matchFlags) {
  // console.warn("flagMatch", {item1, item2, matchFlags});
  if (matchFlags.length === 0) return true;
  const matched = matchFlags.some((flag) =>
    item1.flags.ddbimporter[flag] && item2.flags.ddbimporter[flag]
    && item1.flags.ddbimporter[flag] === item2.flags.ddbimporter[flag]
  );
  return matched;
}

async function getFilteredItems(compendium, item, index, matchFlags) {
  const indexEntries = index.filter((idx) => idx.name === item.name);

  const mapped = await Promise.all(indexEntries.map((idx) => {
    const entry = compendium.getDocument(idx._id).then((doc) => doc);
    return entry;
  }));

  const flagFiltered = mapped.filter((idx) => {
    const nameMatch = idx.name === item.name;
    const flagMatched = flagMatch(idx, item, matchFlags);
    return nameMatch && flagMatched;
  });

  return flagFiltered;
}

// async function getFlaggedItems(compendium, items, index, matchFlags) {
//   let results = [];
//   items.forEach((item) => {
//     const flagged = getFilteredItems(compendium, item, index, matchFlags);
//     results.push(flagged);
//   });
//   return Promise.all(results);
// }

/**
 * Asynchronously creates a new item to be added to a compendium based on its type.
 *
 * @param {string} type - type of item to be created ("table" or "tables" for RollTable or
 * any other value for Item)
 * @param {Compendium} compendium - the compendium to import the new item into
 * @param {object} item - the data for the new item to be created
 * @return {Promise<object|null>} a Promise that resolves with the imported item or null if import failed
 */
async function createCompendiumItem(type, compendium, item) {
  let newItem;
  switch (type) {
    case "table":
    case "tables": {
      newItem = new RollTable(item);
      break;
    }
    default: {
      try {
        // eslint-disable-next-line no-await-in-loop
        newItem = await Item.create(item, {
          temporary: true,
          displaySheet: false,
        });
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
  return compendium.importDocument(newItem);
}

async function updateCompendiumItem(compendium, updateItem, existingItem) {
  // purge existing active effects on this item
  if (existingItem.results) await existingItem.deleteEmbeddedDocuments("TableResult", [], { deleteAll: true });
  if (existingItem.effects) await existingItem.deleteEmbeddedDocuments("ActiveEffect", [], { deleteAll: true });
  if (existingItem.flags) copySupportedItemFlags(existingItem, updateItem);
  DDBMuncher.munchNote(`Updating ${updateItem.name} compendium entry`);
  logger.debug(`Updating ${updateItem.name} compendium entry`);

  const update = existingItem.update(updateItem, { pack: compendium.metadata.id, render: false });
  // const update = existingItem.update(updateItem, { pack: compendium.metadata.id, recursive: false, render: false });
  return update;
}

async function deleteCreateCompendiumItem(compendium, updateItem, existingItem) {
  if (existingItem.flags) copySupportedItemFlags(existingItem, updateItem);
  DDBMuncher.munchNote(`Removing and Recreating ${updateItem.name} compendium entry`);
  logger.debug(`Removing and Recreating ${updateItem.name} compendium entry`);
  await existingItem.delete();
  let newItem = await createCompendiumItem(updateItem.type, compendium, updateItem);
  return newItem;
}

async function updateCompendiumItems(compendium, inputItems, index, matchFlags) {
  let results = [];
  for (const item of inputItems) {
    // eslint-disable-next-line no-await-in-loop
    const existingItems = await getFilteredItems(compendium, item, index, matchFlags);
    // we have a match, update first match
    if (existingItems.length >= 1) {
      const existingItem = existingItems[0];
      // eslint-disable-next-line require-atomic-updates
      item._id = existingItem._id;

      if (item.type !== existingItem.type || game.settings.get(SETTINGS.MODULE_ID, "munching-policy-delete-during-update")) {
        if (item.type !== existingItem.type) {
          logger.warn(`Item type mismatch ${item.name} from ${existingItem.type} to ${item.type}. DDB Importer will delete and recreate this item from scratch. You can most likely ignore this message.`);
        }
        let newItem = deleteCreateCompendiumItem(compendium, item, existingItem);
        results.push(newItem);
      } else {
        let update = updateCompendiumItem(compendium, item, existingItem);
        results.push(update);
      }
    }
  }

  return Promise.all(results);
}

async function createCompendiumItems(type, compendium, inputItems, index, matchFlags) {
  let promises = [];
  for (const item of inputItems) {
    // eslint-disable-next-line no-await-in-loop
    const existingItems = await getFilteredItems(compendium, item, index, matchFlags);
    // we have a single match
    if (existingItems.length === 0) {
      // eslint-disable-next-line no-await-in-loop
      let newItem = await createCompendiumItem(type, compendium, item);
      promises.push(newItem);
    }
  };
  return Promise.all(promises);
}

export async function updateMidiFlags() {
  const compendium = game.packs.get("midi-srd.Midi SRD Spells");
  const index = await compendium.getIndex();
  const docs = await compendium.getDocuments();
  const spells = docs.map((s) => s.toObject()).filter((s) => s.type === "spell");
  const filteredSpells = spells.map((s) => {
    delete s.flags.dynamiceffects;
    delete s.flags.core;
    if (s.flags.itemacro && s.flags.itemacro.macro.data.command == "") delete s.flags.itemacro;
    if (s.flags.itemacro) {
      delete s.flags.itemacro.macro._data;
      delete s.flags.itemacro.macro.data.author;
    }
    const effects = s.effects.map((e) => {
      if (e.flags) {
        let flags = { };
        if (e.flags.dae && e.flags.dae.macroRepeat !== "none") setProperty(flags, "dae.macroRepeat", e.flags.dae.macroRepeat);
        if (e.flags["midi-qol"]) flags["midi-qol"] = e.flags["midi-qol"];
        e.flags = flags;
      }
      return e;
    });
    s.effects = effects;

    return s;
  });

  updateCompendiumItems(compendium, filteredSpells, index, []);

}

export async function compendiumFoldersV10(document, type) {
  // using compendium folders?
  const compendiumFolderAdd = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-compendium-folders");

  if (compendiumFolderAdd) {
    // we create the compendium folder before import
    DDBMuncher.munchNote(`Adding ${document.name} to compendium folder`);
    logger.debug(`Adding ${document.name} to compendium folder`);
    const compendiumFolders = new DDBCompendiumFolders(type);
    await compendiumFolders.loadCompendium(type);
    await compendiumFolders.addToCompendiumFolder(document);
  }
}

export async function addCompendiumFolderIds(documents, type) {
  const compendiumFolderAdd = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-compendium-folders");
  if (compendiumFolderAdd && isNewerVersion(game.version, 11)) {
    const compendiumFolders = new DDBCompendiumFolders(type);
    await compendiumFolders.loadCompendium(type);

    const results = documents.map(async (d) => {
      const folderId = await compendiumFolders.getFolderId(d);
      // eslint-disable-next-line require-atomic-updates
      if (folderId) d.folder = folderId;
      return d;
    });
    return Promise.all(results);
  } else {
    return documents;
  }
}

export async function updateCompendium(type, documents, updateExisting = false, matchFlags = []) {
  logger.debug(`Getting compendium for update of ${type} documents (checking ${documents[type].length} docs)`);
  const compendium = await CompendiumHelper.getCompendiumType(type);
  compendium.configure({ locked: false });

  if (compendium.metadata.type === "Item" && game.settings.get(SETTINGS.MODULE_ID, "munching-policy-delete-during-update")) {
    await Item.deleteDocuments([], { pack: compendium.metadata.id, deleteAll: true });
  }

  if (game.user.isGM) {
    const initialIndex = await compendium.getIndex();
    // remove duplicate items based on name and type
    const filterItems = [...new Map(documents[type].map((item) => {
      let filterItem = item["name"] + item["type"];
      matchFlags.forEach((flag) => {
        filterItem += item.flags.ddbimporter[flag];
      });
      return [filterItem, item];
    })).values()];

    // v11 compendium folders - just add to doc before creation/update
    const inputItems = await addCompendiumFolderIds(filterItems, type);

    let updateResults = [];
    // update existing items
    DDBMuncher.munchNote(`Creating and updating ${inputItems.length} ${type} items in compendium...`, true);

    if (updateExisting) {
      updateResults = await updateCompendiumItems(compendium, inputItems, initialIndex, matchFlags);
      logger.debug(`Updated ${updateResults.length} existing ${type} items in compendium`);
    }

    // create new items
    const createResults = await createCompendiumItems(type, compendium, inputItems, initialIndex, matchFlags);
    logger.debug(`Created ${createResults.length} new ${type} items in compendium`);
    DDBMuncher.munchNote("", true);

    // compendium folders for v10
    if (isNewerVersion(11, game.version)) {
      createResults.forEach(async (document) => {
        await compendiumFoldersV10(document, type);
      });
    }

    const results = createResults.concat(updateResults);
    return new Promise((resolve) => resolve(results));
  } else {
    return [];
  }
}

export function updateCharacterItemFlags(itemData, replaceData) {
  if (itemData.flags?.ddbimporter?.importId) setProperty(replaceData, "flags.ddbimporter.importId", itemData.flags.ddbimporter.importId);
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
  if (hasProperty(itemData, "system.levels")) replaceData.system.levels = itemData.system.levels;
  return replaceData;
}

export async function updateMatchingItems(oldItems, newItems,
  { looseMatch = false, monster = false, keepId = false, keepDDBId = false, overrideId = false } = {}
) {
  let results = [];

  for (let newItem of newItems) {
    let item = duplicate(newItem);

    const matched = overrideId
      ? oldItems.find((oldItem) => getProperty(oldItem, "flags.ddbimporter.overrideId") == item._id)
      : await NameMatcher.looseItemNameMatch(item, oldItems, looseMatch, monster); // eslint-disable-line no-await-in-loop

    if (matched) {
      const match = duplicate(matched);
      // in some instances we want to keep the ddb id
      if (keepDDBId && hasProperty(item, "flags.ddbimporter.id")) {
        setProperty(match, "flags.ddbimporter.id", duplicate(item.flags.ddbimporter.id));
      }
      if (!item.flags.ddbimporter) {
        setProperty(item, "flags.ddbimporter", match.flags.ddbimporter);
      } else if (match.flags.ddbimporter && item.flags.ddbimporter) {
        const mergedFlags = mergeObject(item.flags.ddbimporter, match.flags.ddbimporter);
        setProperty(item, "flags.ddbimporter", mergedFlags);
      }
      if (!item.flags.monsterMunch && match.flags.monsterMunch) {
        setProperty(item, "flags.monsterMunch", match.flags.monsterMunch);
      }
      setProperty(item, "flags.ddbimporter.originalItemName", match.name);
      setProperty(item, "flags.ddbimporter.replaced", true);
      item = updateCharacterItemFlags(match, item);

      if (!keepId) delete item["_id"];
      results.push(item);
    }
  }

  return results;
}

export async function getIndividualOverrideItems(overrideItems) {
  const label = CompendiumHelper.getCompendiumLabel("custom");
  const compendium = CompendiumHelper.getCompendium(label);

  const compendiumItems = await Promise.all(overrideItems.map(async (item) => {
    const compendiumItem = duplicate(await compendium.getDocument(item.flags.ddbimporter.overrideId));
    setProperty(compendiumItem, "flags.ddbimporter.pack", `${compendium.metadata.id}`);
    if (hasProperty(item, "flags.ddbimporter.overrideItem")) {
      setProperty(compendiumItem, "flags.ddbimporter.overrideItem", item.flags.ddbimporter.overrideItem);
    } else {
      setProperty(compendiumItem, "flags.ddbimporter.overrideItem", {
        name: item.name,
        type: item.type,
        ddbId: item.flags.ddbimporter?.id
      });
    }

    return compendiumItem;
  }));

  const matchingOptions = {
    looseMatch: false,
    monster: false,
    keepId: true,
    keepDDBId: true,
    overrideId: true,
  };

  const remappedItems = await updateMatchingItems(overrideItems, compendiumItems, matchingOptions);

  return remappedItems;
}

/**
 *
 */
export async function loadPassedItemsFromCompendium(compendium, items, type,
  { looseMatch = false, monsterMatch = false, keepId = false, deleteCompendiumId = true,
    indexFilter = {}, // { fields: ["name", "flags.ddbimporter.id"] }
    keepDDBId = false } = {}
) {
  if (!compendium) return [];
  if (!compendium.indexed) await compendium.getIndex(indexFilter);
  const index = compendium.index;
  const firstPassItems = await index.filter((i) =>
    items.some((orig) => {
      const extraNames = (orig.flags?.ddbimporter?.dndbeyond?.alternativeNames)
        ? orig.flags.ddbimporter.dndbeyond.alternativeNames
        : [];
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
    let item = await compendium.getDocument(i._id).then((doc) => {
      const docData = doc.toObject();
      if (deleteCompendiumId) delete docData._id;
      delete docData.folder;
      SETTINGS.COMPENDIUM_REMOVE_FLAGS.forEach((flag) => {
        if (hasProperty(docData, flag)) setProperty(docData, flag, undefined);
      });

      return docData;
    });
    setProperty(item, "flags.ddbimporter.pack", `${compendium.metadata.id}`);
    loadedItems.push(item);
  }
  logger.debug(`compendium ${type} loaded items:`, loadedItems);

  const matchingOptions = {
    looseMatch,
    monster: monsterMatch,
    keepId,
    keepDDBId,
  };

  const results = await updateMatchingItems(items, loadedItems, matchingOptions);
  logger.debug(`compendium ${type} result items:`, results);
  return results;
}

/**
 * gets items from compendium
 * @param {*} items
 * @param {*} type
 * @param {*} options
 */
export async function getCompendiumItems(items, type,
  { compendiumLabel = null, looseMatch = false, monsterMatch = false, keepId = false, deleteCompendiumId = true,
    keepDDBId = false } = {}
) {

  const label = compendiumLabel ?? CompendiumHelper.getCompendiumLabel(type);
  const compendium = CompendiumHelper.getCompendium(label, false);
  if (!compendium) return [];

  const loadOptions = {
    looseMatch,
    monsterMatch,
    keepId,
    keepDDBId,
    deleteCompendiumId,
  };
  const results = await loadPassedItemsFromCompendium(compendium, items, type, loadOptions);

  return results;
}

export async function getSRDCompendiumItems(items, type, looseMatch = false, keepId = false, monster = false) {
  const compendiumName = SETTINGS.SRD_COMPENDIUMS.find((c) => c.type == type).name;
  const srdPack = CompendiumHelper.getCompendium(compendiumName);
  const srdIndices = ["name", "type", "flags.ddbimporter.dndbeyond.alternativeNames"];
  const index = await srdPack.getIndex({ fields: srdIndices });

  const matchedIds = index.filter((i) =>
    index.some((orig) => {
      const extraNames = (orig.flags?.ddbimporter?.dndbeyond?.alternativeNames)
        ? orig.flags.ddbimporter.dndbeyond.alternativeNames
        : [];
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

  const results = await updateMatchingItems(items, loadedItems, matchingOptions);
  logger.debug(`SRD ${type} result items:`, results);

  return results;
}

export async function srdFiddling(items, type) {
  const updateBool = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
  const useSrd = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-srd");

  if (useSrd && type == "monsters") {
    const srdItems = await getSRDCompendiumItems(items, type);
    // removed existing items from those to be imported
    logger.debug("Removing compendium items");
    const lessSrdItems = await removeItems(items, srdItems);
    const newIcons = lessSrdItems.concat(srdItems);
    const iconedItems = await Iconizer.updateIcons(newIcons);
    // console.warn("Final Monsters", srdItems);
    return iconedItems;
  } else if (useSrd) {
    logger.debug("Removing compendium items");
    let itemMap = {};
    const srdItems = await getSRDCompendiumItems(items, type);
    itemMap[type] = srdItems;
    logger.debug("Adding SRD compendium items");
    updateCompendium(type, itemMap, updateBool);
    // removed existing items from those to be imported
    return new Promise((resolve) => {
      removeItems(items, srdItems)
        .then((cleanedItems) => Iconizer.updateIcons(cleanedItems))
        .then((iconItems) => resolve(iconItems));
    });
  } else {
    const iconItems = await Iconizer.updateIcons(items);
    return iconItems;
  }
}


export async function daeFiddling(items) {
  const fiddle = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-dae-effects");
  const installed = game.modules.get("dae")?.active
    && (game.modules.get("Dynamic-Effects-SRD")?.active || game.modules.get("midi-srd")?.active);

  if (fiddle && installed) {
    return addItemsDAESRD(items);
  } else return items;
}

async function getCompendiumItemSpells(spells) {
  const getItemsOptions = {
    looseMatch: true,
    keepId: true,
    deleteCompendiumId: false,
  };
  const compendiumSpells = await getCompendiumItems(spells, "spell", getItemsOptions);
  const lessCompendiumSpells = await removeItems(spells, compendiumSpells);
  const srdSpells = await getSRDCompendiumItems(lessCompendiumSpells, "spell", true, true);
  const foundSpells = compendiumSpells.concat(srdSpells);

  const itemSpells = foundSpells.map((result) => {
    return {
      magicItem: {
        _id: result._id,
        id: result._id,
        pack: result.flags.ddbimporter.pack,
        img: result.img,
        name: result.name,
        flatDc: result.flags.ddbimporter.dndbeyond?.overrideDC,
        dc: result.flags.ddbimporter.dndbeyond?.dc,
      },
      _id: result._id,
      name: result.name,
      compendium: true,
    };
  });

  return [foundSpells, itemSpells];
}

/**
 * This adds magic item spells to an item, by looking in compendium or from a world.
 */
export async function addMagicItemSpells(input) {
  // check for existing spells in spell compendium & srdCompendium
  const [compendiumSpells, compendiumItemSpells] = await getCompendiumItemSpells(input.itemSpells);
  // if spells not found create world version
  const remainingSpells = {
    itemSpells: await Iconizer.updateMagicItemImages(await removeItems(input.itemSpells, compendiumSpells)),
  };
  const worldSpells = remainingSpells.length > 0
    ? await FolderHelper.updateFolderItems("itemSpells", remainingSpells)
    : [];
  const itemSpells = worldSpells.concat(compendiumItemSpells);

  logger.debug("itemSpells fetched", itemSpells);

  // scan the inventory for each item with spells and copy the imported data over
  input.inventory.forEach((item) => {
    logger.debug("replacing spells for item", item);
    const magicItemsSpells = getProperty(item, "flags.magicitems.spells");
    if (magicItemsSpells) {
      logger.debug("item.flags.magicitems.spells", magicItemsSpells);
      for (let [i, spell] of Object.entries(magicItemsSpells)) {
        const itemSpell = itemSpells.find((iSpell) => iSpell.name === spell.name
          && (iSpell.compendium || iSpell.magicItem.subFolder === item.name)
        );
        if (itemSpell) {
          for (const [key, value] of Object.entries(itemSpell.magicItem)) {
            item.flags.magicitems.spells[i][key] = value;
          }
        } else if (!game.user.can("ITEM_CREATE")) {
          ui.notifications.warn(`Magic Item ${item.name} cannot be enriched because of lacking player permissions`);
        } else {
          ui.notifications.warn(`Magic Item ${item.name}: cannot add spell ${spell.name}`);
        }
      }
    }
    // {
    //   magicItem: {
    //     _id: result._id,
    //     id: result._id,
    //     pack: result.flags.ddbimporter.pack,
    //     img: result.img,
    //     name: result.name,
    //     flatDc: result.flags.ddbimporter.dndbeyond?.overrideDC,
    //     dc: result.flags.ddbimporter.dndbeyond?.dc,
    //   },
    //   _id: result._id,
    //   name: result.name,
    //   compendium: true,
    // };
    const itemsWithSpells = getProperty(item, "flags.items-with-spells-5e.item-spells");
    if (itemsWithSpells) {
      logger.debug("item.flags.items-with-spells-5e.item-spells", item.flags["items-with-spells-5e"]["item-spells"]);
      itemsWithSpells.forEach((spellData, i) => {
        const itemSpell = itemSpells.find((iSpell) => iSpell.name === spellData.flags.ddbimporter.spellName
          && (iSpell.compendium || iSpell.magicItem.subFolder === item.name)
        );
        if (itemSpell) {
          item.flags["items-with-spells-5e"]["item-spells"][i].uuid = `Compendium.${itemSpell.magicItem.pack}.${itemSpell._id}`;
          if (item._id) {
            setProperty(item.flags["items-with-spells-5e"]["item-spells"][i], "flags.items-with-spells-5e.item-spells.parent-item", item._id);
          }
        } else if (!game.user.can("ITEM_CREATE")) {
          ui.notifications.warn(`Magic Item ${item.name} cannot be enriched because of lacking player permissions`);
        } else {
          ui.notifications.warn(`Magic Item ${item.name}: cannot add spell ${spellData.name}`);
        }
      });
    }
  });
}
