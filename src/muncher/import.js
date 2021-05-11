import utils from "../utils.js";
import logger from "../logger.js";
import DICTIONARY from "../dictionary.js";
import { munchNote } from "./utils.js";
import { addItemsDAESRD } from "./dae.js";
import { copyInbuiltIcons } from "../icons/index.js";

// a mapping of compendiums with content type
const compendiumLookup = [
  { type: "inventory", compendium: "entity-item-compendium" },
  { type: "item", compendium: "entity-item-compendium" },
  { type: "spells", compendium: "entity-spell-compendium" },
  { type: "feats", compendium: "entity-feat-compendium" },
  { type: "spell", compendium: "entity-spell-compendium" },
  { type: "itemspells", compendium: "entity-item-spell-compendium" },
  { type: "features", compendium: "entity-feature-compendium" },
  { type: "classes", compendium: "entity-class-compendium" },
  { type: "class", compendium: "entity-class-compendium" },
  { type: "races", compendium: "entity-race-compendium" },
  { type: "traits", compendium: "entity-trait-compendium" },
  { type: "race", compendium: "entity-race-compendium" },
  { type: "npc", compendium: "entity-monster-compendium" },
  { type: "monsters", compendium: "entity-monster-compendium" },
  { type: "feat", name: "entity-feature-compendium" },
  { type: "weapon", name: "entity-item-compendium" },
  { type: "consumable", name: "entity-item-compendium" },
  { type: "tool", name: "entity-item-compendium" },
  { type: "loot", name: "entity-item-compendium" },
  { type: "backpack", name: "entity-item-compendium" },
  { type: "spell", name: "entity-spell-compendium" },
  { type: "equipment", name: "entity-item-compendium" },
  { type: "monsterfeatures", name: "entity-feature-compendium" },
];

const srdCompendiumLookup = [
  { type: "inventory", name: "dnd5e.items" },
  { type: "spells", name: "dnd5e.spells" },
  { type: "features", name: "dnd5e.classfeatures" },
  { type: "races", name: "dnd5e.races" },
  { type: "traits", name: "dnd5e.races" },
  { type: "features", name: "dnd5e.classfeatures" },
  { type: "feat", name: "dnd5e.classfeatures" },
  { type: "feats", name: "dnd5e.classfeatures" },
  { type: "classes", name: "dnd5e.classfeatures" },
  { type: "weapon", name: "dnd5e.items" },
  { type: "consumable", name: "dnd5e.items" },
  { type: "tool", name: "dnd5e.items" },
  { type: "loot", name: "dnd5e.items" },
  { type: "backpack", name: "dnd5e.items" },
  { type: "spell", name: "dnd5e.spells" },
  { type: "equipment", name: "dnd5e.items" },
  { type: "monsters", name: "dnd5e.monsters" },
  { type: "monsterfeatures", name: "dnd5e.monsterfeatures" },
];

var srdIconMapLoaded = false;
var srdIconMap = {};
var srdPacksLoaded = {};
var srdPacks = {};

async function loadSRDPacks(compendiumName) {
  if (srdPacksLoaded[compendiumName]) return;
  const srdPack = await game.packs.get(compendiumName);
  if (!srdPack) {
    logger.error(`Failed to load SRDPack ${compendiumName}`);
  } else {
    srdPacks[compendiumName] = await srdPack.getContent().then((data) => data.map((i) => i.data));
    // eslint-disable-next-line require-atomic-updates
    srdPacksLoaded[compendiumName] = true;
  }
}

const gameFolderLookup = [
  {
    type: "itemSpells",
    folder: "magic-item-spells",
    itemType: "spell",
  },
  {
    type: "magicItems",
    folder: "magic-items",
    itemType: "item",
  },
  {
    type: "spells",
    folder: "spell",
    itemType: "spell",
  },
  {
    type: "monsters",
    folder: "npc",
    itemType: "actor",
  },
];


/**
 * Removes items
 * @param {*} items
 * @param {*} itemsToRemove
 */
export async function removeItems(items, itemsToRemove) {
  return new Promise((resolve) => {
    resolve(
      items.filter(
        (item) =>
          !itemsToRemove.some((originalItem) => item.name === originalItem.name && item.type === originalItem.type)
      )
    );
  });
}

const getCharacterUpdatePolicyTypes = () => {
  let itemTypes = [];
  itemTypes.push("class");
  if (game.settings.get("ddb-importer", "character-update-policy-feat")) itemTypes.push("feat");
  if (game.settings.get("ddb-importer", "character-update-policy-weapon")) itemTypes.push("weapon");
  if (game.settings.get("ddb-importer", "character-update-policy-equipment"))
    itemTypes = itemTypes.concat(DICTIONARY.types.equipment);
  if (game.settings.get("ddb-importer", "character-update-policy-spell")) itemTypes.push("spell");
  return itemTypes;
};

/**
 * Returns a combined array of all items to process, filtered by the user's selection on what to skip and what to include
 * @param {object} result object containing all character items sectioned as individual properties
 * @param {array[string]} sections an array of object properties which should be filtered
 */
export const filterItemsByUserSelection = (result, sections) => {
  let items = [];
  const validItemTypes = getCharacterUpdatePolicyTypes();

  for (const section of sections) {
    items = items.concat(result[section]).filter((item) => validItemTypes.includes(item.type));
  }
  return items;
};

async function copyFlagGroup(flagGroup, originalItem, targetItem) {
  if (targetItem.flags === undefined) targetItem.flags = {};
  if (originalItem.flags && !!originalItem.flags[flagGroup]) {
    logger.debug(`Copying ${flagGroup} for ${originalItem.name}`);
    targetItem.flags[flagGroup] = originalItem.flags[flagGroup];
  }
}

/**
 * Copies across some flags for existing item
 * @param {*} items
 */
export async function copySupportedItemFlags(originalItem, item) {
  // copyFlagGroup("dynamiceffects", originalItem, item);
  copyFlagGroup("dae", originalItem, item);
  copyFlagGroup("maestro", originalItem, item);
  copyFlagGroup("mess", originalItem, item);
  copyFlagGroup("favtab", originalItem, item);
  copyFlagGroup("midi-qol", originalItem, item);
  copyFlagGroup("itemacro", originalItem, item);
  copyFlagGroup("itemmacro", originalItem, item);
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
export async function looseItemNameMatch(item, items, loose = false, monster = false) {
  // first pass is a strict match
  let matchingItem = items.find((matchItem) => {
    let activationMatch = false;
    const alternativeNames = (((matchItem.flags || {}).ddbimporter || {}).dndbeyond || {}).alternativeNames;
    const extraNames = (alternativeNames) ? matchItem.flags.ddbimporter.dndbeyond.alternativeNames : [];

    const itemActivationProperty = Object.prototype.hasOwnProperty.call(item.data, 'activation');
    const matchItemActivationProperty = Object.prototype.hasOwnProperty.call(item.data, 'activation');

    if (itemActivationProperty && item.data?.activation?.type == "") {
      activationMatch = true;
    } else if (matchItemActivationProperty && itemActivationProperty) {
      // I can't remember why I added this. Maybe I was concerned about identical named items with
      // different activation times?
      // maybe I just want to check it exists?
      // causing issues so changed.
      // activationMatch = matchItem.data.activation.type === item.data.activation.type;
      activationMatch = matchItemActivationProperty && itemActivationProperty;
    } else if (!itemActivationProperty) {
      activationMatch = true;
    }

    const nameMatch = item.name === matchItem.name || extraNames.includes(item.name);
    const isMatch = nameMatch && item.type === matchItem.type && activationMatch;
    return isMatch;
  });

  if (!matchingItem && monster) {
    // console.warn(`lose monster match ${item.name}`);
    // console.log(item);
    // console.log(items);
    matchingItem = items.find(
      (matchItem) => {
        const monsterNames = getMonsterNames(matchItem.name);
        // console.log(`matchItem ${matchItem.name}`);
        // console.log(monsterNames);
        const monsterMatch = (monsterNames.includes(item.name.toLowerCase())) &&
          DICTIONARY.types.monster.includes(matchItem.type) &&
          DICTIONARY.types.inventory.includes(item.type);
        // console.log(monsterMatch);
        return monsterMatch;
      });
    // console.log(matchingItem);
  }

  if (!matchingItem && loose) {
    const looseNames = getLooseNames(item.name);
    // lets go loosey goosey on matching equipment, we often get types wrong
    matchingItem = items.find(
      (matchItem) =>
        (looseNames.includes(matchItem.name.toLowerCase()) || looseNames.includes(matchItem.name.toLowerCase().replace(" armor", ""))) &&
        DICTIONARY.types.inventory.includes(item.type) &&
        DICTIONARY.types.inventory.includes(matchItem.type)
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
  if (matchFlags.length === 0) return true;
  let matched = false;
  matchFlags.forEach((flag) => {
    if (item1.flags.ddbimporter[flag] &&
      item2.flags.ddbimporter[flag] &&
      item1.flags.ddbimporter[flag] === item2.flags.ddbimporter[flag]
    ) {
      matched = true;
    }
  });

  return matched;
}

async function getFilteredItems(compendium, item, index, matchFlags) {
  const indexEntries = index.filter((idx) => idx.name === item.name);

  const mapped = await Promise.all(indexEntries.map((idx) => {
    const entry = compendium.getEntity(idx._id);
    return entry;
  }));

  const flagFiltered = mapped.filter((idx) => {
    const nameMatch = idx.name === item.name;
    const flagMatched = flagMatch(idx, item, matchFlags);
    return nameMatch && flagMatched;
  });

  return flagFiltered;
}

async function getFlaggedItems(compendium, items, index, matchFlags) {
  let results = [];
  items.forEach((item) => {
    const flagged = getFilteredItems(compendium, item, index, matchFlags);
    results.push(flagged);
  });
  return Promise.all(results);
}

async function updateCompendiumItems(compendium, compendiumItems, index, matchFlags) {
  let promises = [];
  compendiumItems.forEach(async (item) => {
    const existingItems = await getFilteredItems(compendium, item, index, matchFlags);
    // we have a match, update first match
    if (existingItems.length >= 1) {
      const existing = existingItems[0];
      // eslint-disable-next-line require-atomic-updates
      item._id = existing._id;
      munchNote(`Updating ${item.name}`);
      await copySupportedItemFlags(existing, item);
      promises.push(compendium.updateEntity(item));
    }
  });
  return Promise.all(promises);
}

async function createCompendiumItems(compendium, compendiumItems, index, matchFlags) {
  let promises = [];
  compendiumItems.forEach(async (item) => {
    const existingItems = await getFilteredItems(compendium, item, index, matchFlags);
    // we have a single match
    if (existingItems.length === 0) {
      const newItem = await Item.create(item, {
        temporary: true,
        displaySheet: false,
      });
      munchNote(`Creating ${item.name}`);
      promises.push(compendium.importEntity(newItem));
    }
  });
  return Promise.all(promises);
}

export async function updateCompendium(type, input, update = null, matchFlags = []) {
  let importPolicy = game.settings.get("ddb-importer", "entity-import-policy");
  if (update !== null) {
    if (update == true) {
      importPolicy = 0;
    } else {
      importPolicy = 1;
    }
  }
  const compendiumName = compendiumLookup.find((c) => c.type == type).compendium;
  const compendiumLabel = game.settings.get("ddb-importer", compendiumName);
  const compendium = await game.packs.find((pack) => pack.collection === compendiumLabel);
  compendium.locked = false;

  if (game.user.isGM && importPolicy !== 2) {
    const initialIndex = await compendium.getIndex();
    // remove duplicate items based on name and type
    const compendiumItems = [...new Map(input[type].map((item) => [item["name"] + item["type"], item])).values()];

    // update existing items
    if (importPolicy === 0) {
      await updateCompendiumItems(compendium, compendiumItems, initialIndex, matchFlags);
    }

    // create new items
    await createCompendiumItems(compendium, compendiumItems, initialIndex, matchFlags);

    const updatedIndex = await compendium.getIndex();
    const updateItems = getFlaggedItems(compendium, compendiumItems, updatedIndex, matchFlags);


    // lets generate our compendium info like id, pack and img for use
    // by things like magicitems
    const items = updateItems.then((entries) => {
      const results = entries.flat().map((result) => {
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


export async function getImagePath(imageUrl, type = "ddb", name = "", download = false, remoteImages = false) {
  const uploadDirectory = game.settings.get("ddb-importer", "image-upload-directory").replace(/^\/|\/$/g, "");
  const downloadImage = (download) ? download : game.settings.get("ddb-importer", "munching-policy-download-images");
  const remoteImage = (remoteImages) ? remoteImages : game.settings.get("ddb-importer", "munching-policy-remote-images");

  if (imageUrl && downloadImage) {
    const ext = imageUrl.split(".").pop().split(/#|\?|&/)[0];
    if (!name) name = imageUrl.split("/").pop();

    // image upload
    const filename = type + "-" + name.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").trim();
    const imageExists = await utils.fileExists(uploadDirectory, filename + "." + ext);

    if (imageExists) {
      // eslint-disable-next-line require-atomic-updates
      const image = await utils.getFileUrl(uploadDirectory, filename + "." + ext);
      return image.trim();
    } else {
      // eslint-disable-next-line require-atomic-updates
      const image = await utils.uploadImage(imageUrl, uploadDirectory, filename);
      // did upload succeed? if not fall back to remote image path
      if (image) {
        return image.trim();
      } else {
        return null;
      }

    }
  } else if (imageUrl && remoteImage) {
    try {
      // logger.debug('Trying: ' + imageUrl.trim());
      // await utils.serverFileExists(imageUrl.trim());
      return imageUrl.trim();
    } catch (ignored) {
      return null;
    }
  }
  return null;
}

async function getSRDIconMatch(type) {
  const compendiumName = srdCompendiumLookup.find((c) => c.type == type).name;
  if (!srdPacksLoaded[compendiumName]) await loadSRDPacks(compendiumName);

  const items = srdPacks[compendiumName].map((item) => {
    let smallItem = {
      name: item.name,
      img: item.img,
      type: item.type,
      data: {},
    };
    if (item.data.activation) smallItem.data.activation = item.data.activation;
    return smallItem;
  });

  return items;
}

export async function getSRDIconLibrary() {
  if (srdIconMapLoaded) return srdIconMap;
  const compendiumFeatureItems = await getSRDIconMatch("features");
  const compendiumInventoryItems = await getSRDIconMatch("inventory");
  const compendiumSpellItems = await getSRDIconMatch("spells");
  const compendiumMonsterFeatures = await getSRDIconMatch("monsterfeatures");

  srdIconMap = compendiumInventoryItems.concat(
    compendiumSpellItems,
    compendiumFeatureItems,
    compendiumMonsterFeatures,
  );
  return srdIconMap;
}

// eslint-disable-next-line require-atomic-updates
export async function copySRDIcons(items, srdIconLibrary = null, nameMatchList = []) {
  // eslint-disable-next-line require-atomic-updates
  if (!srdIconLibrary) srdIconLibrary = await getSRDIconLibrary();

  return new Promise((resolve) => {
    const srdItems = items.map((item) => {
      logger.debug(`Matching ${item.name}`);
      const nameMatch = nameMatchList.find((m) => m.name === item.name);
      if (nameMatch) {
        item.img = nameMatch.img;
      } else {
        looseItemNameMatch(item, srdIconLibrary, true).then((match) => {
          if (match) {
            srdIconLibrary.push({ name: item.name, img: match.img });
            item.img = match.img;
          }
        });
      }
      return item;

    });
    resolve(srdItems);
  });
}

async function getDDBItemImages(items, download) {
  munchNote(`Fetching DDB Item Images`);
  const downloadImages = (download) ? true : game.settings.get("ddb-importer", "munching-policy-download-images");
  const remoteImages = game.settings.get("ddb-importer", "munching-policy-remote-images");

  const itemMap = items.map(async (item) => {
    let itemImage = {
      name: item.name,
      type: item.type,
      img: null,
      large: null,
    };

    if (item.flags && item.flags.ddbimporter && item.flags.ddbimporter && item.flags.ddbimporter.dndbeyond) {
      if (item.flags.ddbimporter.dndbeyond.avatarUrl) {
        const avatarUrl = item.flags.ddbimporter.dndbeyond['avatarUrl'];
        if (avatarUrl && avatarUrl != "") {
          munchNote(`Downloading ${item.name} image`);
          const smallImage = await getImagePath(avatarUrl, 'item', item.name, downloadImages, remoteImages);
          logger.debug(`Final image ${smallImage}`);
          itemImage.img = smallImage;
        }
      }
      if (item.flags.ddbimporter.dndbeyond.largeAvatarUrl) {
        const largeAvatarUrl = item.flags.ddbimporter.dndbeyond['largeAvatarUrl'];
        if (largeAvatarUrl && largeAvatarUrl != "") {
          const largeImage = await getImagePath(largeAvatarUrl, 'item-large', item.name, downloadImages, remoteImages);
          itemImage.large = largeImage;
          if (!itemImage.img) itemImage.img = largeImage;
        }
      }
    }

    munchNote("");
    return itemImage;
  });

  return Promise.all(itemMap);
}

async function getDDBGenericItemImages(download) {
  munchNote(`Fetching DDB Generic Item icons`);
  const itemMap = DICTIONARY.items.map(async (item) => {
    const img = await getImagePath(item.img, 'item', item.filterType, download);
    let itemIcons = {
      filterType: item.filterType,
      img: img,
    };
    return itemIcons;
  });

  munchNote("");
  return Promise.all(itemMap);
}

async function getDDBGenericLootImages(download) {
  munchNote(`Fetching DDB Generic Loot icons`);
  const itemMap = DICTIONARY.genericItemIcons.map(async (item) => {
    const img = await getImagePath(item.img, 'equipment', item.name, download);
    let itemIcons = {
      name: item.name,
      img: img,
    };
    return itemIcons;
  });

  munchNote("");
  return Promise.all(itemMap);
}

export async function getDDBGenericItemIcons(items, download) {
  const genericItems = await getDDBGenericItemImages(download);
  const genericLoots = await getDDBGenericLootImages(download);

  let updatedItems = items.map((item) => {
    // logger.debug(item.name);
    // logger.debug(item.flags.ddbimporter.dndbeyond.filterType);
    const excludedItems = ["spell", "feat", "class"];
    if (!excludedItems.includes(item.type) &&
        item.flags &&
        item.flags.ddbimporter &&
        item.flags.ddbimporter.dndbeyond) {
      let generic = null;
      if (item.flags.ddbimporter.dndbeyond.filterType) {
        generic = genericItems.find((i) => i.filterType === item.flags.ddbimporter.dndbeyond.filterType);
      } else if (item.flags.ddbimporter.dndbeyond.type) {
        generic = genericLoots.find((i) => i.name === item.flags.ddbimporter.dndbeyond.type);
      }
      if (generic && (!item.img || item.img == "" || item.img == "icons/svg/mystery-man.svg")) {
        item.img = generic.img;
      }
    }
    return item;
  });
  return Promise.all(updatedItems);
}

async function getDDBSchoolSpellImages(download) {
  munchNote(`Fetching spell school icons`);
  const schoolMap = DICTIONARY.spell.schools.map(async (school) => {
    const img = await getImagePath(school.img, 'spell', school.name, download);
    let schoolIcons = {
      name: school.name,
      img: img,
      id: school.id,
    };
    return schoolIcons;
  });

  munchNote("");
  return Promise.all(schoolMap);
}

export async function getDDBSpellSchoolIcons(items, download) {
  const schools = await getDDBSchoolSpellImages(download);

  let updatedItems = items.map((item) => {
    // logger.debug(item.name);
    // logger.debug(item.flags.ddbimporter.dndbeyond);
    if (item.type == "spell") {
      const school = schools.find((school) => school.id === item.data.school);
      if (school && (!item.img || item.img == "" || item.img == "icons/svg/mystery-man.svg")) {
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
      if (!item.img || item.img == "" || item.img == "icons/svg/mystery-man.svg") {
        const imageMatch = itemImages.find((m) => m.name == item.name && m.type == item.type);
        if (imageMatch && imageMatch.img) {
          item.img = imageMatch.img;
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

  const folderLookup = gameFolderLookup.find((c) => c.type == type);
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
      item.data.flags?.ddbimporter?.dndbeyond?.lookupName &&
      folder.name === item.data.flags.ddbimporter.dndbeyond.lookupName
    );
    return itemFolder && item.type === folderLookup.itemType && item.data.folder === itemFolder._id;
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
              item.flags?.ddbimporter?.dndbeyond?.lookupName &&
              folder.name === item.flags.ddbimporter.dndbeyond.lookupName
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
      .filter((item) => item.type === folderLookup.itemType && folderIds.includes(item.data.folder))
      .map((result) => {
        const subFolder = (result.data.flags.ddbimporter?.dndbeyond?.lookupName)
          ? result.data.flags.ddbimporter.dndbeyond.lookupName
          : null;
        return {
          magicItem: {
            _id: result._id,
            id: result._id,
            pack: "world",
            img: result.img,
            name: result.name,
            subFolder: subFolder,
            flatDc: result.data.flags?.ddbimporter?.dndbeyond?.overrideDC,
            dc: result.data.flags?.ddbimporter?.dndbeyond?.dc,
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
  if (itemData.data.quantity) replaceData.data.quantity = itemData.data.quantity;
  if (itemData.data.attuned) replaceData.data.attuned = itemData.data.attuned;
  if (itemData.data.attunement) replaceData.data.attunement = itemData.data.attunement;
  if (itemData.data.equipped) replaceData.data.equipped = itemData.data.equipped;
  if (itemData.data.uses) replaceData.data.uses = itemData.data.uses;
  if (itemData.data.resources) replaceData.data.resources = itemData.data.resources;
  if (itemData.data.consume) replaceData.data.consume = itemData.data.consume;
  if (itemData.data.preparation) replaceData.data.preparation = itemData.data.preparation;
  if (itemData.data.proficient) replaceData.data.proficient = itemData.data.proficient;
  if (itemData.data.ability) replaceData.data.ability = itemData.data.ability;
  return replaceData;
}

async function updateMatchingItems(oldItems, newItems, looseMatch = false, monster = false, keepId = false) {
  let results = [];

  for (let item of newItems) {
    // logger.debug(`checking ${item.name}`);
    const matched = await looseItemNameMatch(item, oldItems, looseMatch, monster); // eslint-disable-line no-await-in-loop

    // logger.debug(`matched? ${JSON.stringify(matched)}`);
    // console.log(matched);
    // const ddbItem = items.find((orig) =>
    //   (item.name === orig.name && item.type === orig.type && orig.data.activation
    //     ? orig.data.activation.type === item.data.activation.type
    //     : true)
    // );

    if (matched) {
      if (item.flags.ddbimporter) {
        item.flags.ddbimporter["originalItemName"] = matched.name;
      } else {
        item.flags.ddbimporter = { originalItemName: matched.name };
      }

      updateCharacterItemFlags(matched, item);
      // do we want to enrich the compendium item with our parsed flag data?
      // item.flags = { ...matched.flags, ...item.flags };
      if (!keepId) delete item["_id"];
      results.push(item);
    }
  }

  return results;
}


export function getCompendiumLabel(type) {
  const compendiumName = compendiumLookup.find((c) => c.type == type).compendium;
  const compendiumLabel = game.settings.get("ddb-importer", compendiumName);
  return compendiumLabel;
}

/**
 * gets items from compendium
 * @param {*} items
 */
export async function getCompendiumItems(items, type, compendiumLabel = null, looseMatch = false, monsterMatch = false, keepId = false) {
  if (!compendiumLabel) {
    compendiumLabel = getCompendiumLabel(type);
  }
  const compendium = await game.packs.find((pack) => pack.collection === compendiumLabel);
  if (!compendium) return [];
  const index = await compendium.getIndex();
  const firstPassItems = await index.filter((i) =>
    items.some((orig) => {
      const extraNames = (orig.flags?.ddbimporter?.dndbeyond?.alternativeNames)
        ? orig.flags.ddbimporter.dndbeyond.alternativeNames
        : [];
      if (looseMatch) {
        const looseNames = getLooseNames(orig.name, extraNames);
        return looseNames.includes(i.name.split("(")[0].trim().toLowerCase());
      } else if (monsterMatch) {
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
    let item = await compendium.getEntry(i._id); // eslint-disable-line no-await-in-loop
    if (item.flags.ddbimporter) {
      item.flags.ddbimporter["pack"] = compendiumLabel;
    } else {
      item.flags.ddbimporter = { pack: compendiumLabel };
    }
    loadedItems.push(item);
  }
  logger.debug(`compendium ${type} loaded items:`, loadedItems);
  // console.log(loadedItems);

  const results = await updateMatchingItems(items, loadedItems, looseMatch, monsterMatch, keepId);
  logger.debug(`compendium ${type} result items:`, results);
  // console.log(results);
  return results;
}

export async function getSRDCompendiumItems(items, type, looseMatch = false, keepId = false) {
  // console.error(game.packs.keys());
  const compendiumName = srdCompendiumLookup.find((c) => c.type == type).name;
  if (!srdPacksLoaded[compendiumName]) await loadSRDPacks(compendiumName);
  const compendiumItems = srdPacks[compendiumName];

  const loadedItems = await compendiumItems.filter((i) =>
    compendiumItems.some((orig) => {
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
  ).map((i) => {
    if (i.flags.ddbimporter) {
      i.flags.ddbimporter["pack"] = compendiumName;
    } else {
      i.flags.ddbimporter = { pack: compendiumName };
    }
    return i;
  });
  logger.debug(`SRD ${type} loaded items:`, loadedItems);

  const results = await updateMatchingItems(items, loadedItems, looseMatch, false, keepId);
  logger.debug(`SRD ${type} result items:`, results);

  return results;
}

/**
 * Sends a event request to Iconizer to add the correct icons
 * @param {*} names
 */
function queryIconizer(names) {
  return new Promise((resolve, reject) => {
    let listener = (event) => {
      resolve(event.detail);
      // cleaning up
      document.removeEventListener("deliverIcon", listener);
    };

    setTimeout(() => {
      document.removeEventListener("deliverIcon", listener);
      reject("Tokenizer not responding");
    }, 500);
    document.addEventListener("deliverIcon", listener);
    document.dispatchEvent(new CustomEvent("queryIcons", { detail: { names: names } }));
  });
}

async function getIconizerIcons(items) {
  // replace icons by iconizer, if available
  const itemNames = items.map((item) => {
    return {
      name: item.name,
    };
  });
  try {
    logger.debug("Querying iconizer for icons");
    const icons = await queryIconizer(itemNames);
    // logger.debug("Icons found", icons);

    // replace the icons
    items.forEach((item) => {
      const icon = icons.find((icon) => icon.name === item.name);
      if (icon && (!item.img || item.img == "" || item.img == "icons/svg/mystery-man.svg")) {
        item.img = icon.img || "icons/svg/mystery-man.svg";
      }
    });
  } catch (exception) {
    logger.debug("Iconizer not responding");
  }
  return items;
}

/**
 * Add an item to effects, if available
 * @param {*} items
 */
export function addItemEffectIcons(items) {
  logger.debug("Adding Icons to effects");

  items.forEach((item) => {
    if (item.effects && (item.img || item.img !== "" || item.img !== "icons/svg/mystery-man.svg")) {
      item.effects.forEach((effect) => {

        if (!effect.icon || effect.icon === "" || effect.icon === "icons/svg/mystery-man.svg") {
          effect.icon = item.img;
        }
      });
    }

  });
  return items;
}

/**
 * TO DO : This function should do something.
 * @param {*} effects
 */
export function addACEffectIcons(effects) {
  logger.debug("Adding Icons to AC effects");

  // effects.forEach((item) => {
  //   if (!effect.icon || effect.icon === "" || effect.icon === "icons/svg/mystery-man.svg") {
  //     effect.icon = item.img;
  //   }
  // });
  return effects;
}

export async function updateIcons(items, srdIconUpdate = true, monster = false, monsterName = "") {
  // this will use ddb spell school icons as a fall back
  const ddbItemIcons = game.settings.get("ddb-importer", "munching-policy-use-ddb-item-icons");
  if (ddbItemIcons) {
    logger.debug("DDB Equipment Icon Match");
    items = await getDDBEquipmentIcons(items);
  }

  const inBuiltIcons = game.settings.get("ddb-importer", "munching-policy-use-inbuilt-icons");
  if (inBuiltIcons) {
    logger.debug("Inbuilt icon matching");
    items = await copyInbuiltIcons(items, monster, monsterName);
  }

  // check for SRD icons
  const srdIcons = game.settings.get("ddb-importer", "munching-policy-use-srd-icons");
  // eslint-disable-next-line require-atomic-updates
  if (srdIcons && srdIconUpdate) {
    logger.debug("SRD Icon Matching");
    items = await copySRDIcons(items);
  }

  // use iconizer
  const iconizerInstalled = utils.isModuleInstalledAndActive("vtta-iconizer");
  const useIconizer = game.settings.get("ddb-importer", "munching-policy-use-iconizer");
  if (iconizerInstalled && useIconizer) {
    logger.debug("Iconizer Matching");
    items = await getIconizerIcons(items);
  }

  // this will use ddb spell school icons as a fall back
  const ddbSpellIcons = game.settings.get("ddb-importer", "munching-policy-use-ddb-spell-icons");
  if (ddbSpellIcons) {
    logger.debug("DDB Spell School Icon Match");
    items = await getDDBSpellSchoolIcons(items, true);
  }

  // this will use ddb spell school icons as a fall back
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
    const iconItems = await updateIcons(newIcons);
    return iconItems;
  } else if (useSrd) {
    logger.debug("Removing compendium items");
    const srdItems = await getSRDCompendiumItems(items, type);
    let itemMap = {};
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
  const installed = utils.isModuleInstalledAndActive("dae") && utils.isModuleInstalledAndActive("Dynamic-Effects-SRD");

  if (fiddle && installed) {
    return addItemsDAESRD(items);
  } else return items;
}

async function getCompendiumItemSpells(spells) {
  const compendiumSpells = await getCompendiumItems(spells, "spell", null, false, false, true);
  const lessCompendiumSpells = await removeItems(spells, compendiumSpells);
  const srdSpells = await getSRDCompendiumItems(lessCompendiumSpells, "spell", false, true);
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

  // scan the inventory for each item with spells and copy the imported data over
  input.inventory.forEach((item) => {
    if (item.flags.magicitems.spells) {
      for (let [i, spell] of Object.entries(item.flags.magicitems.spells)) {
        const itemSpell = itemSpells.find((iSpell) => iSpell.name === spell.name &&
          (iSpell.compendium || iSpell.magicItem.subFolder === item.name)
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
  });
}
