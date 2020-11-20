import utils from "../utils.js";
import logger from "../logger.js";

const EQUIPMENT_TYPES = ["equipment", "consumable", "tool", "loot", "backpack"];

// a mapping of compendiums with content type
const compendiumLookup = [
  { type: "inventory", compendium: "entity-item-compendium" },
  { type: "spells", compendium: "entity-spell-compendium" },
  { type: "features", compendium: "entity-feature-compendium" },
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
  { type: "feat", name: "dnd5e.classfeatures" },
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
    itemTypes = itemTypes.concat(EQUIPMENT_TYPES);
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
    utils.log(`Copying ${flagGroup} for ${originalItem.name}`);
    targetItem.flags[flagGroup] = originalItem.flags[flagGroup];
  }
}

/**
 * Copies across some flags for existing item
 * @param {*} items
 */
export async function copySupportedItemFlags(originalItem, item) {
  copyFlagGroup("dynamiceffects", originalItem, item);
  copyFlagGroup("maestro", originalItem, item);
  copyFlagGroup("mess", originalItem, item);
  copyFlagGroup("favtab", originalItem, item);
}

export function getLooseNames(name) {
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

  return looseNames;
}

export async function looseItemNameMatch(item, items, loose = false) {
  // first pass is a strict match
  let matchingItem = items.find((matchItem) => {
    let activationMatch = false;

    if (item.data.activation && item.data.activation.type == "") {
      activationMatch = true;
    } else if (matchItem.data.activation && item.data.activation) {
      activationMatch = matchItem.data.activation.type === item.data.activation.type;
    } else if (!item.data.activation) {
      activationMatch = true;
    }

    const isMatch = item.name === matchItem.name && item.type === matchItem.type && activationMatch;
    return isMatch;
  });

  if (!matchingItem && loose) {
    const looseNames = getLooseNames(item.name);
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

export async function updateCompendium(type, input, update = null) {
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

    const updateItems = async () => {
      if (importPolicy === 0) {
        return Promise.all(
          compendiumItems
            .filter((item) => initialIndex.some((idx) => idx.name === item.name))
            .map(async (item) => {
              const entry = await compendium.index.find((idx) => idx.name === item.name);
              const existing = await compendium.getEntity(entry._id);
              item._id = existing._id;
              $('#munching-task-name').text(`Updating ${item.name}`);
              await copySupportedItemFlags(existing, item);
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
            $('#munching-task-name').text(`Creating ${item.name}`);
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
        input[type].map(async (item) => {
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
          id: result._id,
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
export async function updateFolderItems(type, input, update = true) {
  const folderLookup = gameFolderLookup.find((c) => c.type == type);
  const itemsFolder = await utils.getFolder(folderLookup.folder);
  const existingItems = await game.items.entities.filter(
    (item) => item.type === folderLookup.itemType && item.data.folder === itemsFolder._id
  );

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
            item.folder = itemsFolder._id;
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
  const items = Promise.all(
    game.items.entities
      .filter((item) => item.type === folderLookup.itemType && item.data.folder === itemsFolder._id)
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
 * This adds magic item spells to a world,
 */
export async function addMagicItemSpells(input) {
  const itemSpells = await updateFolderItems("itemSpells");
  // scan the inventory for each item with spells and copy the imported data over
  input.inventory.forEach((item) => {
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

/**
 * gets items from compendium
 * @param {*} items
 */
export async function getCompendiumItems(items, type, compendiumLabel = null, looseMatch = false) {
  if (!compendiumLabel) {
    const compendiumName = compendiumLookup.find((c) => c.type == type).compendium;
    compendiumLabel = game.settings.get("ddb-importer", compendiumName);
  }
  const compendium = await game.packs.find((pack) => pack.collection === compendiumLabel);
  const index = await compendium.getIndex();
  const firstPassItems = await index.filter((i) =>
    items.some((orig) => {
      if (looseMatch) {
        const looseNames = getLooseNames(orig.name);
        return looseNames.includes(i.name.split("(")[0].trim().toLowerCase());
      } else {
        return i.name === orig.name;
      }
    })
  );

  let results = [];
  for (const i of firstPassItems) {
    let item = await compendium.getEntry(i._id); // eslint-disable-line no-await-in-loop
    const ddbItem = await looseItemNameMatch(item, items, looseMatch); // eslint-disable-line no-await-in-loop

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

export function download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

export async function getSRDCompendiumItems(items, type, looseMatch = false) {
  // console.error(game.packs.keys());
  const compendiumName = srdCompendiumLookup.find((c) => c.type == type).name;
  return getCompendiumItems(items, type, compendiumName, looseMatch);
}

export async function getSRDIconMatch(type) {
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


export async function copySRDIcons(items) {
  const compendiumFeatureItems = await getSRDIconMatch("features");
  const compendiumInventoryItems = await getSRDIconMatch("inventory");
  const compendiumSpellItems = await getSRDIconMatch("spells");
  const compendiumMonsterFeatures = await getSRDIconMatch("monsterfeatures");

  const srdCompendiumItems = compendiumInventoryItems.concat(
    compendiumSpellItems,
    compendiumFeatureItems,
    compendiumMonsterFeatures,
  );

  return new Promise((resolve) => {
    const srdItems = items.map((item) => {
      looseItemNameMatch(item, srdCompendiumItems, true).then((match) => {
        if (match) {
          item.img = match.img;
        }
      });
      return item;
    });
    resolve(srdItems);
  });
}


export async function srdFiddling(items, type) {
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const useSrd = game.settings.get("ddb-importer", "munching-policy-use-srd");
  const srdIcons = game.settings.get("ddb-importer", "munching-policy-use-srd-icons");
  const iconItems = (srdIcons) ? await copySRDIcons(items) : items;

  if (useSrd) {
    logger.debug("Removing compendium items");
    const srdItems = await getSRDCompendiumItems(items, type);
    let itemMap = {};
    itemMap[type] = srdItems;
    updateCompendium(type, itemMap, updateBool);
    // removed existing items from those to be imported
    return new Promise((resolve) => {
      const cleanedItems = removeItems(iconItems, srdItems);
      resolve(cleanedItems);
    });
  } else {
    return iconItems;
  }
}
