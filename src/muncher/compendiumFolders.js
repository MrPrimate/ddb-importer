import utils from "../utils.js";
import logger from "../logger.js";
import { getCompendiumLabel } from "./import.js";
import { DDB_CONFIG } from "../ddbConfig.js";

// The API parses the folders in the compendium and stores them in a FICFolder object.
// The class doesn't have many methods, but the most important one for you would
// likely be save() which is fairly self explanatory. If you modify the name of a
// FICFolder object and call save, it will update the folder in the compendium.

// The main API class is located in game.CF.FICFolderAPI.

// loadFolders(packCode)
// will populate a WorldCollection of FICFolder objects -
// making it easier to manipulate folders.
// It returns this populated list but it's also accessible at
//  game.customFolders.fic.folders.
// Note that every time you use this it will wipe the previous result.

// createFolderAtRoot(packCode,name,color,fontColor)
// will create a new folder in the compendium without a parent.
// It also returns a FICFolder object and should update the existing list.

// createFolderWithParent(parent,name,color,fontColor)
// will create a new folder in the compendium with the parent provided.
// The parent argument is a FICFolder object, so you will need to call
// loadFolders() or createFolderAtRoot() first

// Finally moveDocumentToFolder(packCode,document,folder)
// will move the provided document into the provided folder.
// This method doesn't return anything at the moment.

var compendiumFolderTypeMonster;

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
      const folder = await createCompendiumFolder(packName, `CR ${cr.value}`, "#6f0006");
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

// create compendium folder structure
export async function createCompendiumFolderStructure(type) {
  const compendiumFoldersInstalled = utils.isModuleInstalledAndActive("compendium-folders");

  if (compendiumFoldersInstalled) {
    compendiumFolderTypeMonster = game.settings.get("ddb-importer", "munching-selection-compendium-folders-monster");
    // generate compendium folders for type
    const packName = await getCompendiumLabel(type);
    await game.CF.FICFolderAPI.loadFolders(packName);

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
      // no default
    }
    // reload folders
    return game.CF.FICFolderAPI.loadFolders(packName);
  }

  return undefined;
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
          name = document.name.replace(/[^a-z]/gi, '').charAt(0).toUpperCase();
          break;
        }
        case "CR": {
          if (document.data.data.details.cr !== undefined || document.data.data.details.cr !== "") {
            name = `CR ${document.data.data.details.cr}`;
          }
        }
        // no default
      }
      break;
    }
    // no default
  }
  return name;
}

export async function addToCompendiumFolder(type, document, folders) {
  const compendiumFoldersInstalled = utils.isModuleInstalledAndActive("compendium-folders");

  if (compendiumFoldersInstalled) {
    if (!folders) folders = game.customFolders.fic.folders;
    const packName = await getCompendiumLabel(type);
    logger.debug(`Checking ${document.name} in ${packName}`);

    switch (type) {
      case "monsters":
      case "npc":
      case "monster": {
        const folderName = getCompendiumFolderName(type, document);
        if (folderName) {
          const folder = folders.find((f) => f.packCode === packName && f.name == folderName);
          if (document?.data?.flags?.cf?.id) setProperty(document, "data.flags.cf.id", undefined);
          if (folder) {
            logger.info(`Moving monster ${document.name} to folder ${folder.name}`);
            await game.CF.FICFolderAPI.moveDocumentToFolder(packName, document, folder);
          } else {
            logger.error(`Unable to find folder "${folderName}" in "${packName}"`);
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

  const compendium = game.packs.get(packName);
  if (!compendium) return undefined;
  const index = await compendium.getIndex();

  switch (type) {
    case "monsters":
    case "npc":
    case "monster": {
      // loop through all existing monsters and move them to their type
      await index
        .filter((monster) => monster.name !== game.CF.TEMP_ENTITY_NAME)
        .forEach(async (monster) => {
          const existingNPC = await compendium.getDocument(monster._id);
          await addToCompendiumFolder(type, existingNPC, folders);
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
