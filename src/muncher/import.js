import utils from "../lib/utils.js";
import logger from "../logger.js";
import DICTIONARY from "../dictionary.js";
import SETTINGS from "../settings.js";
import FileHelper from "../lib/FileHelper.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import DDBMuncher from "../apps/DDBMuncher.js";
import { addItemsDAESRD } from "./dae.js";
import { copyInbuiltIcons } from "../lib/Iconizer.js";
import { DDBCompendiumFolders } from "../lib/DDBCompendiumFolders.js";

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

function getCharacterUpdatePolicyTypes() {
  let itemTypes = [];
  itemTypes.push("class");
  if (game.settings.get("ddb-importer", "character-update-policy-feat")) itemTypes.push("feat");
  if (game.settings.get("ddb-importer", "character-update-policy-weapon")) itemTypes.push("weapon");
  if (game.settings.get("ddb-importer", "character-update-policy-equipment"))
    itemTypes = itemTypes.concat(DICTIONARY.types.equipment);
  if (game.settings.get("ddb-importer", "character-update-policy-spell")) itemTypes.push("spell");
  return itemTypes;
}

/**
 * Returns a combined array of all items to process, filtered by the user's selection on what to skip and what to include
 * @param {object} result object containing all character items sectioned as individual properties
 * @param {array[string]} sections an array of object properties which should be filtered
 */
export function filterItemsByUserSelection(result, sections) {
  let items = [];
  const validItemTypes = getCharacterUpdatePolicyTypes();

  for (const section of sections) {
    items = items.concat(result[section]).filter((item) => validItemTypes.includes(item.type));
  }
  return items;
};

async function copyFlagGroup(flagGroup, originalItem, targetItem) {
  if (targetItem.flags === undefined) targetItem.flags = {};
  // if we have generated effects we dont want to copy some flag groups. mostly for AE on spells
  const effectsProperty = getProperty(targetItem, "flags.ddbimporter.effectsApplied")
    && SETTINGS.EFFECTS_IGNORE_FLAG_GROUPS.includes(flagGroup);
  if (originalItem.flags && !!originalItem.flags[flagGroup] && !effectsProperty) {
    logger.debug(`Copying ${flagGroup} for ${originalItem.name}`);
    targetItem.flags[flagGroup] = originalItem.flags[flagGroup];
  }
}

/**
 * Copies across some flags for existing item
 * @param {*} items
 */
export async function copySupportedItemFlags(originalItem, targetItem) {
  SETTINGS.SUPPORTED_FLAG_GROUPS.forEach((flagGroup) => {
    copyFlagGroup(flagGroup, originalItem, targetItem);
  });
}

function getMonsterNames(name) {
  let magicNames = [name, name.toLowerCase()];

  // +2 sword
  let frontPlus = name.match(/^(\+\d*)\s*(.*)/);
  if (frontPlus) {
    magicNames.push(`${frontPlus[2].trim()}, ${frontPlus[1]}`.toLowerCase().trim());
  }

  // sword +2
  let backPlus = name.match(/(.*)\s*(\+\d*)$/);
  if (backPlus) {
    magicNames.push(`${backPlus[1].trim()}, ${backPlus[2]}`.toLowerCase().trim());
  }

  return magicNames;
}

function getLooseNames(name, extraNames = []) {
  let looseNames = extraNames;
  looseNames.push(name.toLowerCase());
  let refactNameArray = name.split("(")[0].trim().split(", ");
  refactNameArray.unshift(refactNameArray.pop());
  const refactName = refactNameArray.join(" ").trim();
  looseNames.push(refactName, refactName.toLowerCase());
  looseNames.push(refactName.replace(/\+\d*\s*/, "").trim().toLowerCase());
  looseNames.push(refactName.replace(/\+\d*\s*/, "").trim().toLowerCase().replace(/s$/, ""));

  let refactNamePlusArray = name.replace(/\+\d*\s*/, "").trim().split("(")[0].trim().split(", ");
  refactNamePlusArray.unshift(refactNamePlusArray.pop());
  const refactNamePlus = refactNamePlusArray.join(" ").trim();
  looseNames.push(refactNamePlus.toLowerCase());

  let deconNameArray = name.replace("(", "").replace(")", "").trim().split(",");
  deconNameArray.unshift(deconNameArray.pop());
  const deconName = deconNameArray.join(" ").trim();
  looseNames.push(deconName, deconName.toLowerCase());

  // word smart quotes are the worst
  looseNames.push(name.replace("'", "’").toLowerCase());
  looseNames.push(name.replace("’", "'").toLowerCase());
  looseNames.push(name.replace(/s$/, "").toLowerCase()); // trim s, e.g. crossbow bolt(s)
  looseNames.push(name.replace(",", "").toLowerCase()); // +1 weapons etc
  looseNames.push(`${name} attack`.toLowerCase()); // Claw Attack
  looseNames.push(name.split(",")[0].toLowerCase());

  return looseNames;
}

// The monster setting is less vigorous!
export async function looseItemNameMatch(item, items, loose = false, monster = false, magicMatch = false) {
  // first pass is a strict match
  let matchingItem = items.find((matchItem) => {
    let activationMatch = false;
    const alternativeNames = matchItem.flags?.ddbimporter?.dndbeyond?.alternativeNames;
    const extraNames = (alternativeNames) ? matchItem.flags.ddbimporter.dndbeyond.alternativeNames : [];

    const itemActivationProperty = Object.prototype.hasOwnProperty.call(item.system, 'activation');
    const matchItemActivationProperty = Object.prototype.hasOwnProperty.call(item.system, 'activation');

    if (itemActivationProperty && item.system?.activation?.type == "") {
      activationMatch = true;
    } else if (matchItemActivationProperty && itemActivationProperty) {
      // I can't remember why I added this. Maybe I was concerned about identical named items with
      // different activation times?
      // maybe I just want to check it exists?
      // causing issues so changed.
      // activationMatch = matchItem.system.activation.type === item.system.activation.type;
      activationMatch = matchItemActivationProperty && itemActivationProperty;
    } else if (!itemActivationProperty) {
      activationMatch = true;
    }

    const nameMatch = item.name === matchItem.name || extraNames.includes(item.name);
    const isMatch = nameMatch && item.type === matchItem.type && activationMatch;
    return isMatch;
  });

  if (!matchingItem && monster) {
    matchingItem = items.find(
      (matchItem) => {
        const monsterNames = getMonsterNames(matchItem.name);
        const monsterMatch = (monsterNames.includes(item.name.toLowerCase()))
          && DICTIONARY.types.monster.includes(matchItem.type)
          && DICTIONARY.types.inventory.includes(item.type);
        return monsterMatch;
      });
  }

  if (!matchingItem && magicMatch) {
    // is this an inverse match for updates?
    // if so strip out the non-magic names, we want to match on the magic names
    const magicName = item.name.replace(/(.*)\s+(\+\d*)\s*/, "$1, $2").trim().toLowerCase();
    matchingItem = items.find(
      (matchItem) => matchItem.name.trim().toLowerCase() == magicName
    );
  }

  if (!matchingItem && loose) {
    const looseNames = getLooseNames(item.name)
      .filter((name) => {
        if (!magicMatch) return true;
        const removeMagicName = name.replace(/\+\d*\s*/, "").trim();
        if (name === removeMagicName) return false;
        return true;
      });
    // lets go loosey goosey on matching equipment, we often get types wrong
    matchingItem = items.find(
      (matchItem) =>
        (looseNames.includes(matchItem.name.toLowerCase()) || looseNames.includes(matchItem.name.toLowerCase().replace(" armor", "")))
        && DICTIONARY.types.inventory.includes(item.type)
        && DICTIONARY.types.inventory.includes(matchItem.type)
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

async function updateCompendiumItems(compendium, inputItems, index, matchFlags) {
  let updates = [];
  inputItems.forEach(async (item) => {
    const existingItems = await getFilteredItems(compendium, item, index, matchFlags);
    // we have a match, update first match
    if (existingItems.length >= 1) {
      const existing = existingItems[0];
      // eslint-disable-next-line require-atomic-updates
      item._id = existing._id;
      DDBMuncher.munchNote(`Updating ${item.name} compendium entry`);
      // purge existing active effects on this item
      if (existing.results) await existing.deleteEmbeddedDocuments("TableResult", [], { deleteAll: true });
      if (existing.effects) await existing.deleteEmbeddedDocuments("ActiveEffect", [], { deleteAll: true });
      if (existing.flags) await copySupportedItemFlags(existing, item);

      const tableUpdate = await existing.update(item, { pack: compendium.metadata.id });
      // v10 bug - left in until fixed - tables don't update correctly
      // if (tableUpdate === undefined) console.warn("Undefined table update");
      updates.push(tableUpdate);
    }
  });

  // in v10 the table.update may not be returning all the updated items correctly

  return updates;
  // const results = await RollTable.updateDocuments(updates, { pack: compendium.metadata.id });
  // console.warn(results);
  // return results;
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

// window.updateMidiFlags = updateMidiFlags;

async function createCompendiumItems(type, compendium, inputItems, index, matchFlags) {
  let promises = [];
  // compendiumItems.forEach(async (item) => {
  for (const item of inputItems) {
    // eslint-disable-next-line no-await-in-loop
    const existingItems = await getFilteredItems(compendium, item, index, matchFlags);
    // we have a single match
    if (existingItems.length === 0) {
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
      promises.push(compendium.importDocument(newItem));
    }
  };
  return Promise.all(promises);
}

export async function compendiumFoldersV10(document, type) {
  // using compendium folders?
  const compendiumFolderAdd = game.settings.get("ddb-importer", "munching-policy-use-compendium-folders");

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
  const compendiumFolderAdd = game.settings.get("ddb-importer", "munching-policy-use-compendium-folders");
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

export async function updateCompendium(type, input, updateExisting = false, matchFlags = []) {
  logger.debug(`Getting compendium for update of ${type} documents (checking ${input[type].length} docs)`);
  const compendium = await CompendiumHelper.getCompendiumType(type);
  compendium.configure({ locked: false });

  if (game.user.isGM) {
    const initialIndex = await compendium.getIndex();
    // remove duplicate items based on name and type
    const filterItems = [...new Map(input[type].map((item) => {
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
    DDBMuncher.munchNote(`Creating and updating ${inputItems.length} new ${type} items in compendium...`, true);

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
  }
  return [];
}

async function getSRDIconMatch(type) {
  const compendiumName = SETTINGS.SRD_COMPENDIUMS.find((c) => c.type == type).name;
  const srdPack = CompendiumHelper.getCompendium(compendiumName);
  const srdIndices = ["name", "img", "prototypeToken.texture.src", "type", "system.activation", "prototypeToken.texture.scaleY", "prototypeToken.texture.scaleX"];
  const index = await srdPack.getIndex({ fields: srdIndices });
  return index;
}

export async function getSRDImageLibrary() {
  if (CONFIG.DDBI.SRD_LOAD.mapLoaded) return CONFIG.DDBI.SRD_LOAD.iconMap;
  const compendiumFeatureItems = await getSRDIconMatch("features");
  const compendiumInventoryItems = await getSRDIconMatch("inventory");
  const compendiumSpellItems = await getSRDIconMatch("spells");
  const compendiumMonsterFeatures = await getSRDIconMatch("monsterfeatures");
  const compendiumMonsters = await getSRDIconMatch("monsters");

  // eslint-disable-next-line require-atomic-updates
  CONFIG.DDBI.SRD_LOAD.iconMap = [
    ...compendiumInventoryItems,
    ...compendiumSpellItems,
    ...compendiumFeatureItems,
    ...compendiumMonsterFeatures,
    ...compendiumMonsters,
  ];
  return CONFIG.DDBI.SRD_LOAD.iconMap;
}

export async function copySRDIcons(items, srdImageLibrary = null, nameMatchList = []) {
  // eslint-disable-next-line require-atomic-updates
  if (!srdImageLibrary) srdImageLibrary = await getSRDImageLibrary();

  return new Promise((resolve) => {
    const srdItems = items.map((item) => {
      logger.debug(`Matching ${item.name}`);
      const nameMatch = nameMatchList.find((m) => m.name === item.name);
      if (nameMatch) {
        item.img = nameMatch.img;
      } else {
        looseItemNameMatch(item, srdImageLibrary, true).then((match) => {
          if (match) {
            srdImageLibrary.push({ name: item.name, img: match.img });
            item.img = match.img;
          }
        });
      }
      return item;

    });
    resolve(srdItems);
  });
}

export async function retainExistingIcons(items) {
  return new Promise((resolve) => {
    const newItems = items.map((item) => {
      if (item.flags.ddbimporter?.ignoreIcon) {
        logger.debug(`Retaining icon for ${item.name} to ${item.flags.ddbimporter.matchedImg}`);
        item.img = item.flags.ddbimporter.matchedImg;
      }
      return item;
    });
    resolve(newItems);
  });
}

async function getDDBItemImages(items, download) {
  DDBMuncher.munchNote(`Fetching DDB Item Images`);
  const downloadImages = (download) ? true : game.settings.get("ddb-importer", "munching-policy-download-images");
  const remoteImages = game.settings.get("ddb-importer", "munching-policy-remote-images");
  const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
  const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");

  const itemMap = items.map(async (item) => {
    let itemImage = {
      name: item.name,
      type: item.type,
      img: null,
      large: null,
    };

    const pathPostfix = useDeepPaths ? `/item/${item.type}` : "";

    if (item.flags && item.flags.ddbimporter && item.flags.ddbimporter && item.flags.ddbimporter.dndbeyond) {
      if (item.flags.ddbimporter.dndbeyond.avatarUrl) {
        const avatarUrl = item.flags.ddbimporter.dndbeyond['avatarUrl'];
        if (avatarUrl && avatarUrl != "") {
          DDBMuncher.munchNote(`Downloading ${item.name} image`);
          const imageNamePrefix = useDeepPaths ? "" : "item";
          const downloadOptions = { type: "item", name: item.name, download: downloadImages, remoteImages, targetDirectory, pathPostfix, imageNamePrefix };
          const smallImage = await FileHelper.getImagePath(avatarUrl, downloadOptions);
          logger.debug(`Final image ${smallImage}`);
          itemImage.img = smallImage;
        }
      }
      if (item.flags.ddbimporter.dndbeyond.largeAvatarUrl) {
        const largeAvatarUrl = item.flags.ddbimporter.dndbeyond['largeAvatarUrl'];
        if (largeAvatarUrl && largeAvatarUrl != "") {
          const imageNamePrefix = useDeepPaths ? "" : "item";
          const name = useDeepPaths ? `${item.name}-large` : item.name;
          const downloadOptions = { type: "item-large", name, download: downloadImages, remoteImages, targetDirectory, pathPostfix, imageNamePrefix };
          const largeImage = await FileHelper.getImagePath(largeAvatarUrl, downloadOptions);
          itemImage.large = largeImage;
          if (!itemImage.img) itemImage.img = largeImage;
        }
      }
    }

    DDBMuncher.munchNote("");
    return itemImage;
  });

  return Promise.all(itemMap);
}

async function getDDBGenericItemImages(download) {
  DDBMuncher.munchNote(`Fetching DDB Generic Item icons`);
  const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
  const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");
  const imageNamePrefix = useDeepPaths ? "" : "item";
  const pathPostfix = useDeepPaths ? "/ddb/item" : "";

  const itemMap = DICTIONARY.items.map(async (item) => {
    const downloadOptions = { type: "item", name: item.filterType, download, targetDirectory, pathPostfix, imageNamePrefix };
    const img = await FileHelper.getImagePath(item.img, downloadOptions);
    let itemIcons = {
      filterType: item.filterType,
      img: img,
    };
    return itemIcons;
  });

  DDBMuncher.munchNote("");
  return Promise.all(itemMap);
}

async function getDDBGenericLootImages(download) {
  DDBMuncher.munchNote(`Fetching DDB Generic Loot icons`);
  const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
  const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");
  const imageNamePrefix = useDeepPaths ? "" : "equipment";
  const pathPostfix = useDeepPaths ? "/ddb/loot" : "";

  const itemMap = DICTIONARY.genericItemIcons.map(async (item) => {
    const downloadOptions = { type: "equipment", name: item.name, download, targetDirectory, pathPostfix, imageNamePrefix };
    const img = await FileHelper.getImagePath(item.img, downloadOptions);
    let itemIcons = {
      name: item.name,
      img: img,
    };
    return itemIcons;
  });

  DDBMuncher.munchNote("");
  return Promise.all(itemMap);
}

export async function getDDBGenericItemIcons(items, download) {
  const genericItems = await getDDBGenericItemImages(download);
  const genericLoots = await getDDBGenericLootImages(download);

  let updatedItems = items.map((item) => {
    // logger.debug(item.name);
    // logger.debug(item.flags.ddbimporter.dndbeyond.filterType);
    const excludedItems = ["spell", "feat", "class"];
    if (!excludedItems.includes(item.type)
        && item.flags
        && item.flags.ddbimporter
        && item.flags.ddbimporter.dndbeyond) {
      let generic = null;
      if (item.flags.ddbimporter.dndbeyond.filterType) {
        generic = genericItems.find((i) => i.filterType === item.flags.ddbimporter.dndbeyond.filterType);
      } else if (item.flags.ddbimporter.dndbeyond.type) {
        generic = genericLoots.find((i) => i.name === item.flags.ddbimporter.dndbeyond.type);
      }
      if (generic && (!item.img || item.img == "" || item.img == CONST.DEFAULT_TOKEN)) {
        item.img = generic.img;
      }
    }
    return item;
  });
  return Promise.all(updatedItems);
}

async function getDDBSchoolSpellImages(download) {
  DDBMuncher.munchNote(`Fetching spell school icons`);
  const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
  const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");
  const imageNamePrefix = useDeepPaths ? "" : "spell";
  const pathPostfix = useDeepPaths ? "/spell/school" : "";

  const schoolMap = DICTIONARY.spell.schools.map(async (school) => {
    const downloadOptions = { type: "spell", name: school.name, download, targetDirectory, imageNamePrefix, pathPostfix };
    const img = await FileHelper.getImagePath(school.img, downloadOptions);
    let schoolIcons = {
      name: school.name,
      img: img,
      id: school.id,
    };
    return schoolIcons;
  });

  DDBMuncher.munchNote("");
  return Promise.all(schoolMap);
}

export async function getDDBSpellSchoolIcons(items, download) {
  const schools = await getDDBSchoolSpellImages(download);

  let updatedItems = items.map((item) => {
    // logger.debug(item.name);
    // logger.debug(item.flags.ddbimporter.dndbeyond);
    if (item.type == "spell") {
      const school = schools.find((school) => school.id === item.system.school);
      if (school && (!item.img || item.img == "" || item.img == CONST.DEFAULT_TOKEN)) {
        item.img = school.img;
      }
    }
    return item;
  });
  return Promise.all(updatedItems);
}

export async function getDDBEquipmentIcons(items, download) {
  const itemImages = await getDDBItemImages(items.filter((item) => DICTIONARY.types.inventory.includes(item.type)), download);

  let updatedItems = items.map((item) => {
    // logger.debug(item.name);
    // logger.debug(item.flags.ddbimporter.dndbeyond);
    if (DICTIONARY.types.inventory.includes(item.type)) {
      if (!item.img || item.img == "" || item.img == CONST.DEFAULT_TOKEN) {
        const imageMatch = itemImages.find((m) => m.name == item.name && m.type == item.type);
        if (imageMatch && imageMatch.img) {
          item.img = imageMatch.img;
          setProperty(item, "flags.ddbimporter.keepIcon", true);
        }
        if (imageMatch && imageMatch.large) {
          item.flags.ddbimporter.dndbeyond['pictureUrl'] = imageMatch.large;
        }
      }
    }
    return item;
  });
  return Promise.all(updatedItems);
}


export async function updateMagicItemImages(items) {
  const useSRDCompendiumIcons = game.settings.get("ddb-importer", "character-update-policy-use-srd-icons");
  const ddbSpellIcons = game.settings.get("ddb-importer", "character-update-policy-use-ddb-spell-icons");
  const inbuiltIcons = game.settings.get("ddb-importer", "character-update-policy-use-inbuilt-icons");
  const ddbItemIcons = game.settings.get("ddb-importer", "character-update-policy-use-ddb-item-icons");

  // if we still have items to add, add them
  if (items.length > 0) {
    if (ddbItemIcons) {
      logger.debug("Magic items: adding equipment icons");
      items = await getDDBEquipmentIcons(items, true);
    }

    if (inbuiltIcons) {
      logger.debug("Magic items: adding inbuilt icons");
      items = await copyInbuiltIcons(items);
    }

    if (useSRDCompendiumIcons) {
      logger.debug("Magic items: adding srd compendium icons");
      items = await copySRDIcons(items);
    }

    if (ddbSpellIcons) {
      logger.debug("Magic items: adding ddb spell school icons");
      items = await getDDBSpellSchoolIcons(items, true);
    }
  }
  return items;
}

/**
 * Updates game folder items
 * @param {*} type
 */
async function updateFolderItems(type, input, update = true) {
  if (type === "itemSpells") {
    // eslint-disable-next-line require-atomic-updates
    input[type] = await updateMagicItemImages(input[type]);
  }

  const folderLookup = SETTINGS.GAME_FOLDER_LOOKUPS.find((c) => c.type == type);
  const itemFolderNames = [...new Set(input[type]
    .filter((item) => item.flags?.ddbimporter?.dndbeyond?.lookupName)
    .map((item) => item.flags.ddbimporter.dndbeyond.lookupName))];

  const getSubFolders = async () => {
    return Promise.all(
      itemFolderNames.map((name) => {
        return utils.getFolder(folderLookup.folder, name);
      })
    );
  };

  const subFolders = await getSubFolders();

  const defaultItemsFolder = await utils.getFolder(folderLookup.folder);
  const existingItems = await game.items.entities.filter((item) => {
    const itemFolder = subFolders.find((folder) =>
      item.flags?.ddbimporter?.dndbeyond?.lookupName
      && folder.name === item.flags.ddbimporter.dndbeyond.lookupName
    );
    return itemFolder && item.type === folderLookup.itemType && item.folder === itemFolder._id;
  });

  // update or create folder items
  const updateItems = async () => {
    return Promise.all(
      input[type]
        .filter((item) => existingItems.some((idx) => idx.name === item.name))
        .map(async (item) => {
          const existingItem = await existingItems.find((existing) => item.name === existing.name);
          item._id = existingItem._id;
          logger.info(`Updating ${type} ${item.name}`);
          await copySupportedItemFlags(existingItem, item);
          await Item.update(item);
          return item;
        })
    );
  };

  const createItems = async () => {
    return Promise.all(
      input[type]
        .filter((item) => !existingItems.some((idx) => idx.name === item.name))
        .map(async (item) => {
          if (!game.user.can("ITEM_CREATE")) {
            ui.notifications.warn(`Cannot create ${folderLookup.type} ${item.name} for ${type}`);
          } else {
            logger.info(`Creating ${type} ${item.name}`);
            const itemsFolder = subFolders.find((folder) =>
              item.flags?.ddbimporter?.dndbeyond?.lookupName
              && folder.name === item.flags.ddbimporter.dndbeyond.lookupName
            );
            item.folder = (itemsFolder) ? itemsFolder._id : defaultItemsFolder._id;
            await Item.create(item);
          }
          return item;
        })
    );
  };

  if (update) await updateItems();
  await createItems();

  // lets generate our compendium info like id, pack and img for use
  // by things like magicitems
  const folderIds = [defaultItemsFolder._id, ...subFolders.map((f) => f._id)];
  const items = Promise.all(
    game.items.entities
      .filter((item) => item.type === folderLookup.itemType && folderIds.includes(item.folder))
      .map((result) => {
        const subFolder = (result.flags.ddbimporter?.dndbeyond?.lookupName)
          ? result.flags.ddbimporter.dndbeyond.lookupName
          : null;
        return {
          magicItem: {
            _id: result._id,
            id: result._id,
            pack: "world",
            img: result.img,
            name: result.name,
            subFolder: subFolder,
            flatDc: result.flags?.ddbimporter?.dndbeyond?.overrideDC,
            dc: result.flags?.ddbimporter?.dndbeyond?.dc,
          },
          _id: result._id,
          name: result.name,
          compendium: false,
        };
      })
  );
  return items;
}

export function updateCharacterItemFlags(itemData, replaceData) {
  if (itemData.flags?.ddbimporter?.importId) setProperty(replaceData, "flags.ddbimporter.importId", itemData.flags.ddbimporter.importId);
  if (itemData.system.quantity) replaceData.system.quantity = itemData.system.quantity;
  if (itemData.system.attuned) replaceData.system.attuned = itemData.system.attuned;
  if (itemData.system.attunement) replaceData.system.attunement = itemData.system.attunement;
  if (itemData.system.equipped) replaceData.system.equipped = itemData.system.equipped;
  if (itemData.system.uses) replaceData.system.uses = itemData.system.uses;
  if (itemData.system.resources) replaceData.system.resources = itemData.system.resources;
  if (itemData.system.consume) replaceData.system.consume = itemData.system.consume;
  if (itemData.system.preparation) replaceData.system.preparation = itemData.system.preparation;
  if (itemData.system.proficient) replaceData.system.proficient = itemData.system.proficient;
  if (itemData.system.ability) replaceData.system.ability = itemData.system.ability;
  return replaceData;
}

export async function updateMatchingItems(oldItems, newItems, inOptions) {
  let results = [];

  const defaultOptions = {
    looseMatch: false,
    monster: false,
    keepId: false,
    keepDDBId: false,
    overrideId: false,
  };
  const options = mergeObject(defaultOptions, inOptions);

  for (let newItem of newItems) {
    let item = duplicate(newItem);

    const matched = options.overrideId
      ? oldItems.find((oldItem) => getProperty(oldItem, "flags.ddbimporter.overrideId") == item._id)
      : await looseItemNameMatch(item, oldItems, options.looseMatch, options.monster); // eslint-disable-line no-await-in-loop

    if (matched) {
      const match = duplicate(matched);
      // in some instances we want to keep the ddb id
      if (options.keepDDBId && hasProperty(item, "flags.ddbimporter.id")) {
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

      if (!options.keepId) delete item["_id"];
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
export async function loadPassedItemsFromCompendium(compendium, items, type, inOptions) {
  if (!compendium) return [];
  const defaultOptions = {
    looseMatch: false,
    monsterMatch: false,
    keepId: false,
    deleteCompendiumId: true,
    indexFilter: {}, // { fields: ["name", "flags.ddbimporter.id"] }
    keepDDBId: false,
  };
  const options = mergeObject(defaultOptions, inOptions);

  if (!compendium.indexed) await compendium.getIndex(options.indexFilter);
  const index = compendium.index;
  const firstPassItems = await index.filter((i) =>
    items.some((orig) => {
      const extraNames = (orig.flags?.ddbimporter?.dndbeyond?.alternativeNames)
        ? orig.flags.ddbimporter.dndbeyond.alternativeNames
        : [];
      if (options.looseMatch) {
        const looseNames = getLooseNames(orig.name, extraNames);
        return looseNames.includes(i.name.split("(")[0].trim().toLowerCase());
      } else if (options.monsterMatch) {
        const monsterNames = getMonsterNames(orig.name);
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
      if (options.deleteCompendiumId) delete docData._id;
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
    looseMatch: options.looseMatch,
    monster: options.monsterMatch,
    keepId: options.keepId,
    keepDDBId: options.keepDDBId,
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
export async function getCompendiumItems(items, type, inOptions) {
  const defaultOptions = {
    compendiumLabel: null,
    looseMatch: false,
    monsterMatch: false,
    keepId: false,
    deleteCompendiumId: true,
    keepDDBId: false,
  };
  const options = mergeObject(defaultOptions, inOptions);

  if (!options.compendiumLabel) {
    options.compendiumLabel = CompendiumHelper.getCompendiumLabel(type);
  }
  const compendium = CompendiumHelper.getCompendium(options.compendiumLabel, false);
  if (!compendium) return [];

  const loadOptions = {
    looseMatch: options.looseMatch,
    monsterMatch: options.monsterMatch,
    keepId: options.keepId,
    keepDDBId: options.keepDDBId,
    deleteCompendiumId: options.deleteCompendiumId,
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
        const looseNames = getLooseNames(orig.name, extraNames);
        return looseNames.includes(i.name.split("(")[0].trim().toLowerCase());
      } else {
        return i.name === orig.name || extraNames.includes(i.name);
      }
    })
  ).map((i) => i._id);

  const loadedItems = (await srdPack.getDocuments(matchedIds))
    .map((i) => {
      const item = i.toObject();
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

/**
 * Add an item to effects, if available
 * @param {*} items
 */
export function addItemEffectIcons(items) {
  logger.debug("Adding Icons to effects");
  items.forEach((item) => {
    if (item.effects && (item.img && (item.img !== "" || item.img !== CONST.DEFAULT_TOKEN))) {
      item.effects.forEach((effect) => {

        if (!effect.icon || effect.icon === "" || effect.icon === CONST.DEFAULT_TOKEN) {
          effect.icon = item.img;
        }
      });
    }

  });
  return items;
}

export function addActorEffectIcons(actor) {
  if (!actor.effects) return actor;
  logger.debug("Adding Icons to actor effects");
  actor.effects.forEach((effect) => {
    const name = getProperty(effect, "flags.ddbimporter.originName");
    if (name) {
      const actorItem = actor.items.find((i) => i.name === name);
      if (actorItem) {
        effect.icon = actorItem.img;
      }
    }
  });
  return actor;
}

/**
 * TO DO : This function should do something.
 * @param {*} effects
 */
export function addACEffectIcons(effects) {
  logger.debug("Adding Icons to AC effects");

  // effects.forEach((item) => {
  //   if (!effect.icon || effect.icon === "" || effect.icon === CONST.DEFAULT_TOKEN) {
  //     effect.icon = item.img;
  //   }
  // });
  return effects;
}

export async function updateIcons(items, srdIconUpdate = true, monster = false, monsterName = "") {
  // this will use ddb item icons as a fall back
  const ddbItemIcons = game.settings.get("ddb-importer", "munching-policy-use-ddb-item-icons");
  if (ddbItemIcons) {
    logger.debug("DDB Equipment Icon Match");
    items = await getDDBEquipmentIcons(items);
  }

  const inBuiltIcons = game.settings.get("ddb-importer", "munching-policy-use-inbuilt-icons");
  if (inBuiltIcons) {
    logger.debug(`Inbuilt icon matching (Monster? ${monster ? monsterName : monster})`);
    items = await copyInbuiltIcons(items, monster, monsterName);
  }

  // check for SRD icons
  const srdIcons = game.settings.get("ddb-importer", "munching-policy-use-srd-icons");
  // eslint-disable-next-line require-atomic-updates
  if (srdIcons && srdIconUpdate) {
    logger.debug("SRD Icon Matching");
    items = await copySRDIcons(items);
  }

  // this will use ddb spell school icons as a fall back
  const ddbSpellIcons = game.settings.get("ddb-importer", "munching-policy-use-ddb-spell-icons");
  if (ddbSpellIcons) {
    logger.debug("DDB Spell School Icon Match");
    items = await getDDBSpellSchoolIcons(items, true);
  }

  // this will use ddb generic icons as a fall back
  const ddbGenericItemIcons = game.settings.get("ddb-importer", "munching-policy-use-ddb-generic-item-icons");
  if (ddbGenericItemIcons) {
    logger.debug("DDB Generic Item Icon Match");
    items = await getDDBGenericItemIcons(items, true);
  }

  // update any generated effects
  const addEffects = game.settings.get("ddb-importer", "munching-policy-add-effects");
  if (addEffects) {
    items = addItemEffectIcons(items);
  }

  return items;
}

export async function srdFiddling(items, type) {
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const useSrd = game.settings.get("ddb-importer", "munching-policy-use-srd");

  if (useSrd && type == "monsters") {
    const srdItems = await getSRDCompendiumItems(items, type);
    // removed existing items from those to be imported
    logger.debug("Removing compendium items");
    const lessSrdItems = await removeItems(items, srdItems);
    const newIcons = lessSrdItems.concat(srdItems);
    const iconedItems = await updateIcons(newIcons);
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
        .then((cleanedItems) => updateIcons(cleanedItems))
        .then((iconItems) => resolve(iconItems));
    });
  } else {
    const iconItems = await updateIcons(items);
    return iconItems;
  }
}


export async function daeFiddling(items) {
  const fiddle = game.settings.get("ddb-importer", "munching-policy-use-dae-effects");
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
    itemSpells: await removeItems(input.itemSpells, compendiumSpells),
  };
  const worldSpells = remainingSpells.length > 0
    ? await updateFolderItems("itemSpells", remainingSpells)
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
