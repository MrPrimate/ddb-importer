/* eslint-disable no-await-in-loop */
import utils from "../lib/utils.js";
import logger from "../logger.js";
import DICTIONARY from "../dictionary.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import { DDBCompendiumFolders } from "../lib/DDBCompendiumFolders.js";

let compendiumFolderTypeMonster;
let compendiumFolderTypeSpell;
let compendiumFolderTypeItem;

let rootItemFolders = {};
let equipmentFolders = {};
let weaponFolders = {};
let trinketFolders = {};
let consumableFolders = {};
let lootFolders = {};
let toolFolders = {};
let backpackFolders = {};

async function createCompendiumFolder(packName, folderName, color = "#6f0006") {
  const existingFolder = game.customFolders.fic.folders.find((f) => f.packCode === packName && f.name == folderName);
  return new Promise((resolve) => {
    if (!existingFolder) {
      logger.info(`Creating compendium folder ${folderName}`);
      // createFolderAtRoot(packCode,name,color,fontColor)
      resolve(game.CF.FICFolderAPI.createFolderAtRoot(packName, folderName, color));
    } else {
      resolve(existingFolder);
    }
  });
}

async function createCompendiumFolderWithParent(packName, folderName, parentFolder, color = "#6f0006") {
  const existingFolder = game.customFolders.fic.folders.find(
    (f) => f.packCode === packName && f.name == folderName && f.parentId == parentFolder.id
  );
  return new Promise((resolve) => {
    if (!existingFolder) {
      logger.info(`Creating compendium folder ${folderName} in ${parentFolder.name}`);
      resolve(game.CF.FICFolderAPI.createFolderWithParent(parentFolder, folderName, color));
    } else {
      resolve(existingFolder);
    }
  });
}

// assume type is monster compendium
async function createCreatureTypeCompendiumFolders(packName) {
  return new Promise((resolve) => {
    let promises = [];
    CONFIG.DDB.monsterTypes.forEach(async (monsterType) => {
      promises.push(createCompendiumFolder(packName, monsterType.name, "#6f0006"));
    });
    resolve(Promise.all(promises));
  });
}

// challenge rating
async function createChallengeRatingCompendiumFolders(packName) {
  return new Promise((resolve) => {
    let promises = [];
    CONFIG.DDB.challengeRatings.forEach((cr) => {
      const paddedCR = String(cr.value).padStart(2, "0");
      promises.push(createCompendiumFolder(packName, `CR ${paddedCR}`, "#6f0006"));
    });
    resolve(Promise.all(promises));
  });
}

// alphabetical
async function createAlphabeticalCompendiumFolders(packName) {
  return new Promise((resolve) => {
    let promises = [];
    for (let i = 9; ++i < 36;) {
      const folderName = i.toString(36).toUpperCase();
      createCompendiumFolder(packName, folderName, "#6f0006").then((folder) => {
        promises.push(folder);
      });
    }
    resolve(promises);
  });
}

// spell level
async function createSpellLevelCompendiumFolders(packName) {
  return new Promise((resolve) => {
    let promises = [];
    DICTIONARY.COMPENDIUM_FOLDERS.SPELL_LEVEL.forEach((levelName) => {
      logger.info(`Creating folder '${levelName}'`);
      promises.push(createCompendiumFolder(packName, levelName));
    });
    resolve(Promise.all(promises));
  });
}

// spell school
async function createSpellSchoolCompendiumFolders(packName) {
  return new Promise((resolve) => {
    let promises = [];
    DICTIONARY.spell.schools.forEach((school) => {
      const schoolName = utils.capitalize(school.name);
      logger.info(`Creating folder '${schoolName}'`);
      promises.push(createCompendiumFolder(packName, schoolName));
    });
    resolve(Promise.all(promises));
  });
}

// item rarity folder
async function createItemRarityCompendiumFolders(packName) {
  return new Promise((resolve) => {
    let promises = [];
    DICTIONARY.COMPENDIUM_FOLDERS.RARITY.forEach((rarityName) => {
      logger.info(`Creating folder '${rarityName}'`);
      promises.push(createCompendiumFolder(packName, rarityName));
    });
    resolve(promises);
  });
}

// item type folder
async function createItemTypeCompendiumFolders(packName) {
  let promises = [];

  for (const [key, value] of Object.entries(DICTIONARY.COMPENDIUM_FOLDERS.ITEM_ROOT)) {
    logger.info(`Creating root folder '${value}' with key '${key}'`);
    // eslint-disable-next-line no-await-in-loop
    const folder = await createCompendiumFolder(packName, value);
    rootItemFolders[key] = folder;
    promises.push(folder);
  }

  for (const [key, value] of Object.entries(DICTIONARY.COMPENDIUM_FOLDERS.EQUIPMENT)) {
    logger.info(`Creating Equipment folder '${value}' with key '${key}'`);
    // eslint-disable-next-line no-await-in-loop
    const folder = await createCompendiumFolderWithParent(packName, value, rootItemFolders["equipment"], "#222222");
    equipmentFolders[key] = folder;
    promises.push(folder);
  }

  for (const [key, value] of Object.entries(DICTIONARY.COMPENDIUM_FOLDERS.WEAPON)) {
    logger.info(`Creating Weapon folder '${value}' with key '${key}'`);
    // eslint-disable-next-line no-await-in-loop
    const folder = await createCompendiumFolderWithParent(packName, value, rootItemFolders["weapon"], "#222222");
    weaponFolders[key] = folder;
    promises.push(folder);
  }

  for (const [key, value] of Object.entries(DICTIONARY.COMPENDIUM_FOLDERS.TOOLS)) {
    logger.info(`Creating Tool folder '${value}' with key '${key}'`);
    // eslint-disable-next-line no-await-in-loop
    const folder = await createCompendiumFolderWithParent(packName, value, rootItemFolders["tool"], "#222222");
    toolFolders[key] = folder;
    promises.push(folder);
  }

  for (const folderName of DICTIONARY.COMPENDIUM_FOLDERS.TRINKET) {
    logger.info(`Creating Equipment\\Trinket folder '${folderName}'`);
    // eslint-disable-next-line no-await-in-loop
    const folder = await createCompendiumFolderWithParent(packName, folderName, equipmentFolders["trinket"], "#444444");
    trinketFolders[folderName] = folder;
    promises.push(folder);
  }

  for (const folderName of DICTIONARY.COMPENDIUM_FOLDERS.CONSUMABLE) {
    logger.info(`Creating Consumable folder '${folderName}'`);
    // eslint-disable-next-line no-await-in-loop
    const folder = await createCompendiumFolderWithParent(packName, folderName, rootItemFolders["consumable"], "#222222");
    consumableFolders[folderName] = folder;
    promises.push(folder);
  }

  for (const folderName of DICTIONARY.COMPENDIUM_FOLDERS.LOOT) {
    logger.info(`Creating Loot folder '${folderName}'`);
    // eslint-disable-next-line no-await-in-loop
    const folder = await createCompendiumFolderWithParent(packName, folderName, rootItemFolders["loot"], "#222222");
    lootFolders[folderName] = folder;
    promises.push(folder);
  }

  for (const folderName of DICTIONARY.COMPENDIUM_FOLDERS.BACKPACK) {
    logger.info(`Creating Backpack folder '${folderName}'`);
    // eslint-disable-next-line no-await-in-loop
    const folder = await createCompendiumFolderWithParent(packName, folderName, rootItemFolders["backpack"], "#222222");
    backpackFolders[folderName] = folder;
    promises.push(folder);
  }

  return new Promise((resolve) => {
    resolve(promises);
  });
}

// create compendium folder structure
export async function createCompendiumFolderStructure(type) {
  const compendiumFoldersInstalled = game.modules.get("compendium-folders")?.active;

  if (compendiumFoldersInstalled) {
    compendiumFolderTypeMonster = game.settings.get("ddb-importer", "munching-selection-compendium-folders-monster");
    compendiumFolderTypeSpell = game.settings.get("ddb-importer", "munching-selection-compendium-folders-spell");
    compendiumFolderTypeItem = game.settings.get("ddb-importer", "munching-selection-compendium-folders-item");
    // generate compendium folders for type
    const packName = await CompendiumHelper.getCompendiumLabel(type);
    await game.CF.FICFolderAPI.loadFolders(packName);
    logger.debug(`Creating Compendium folder structure for ${type}`);

    switch (type) {
      case "monsters":
      case "npc":
      case "monster": {
        switch (compendiumFolderTypeMonster) {
          case "TYPE": {
            await createCreatureTypeCompendiumFolders(packName);
            break;
          }
          case "ALPHA": {
            await createAlphabeticalCompendiumFolders(packName);
            break;
          }
          case "CR": {
            await createChallengeRatingCompendiumFolders(packName);
            break;
          }
          // no default
        }
        break;
      }
      case "spell":
      case "spells": {
        switch (compendiumFolderTypeSpell) {
          case "SCHOOL":
            await createSpellSchoolCompendiumFolders(packName);
            break;
          case "LEVEL":
            await createSpellLevelCompendiumFolders(packName);
            break;
          // no default
        }
        break;
      }
      case "inventory":
      case "item":
      case "items": {
        rootItemFolders = {};
        equipmentFolders = {};
        weaponFolders = {};
        trinketFolders = {};
        consumableFolders = {};
        lootFolders = {};
        toolFolders = {};
        backpackFolders = {};
        switch (compendiumFolderTypeItem) {
          case "TYPE":
            await createItemTypeCompendiumFolders(packName);
            break;
          case "RARITY":
            await createItemRarityCompendiumFolders(packName);
            break;
          // no default
        }
        break;
      }
      // no default
    }
    // reload folders
    return game.CF.FICFolderAPI.loadFolders(packName);
  }

  return undefined;
}

function getItemCompendiumFolderNameForType(document) {
  let name;

  switch (document.type) {
    case "equipment": {
      switch (document.system?.armor?.type) {
        case "trinket": {
          const ddbType = document.flags?.ddbimporter?.dndbeyond?.type;
          if (ddbType) {
            name = trinketFolders[ddbType].name;
          }
          break;
        }
        default: {
          name = equipmentFolders[document.system.armor.type].name;
          break;
        }
      }
      break;
    }
    case "weapon": {
      name = weaponFolders[document.system.weaponType].name;
      break;
    }
    case "consumable": {
      const ddbType = document.flags?.ddbimporter?.dndbeyond?.type;
      if (ddbType) {
        name = consumableFolders[ddbType].name;
      }
      break;
    }
    case "loot": {
      const ddbType = document.flags?.ddbimporter?.dndbeyond?.type;
      if (ddbType) {
        name = lootFolders[ddbType].name;
      }
      break;
    }
    case "backpack": {
      const ddbType = document.flags?.ddbimporter?.dndbeyond?.type;
      if (ddbType) {
        name = backpackFolders[ddbType].name;
      }
      break;
    }
    case "tool": {
      const toolType = document.system.toolType;
      const instrument = document.flags?.ddbimporter?.dndbeyond?.tags.includes("Instrument");
      const ddbType = ["art", "music", "game"].includes(toolType);
      if (instrument) {
        name = toolFolders["music"].name;
      } else if (ddbType) {
        name = toolFolders[toolType].name;
      } else {
        name = rootItemFolders[document.type].name;
      }
      break;
    }
    default: {
      name = rootItemFolders[document.type].name;
      break;
    }
  }

  return name;
}

function getItemCompendiumFolderName(document) {
  let name;
  switch (compendiumFolderTypeItem) {
    case "RARITY": {
      name = DDBCompendiumFolders.getItemCompendiumFolderNameForRarity(document);
      break;
    }
    case "TYPE": {
      name = getItemCompendiumFolderNameForType(document);
      break;
    }
    // no default
  }
  return name;
}

function getCompendiumFolderName(type, document) {
  let name;
  switch (type) {
    case "monsters":
    case "npc":
    case "monster": {
      switch (compendiumFolderTypeMonster) {
        case "TYPE": {
          const creatureType = document.system?.details?.type?.value
            ? document.system?.details?.type?.value
            : "Unknown";
          const ddbType = CONFIG.DDB.monsterTypes.find((c) => creatureType.toLowerCase() == c.name.toLowerCase());
          if (ddbType) name = ddbType.name;
          break;
        }
        case "ALPHA": {
          name = document.name
            .replace(/[^a-z]/gi, "")
            .charAt(0)
            .toUpperCase();
          break;
        }
        case "CR": {
          if (document.system.details.cr !== undefined || document.system.details.cr !== "") {
            const paddedCR = String(document.system.details.cr).padStart(2, "0");
            name = `CR ${paddedCR}`;
          }
        }
        // no default
      }
      break;
    }
    case "spell":
    case "spells": {
      switch (compendiumFolderTypeSpell) {
        case "SCHOOL": {
          const school = document.system?.school;
          if (school) {
            name = utils.capitalize(DICTIONARY.spell.schools.find((sch) => school == sch.id).name);
          }
          break;
        }
        case "LEVEL": {
          const levelFolder = DICTIONARY.COMPENDIUM_FOLDERS.SPELL_LEVEL[document.system?.level];
          if (levelFolder) {
            name = levelFolder;
          }
          break;
        }
        // no default
      }
      break;
    }
    case "inventory":
    case "item":
    case "items": {
      name = getItemCompendiumFolderName(document);
    }
    // no default
  }
  return name;
}

export async function addToCompendiumFolder(type, document, folders) {
  const compendiumFoldersInstalled = game.modules.get("compendium-folders")?.active;

  if (compendiumFoldersInstalled && (folders || game.customFolders?.fic?.folders)) {
    if (!folders) folders = game.customFolders.fic.folders;
    const packName = await CompendiumHelper.getCompendiumLabel(type);
    logger.debug(`Checking ${document.name} in ${packName}`);

    switch (type) {
      case "inventory":
      case "items":
      case "item":
      case "spells":
      case "spell":
      case "monsters":
      case "npc":
      case "monster": {
        const folderName = getCompendiumFolderName(type, document);
        if (folderName) {
          const folder = folders.find((f) => f.packCode === packName && f.name == folderName);
          if (document?.flags?.cf?.id) setProperty(document, "flags.cf.id", undefined);
          if (folder) {
            logger.info(`Moving ${type} ${document.name} to folder ${folder.name}`);
            await game.CF.FICFolderAPI.moveDocumentToFolder(packName, document, folder);
          } else {
            logger.error(`Unable to find folder "${folderName}" in "${packName}" for ${type}`);
          }
        }
      }
      // no default
    }
  }
}

// create compendium folders for existing things
// eslint-disable-next-line complexity
export async function migrateExistingCompendium(type) {
  const compendiumFoldersInstalled = game.modules.get("compendium-folders")?.active;

  if (!compendiumFoldersInstalled) {
    logger.warn("Compendium Folders module is not installed");
    return new Promise((resolve) => {
      resolve(false);
    });
  }
  // loop through all existing monts/etc and generate a folder and move documents to it
  const packName = await CompendiumHelper.getCompendiumLabel(type);

  if (game.CF.cleanupCompendium) {
    await game.CF.cleanupCompendium(packName);
  }

  const folders = await createCompendiumFolderStructure(type);

  logger.debug("Compendium Folders", folders);

  const compendium = CompendiumHelper.getCompendium(packName);
  if (!compendium) return undefined;
  let indexFields = ["name"];
  switch (type) {
    case "spells":
    case "spell": {
      indexFields = ["name", "flags.cf", "data.level"];
      break;
    }
    case "inventory":
    case "items":
    case "item": {
      indexFields = [
        "name",
        "type",
        "flags.cf",
        "flags.ddbimporter.dndbeyond.type",
        "data.armor.type",
        "data.weaponType",
        "data.rarity"
      ];
      break;
    }
    // no default
  }

  const index = await compendium.getIndex({ fields: indexFields });

  switch (type) {
    case "inventory":
    case "items":
    case "item":
    case "spells":
    case "spell":
    case "monsters":
    case "npc":
    case "monster": {
      // loop through all existing monsters and move them to their type
      await index
        .filter((i) => i.name !== game.CF.TEMP_ENTITY_NAME)
        .forEach(async (i) => {
          const existing = await compendium.getDocument(i._id);
          await addToCompendiumFolder(type, existing, folders);
        });
      break;
    }
    // no default
  }

  const newFolders = await game.CF.FICFolderAPI.loadFolders(packName);

  return new Promise((resolve) => {
    resolve(newFolders);
  });
}
