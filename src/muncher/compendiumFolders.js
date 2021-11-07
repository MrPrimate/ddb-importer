import utils from "../utils.js";
import logger from "../logger.js";
import DICTIONARY from "../dictionary.js";
import { getCompendium, getCompendiumLabel } from "./utils.js";
import { DDB_CONFIG } from "../ddbConfig.js";

var compendiumFolderTypeMonster;
var compendiumFolderTypeSpell;
var compendiumFolderTypeItem;

var rootItemFolders = {};
var equipmentFolders = {};
var weaponFolders = {};
var trinketFolders = {};
var consumableFolders = {};
var lootFolders = {};
var backpackFolders = {};

const spellLevelFolderNames = [
  "0th Level (Cantrip)",
  "1st Level",
  "2nd Level",
  "3rd Level",
  "4th Level",
  "5th Level",
  "6th Level",
  "7th Level",
  "8th Level",
  "9th Level",
];

const itemRarityNames = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Legendary",
  "Artifact",
  "Varies",
  "Unknown",
];

const rootItemFolderNames = {
  equipment: "Equipment",
  tool: "Tools",
  loot: "Loot",
  weapon: "Weapon",
  backpack: "Backpack",
  consumable: "Consumable",
};

const equipmentFolderNames = {
  heavy: "Heavy Armor",
  medium: "Medium Armor",
  light: "Light Armor",
  trinket: "Trinket",
  shield: "Shield",
};
const weaponFolderNames = {
  simpleM: "Simple Melee",
  simpleR: "Simple Ranged",
  martialM: "Martial Melee",
  martialR: "Martial Ranged",
};
const trinketFolderNames = ["Wand", "Wondrous item", "Ring", "Rod"];
const consumableFolderNames = ["Ammunition", "Potion", "Scroll", "Poison", "Adventuring Gear"];
const lootFolderNames = [
  "Adventuring Gear",
  "Vehicle",
  "Gemstone",
  "Mount",
  "Arcane Focus",
  "Holy Symbol",
  "Druidic Focus",
];
const backpackFolderNames = ["Equipment Pack", "Adventuring Gear"];

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
    DDB_CONFIG.monsterTypes.forEach(async (monsterType) => {
      const folder = await createCompendiumFolder(packName, monsterType.name, "#6f0006");
      promises.push(folder);
    });
    resolve(promises);
  });
}

// challenge rating
async function createChallengeRatingCompendiumFolders(packName) {
  return new Promise((resolve) => {
    let promises = [];
    DDB_CONFIG.challengeRatings.forEach(async (cr) => {
      const paddedCR = String(cr.value).padStart(2, "0");
      const folder = await createCompendiumFolder(packName, `CR ${paddedCR}`, "#6f0006");
      promises.push(folder);
    });
    resolve(promises);
  });
}

// alphabetical
async function createAlphabeticalCompendiumFolders(packName) {
  return new Promise((resolve) => {
    let promises = [];
    for (let i = 9; ++i < 36;) {
      const folderName = i.toString(36).toUpperCase();
      // eslint-disable-next-line no-await-in-loop
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
    spellLevelFolderNames.forEach(async (levelName) => {
      logger.info(`Creating folder '${levelName}'`);
      const newFolder = await createCompendiumFolder(packName, levelName);
      promises.push(newFolder);
    });
    resolve(promises);
  });
}

// spell school
async function createSpellSchoolCompendiumFolders(packName) {
  return new Promise((resolve) => {
    let promises = [];
    DICTIONARY.spell.schools.forEach(async (school) => {
      const schoolName = utils.capitalize(school.name);
      logger.info(`Creating folder '${schoolName}'`);
      const newFolder = await createCompendiumFolder(packName, schoolName);
      promises.push(newFolder);
    });
    resolve(promises);
  });
}

// item rarity folder
async function createItemRarityCompendiumFolders(packName) {
  return new Promise((resolve) => {
    let promises = [];
    itemRarityNames.forEach(async (rarityName) => {
      logger.info(`Creating folder '${rarityName}'`);
      const newFolder = await createCompendiumFolder(packName, rarityName);
      promises.push(newFolder);
    });
    resolve(promises);
  });
}

// item type folder
async function createItemTypeCompendiumFolders(packName) {
  let promises = [];

  for (const [key, value] of Object.entries(rootItemFolderNames)) {
    logger.info(`Creating root folder '${value}' with key '${key}'`);
    // eslint-disable-next-line no-await-in-loop
    const folder = await createCompendiumFolder(packName, value);
    rootItemFolders[key] = folder;
    promises.push(folder);
  }

  for (const [key, value] of Object.entries(equipmentFolderNames)) {
    logger.info(`Creating Equipment folder '${value}' with key '${key}'`);
    // eslint-disable-next-line no-await-in-loop
    const folder = await createCompendiumFolderWithParent(packName, value, rootItemFolders["equipment"], "#222222");
    equipmentFolders[key] = folder;
    promises.push(folder);
  }

  for (const [key, value] of Object.entries(weaponFolderNames)) {
    logger.info(`Creating Weapon folder '${value}' with key '${key}'`);
    // eslint-disable-next-line no-await-in-loop
    const folder = await createCompendiumFolderWithParent(packName, value, rootItemFolders["weapon"], "#222222");
    weaponFolders[key] = folder;
    promises.push(folder);
  }

  trinketFolderNames.forEach((folderName) => {
    logger.info(`Creating Equipment\\Trinket folder '${folderName}'`);
    createCompendiumFolderWithParent(packName, folderName, equipmentFolders["trinket"], "#444444").then((folder) => {
      trinketFolders[folderName] = folder;
      promises.push(folder);
    });
  });

  consumableFolderNames.forEach((folderName) => {
    logger.info(`Creating Consumable folder '${folderName}'`);
    createCompendiumFolderWithParent(packName, folderName, rootItemFolders["consumable"], "#222222").then((folder) => {
      consumableFolders[folderName] = folder;
      promises.push(folder);
    });
  });

  lootFolderNames.forEach((folderName) => {
    logger.info(`Creating Loot folder '${folderName}'`);
    createCompendiumFolderWithParent(packName, folderName, rootItemFolders["loot"], "#222222").then((folder) => {
      lootFolders[folderName] = folder;
      promises.push(folder);
    });
  });

  backpackFolderNames.forEach((folderName) => {
    logger.info(`Creating Backpack folder '${folderName}'`);
    createCompendiumFolderWithParent(packName, folderName, rootItemFolders["backpack"], "#222222").then((folder) => {
      backpackFolders[folderName] = folder;
      promises.push(folder);
    });
  });

  return new Promise((resolve) => {
    resolve(promises);
  });
}

// create compendium folder structure
export async function createCompendiumFolderStructure(type) {
  const compendiumFoldersInstalled = utils.isModuleInstalledAndActive("compendium-folders");

  if (compendiumFoldersInstalled) {
    compendiumFolderTypeMonster = game.settings.get("ddb-importer", "munching-selection-compendium-folders-monster");
    compendiumFolderTypeSpell = game.settings.get("ddb-importer", "munching-selection-compendium-folders-spell");
    compendiumFolderTypeItem = game.settings.get("ddb-importer", "munching-selection-compendium-folders-item");
    // generate compendium folders for type
    const packName = await getCompendiumLabel(type);
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

function getItemCompendiumFolderNameForRarity(document) {
  let name;
  const rarity = document.data.data.rarity;

  if (rarity && rarity != "") {
    switch (rarity.toLowerCase().trim()) {
      case "common":
        name = "Common";
        break;
      case "uncommon":
        name = "Uncommon";
        break;
      case "rare":
        name = "Rare";
        break;
      case "very rare":
      case "veryrare":
        name = "Very Rare";
        break;
      case "legendary":
        name = "Legendary";
        break;
      case "artifact":
        name = "Artifact";
        break;
      case "varies":
        name = "Varies";
        break;
      case "unknown":
      default:
        name = "Unknown";
        break;
    }
  } else {
    name = "Unknown";
  }
  return name;
}

function getItemCompendiumFolderNameForType(document) {
  let name;

  switch (document.data.type) {
    case "equipment": {
      switch (document.data.data?.armor?.type) {
        case "trinket": {
          const ddbType = document.data.flags?.ddbimporter?.dndbeyond?.type;
          if (ddbType) {
            name = trinketFolders[ddbType].name;
          }
          break;
        }
        default: {
          name = equipmentFolders[document.data.data.armor.type].name;
          break;
        }
      }
      break;
    }
    case "weapon": {
      name = weaponFolders[document.data.data.weaponType].name;
      break;
    }
    case "consumable": {
      const ddbType = document.data.flags?.ddbimporter?.dndbeyond?.type;
      if (ddbType) {
        name = consumableFolders[ddbType].name;
      }
      break;
    }
    case "loot": {
      const ddbType = document.data.flags?.ddbimporter?.dndbeyond?.type;
      if (ddbType) {
        name = lootFolders[ddbType].name;
      }
      break;
    }
    case "backpack": {
      const ddbType = document.data.flags?.ddbimporter?.dndbeyond?.type;
      if (ddbType) {
        name = backpackFolders[ddbType].name;
      }
      break;
    }
    default: {
      name = rootItemFolders[document.data.type].name;
      break;
    }
  }

  return name;
}

function getItemCompendiumFolderName(document) {
  let name;
  switch (compendiumFolderTypeItem) {
    case "RARITY": {
      name = getItemCompendiumFolderNameForRarity(document);
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
          const creatureType = document.data.data?.details?.type?.value
            ? document.data.data?.details?.type?.value
            : "Unknown";
          const ddbType = DDB_CONFIG.monsterTypes.find((c) => creatureType.toLowerCase() == c.name.toLowerCase());
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
          if (document.data.data.details.cr !== undefined || document.data.data.details.cr !== "") {
            const paddedCR = String(document.data.data.details.cr).padStart(2, "0");
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
          const school = document.data.data?.school;
          if (school) {
            name = utils.capitalize(DICTIONARY.spell.schools.find((sch) => school == sch.id).name);
          }
          break;
        }
        case "LEVEL": {
          const levelFolder = spellLevelFolderNames[document.data.data?.level];
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

// function addItemToCompendiumFolder(packName, document, folders) {
//   const folderName = getCompendiumFolderName("item", document);
//   if (folderName) {
//     switch (compendiumFolderTypeItems) {
//       case "TYPE": {
//         switch (document.data.type) {
//           case "equipment": {
//             switch (document.data.data?.armor?.type) {
//               case "trinket": {
//                 const folder = trinketFolders[document.data.flags?.ddbimporter?.dndbeyond?.type];
//                 const ddbType = document.data.flags?.ddbimporter?.dndbeyond?.type;
//                 if (ddbType) {
//                   name = trinketFolders[ddbType].name;
//                   logger.info(`Moving ${type} ${document.name} to folder ${folder.name}`);
//                   await game.CF.FICFolderAPI.moveDocumentToFolder(packName, document, folder);
//                 }
//                 break;
//               }
//               default: {
//                 name = equipmentFolders[document.data.armor.type].name;
//                 break;
//               }
//             }
//             break;
//           }
//           case "weapon": {
//             name = weaponFolders[document.data.weaponType].name;
//             break;
//           }
//           case "consumable": {
//             const ddbType = document.data.flags?.ddbimporter?.dndbeyond?.type;
//             if (ddbType) {
//               name = consumableFolders[ddbType].name;
//             }
//             break;
//           }
//           case "loot": {
//             const ddbType = document.data.flags?.ddbimporter?.dndbeyond?.type;
//             if (ddbType) {
//               name = lootFolders[ddbType].name;
//             }
//             break;
//           }
//           case "backpack": {
//             const ddbType = document.data.flags?.ddbimporter?.dndbeyond?.type;
//             if (ddbType) {
//               name = backpackFolders[ddbType].name;
//             }
//             break;
//           }
//           default: {
//             name = rootItemFolders[document.data.type].name;
//             break;
//           }
//         }
//         break;
//       }
//       // no default
//     }
//   } else {
//     logger.error(`Unable to find folder "${folderName}" in "${packName}" for Item`);
//   }
// }

export async function addToCompendiumFolder(type, document, folders) {
  const compendiumFoldersInstalled = utils.isModuleInstalledAndActive("compendium-folders");

  if (compendiumFoldersInstalled && (folders || game.customFolders?.fic?.folders)) {
    if (!folders) folders = game.customFolders.fic.folders;
    const packName = await getCompendiumLabel(type);
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
          if (document?.data?.flags?.cf?.id) setProperty(document, "data.flags.cf.id", undefined);
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
export async function migrateExistingCompendium(type) {
  const compendiumFoldersInstalled = utils.isModuleInstalledAndActive("compendium-folders");

  if (!compendiumFoldersInstalled) {
    logger.warn("Compendium Folders module is not installed");
    return new Promise((resolve) => {
      resolve(false);
    });
  }
  // loop through all existing monts/etc and generate a folder and move documents to it
  const packName = await getCompendiumLabel(type);

  if (game.CF.cleanupCompendium) {
    await game.CF.cleanupCompendium(packName);
  }

  const folders = await createCompendiumFolderStructure(type);

  logger.debug("Compendium Folders", folders);

  const compendium = await getCompendium(packName);
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
