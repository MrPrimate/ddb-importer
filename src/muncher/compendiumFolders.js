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


// create compendium folder structure
export async function createCompendiumFolderStructure(type) {
  const compendiumFoldersInstalled = utils.isModuleInstalledAndActive("compendium-folders");

  if (compendiumFoldersInstalled) {
    // generate compendium folders for type
    const packName = await getCompendiumLabel(type);
    await game.CF.FICFolderAPI.loadFolders(packName);

    switch (type) {
      case "monsters":
      case "npc":
      case "monster": {
        DDB_CONFIG.monsterTypes.forEach(async (monsterType) => {
          const folderName = monsterType.name;
          const existingFolder = game.customFolders.fic.folders.find((f) => f.packCode === packName && f.name == folderName);
          if (!existingFolder) {
            logger.info(`Creating compedium folder ${monsterType.name}`);
            // createFolderAtRoot(packCode,name,color,fontColor)
            await game.CF.FICFolderAPI.createFolderAtRoot(packName, monsterType.name);
          }
        });
        break;
      }
      // no default
    }
    // reload folders
    await game.CF.FICFolderAPI.loadFolders(packName);
  }

}

export async function addToCompendiumFolder(type, document) {
  const compendiumFoldersInstalled = utils.isModuleInstalledAndActive("compendium-folders");

  if (compendiumFoldersInstalled) {
    const packName = await getCompendiumLabel(type);
    logger.debug(`Checking ${document.name} in ${packName}`);

    switch (type) {
      case "monsters":
      case "npc":
      case "monster": {
        const creatureType = document.data.data?.details?.type?.value
          ? document.data.data?.details?.type?.value
          : "Unknown";
        const ddbType = DDB_CONFIG.monsterTypes.find((c) => creatureType.toLowerCase() == c.name.toLowerCase());
        if (ddbType) {
          const folder = game.customFolders.fic.folders.find((f) => f.packCode === packName && f.name == ddbType.name);
          logger.info(`Moving monster ${document.name} to folder ${folder.name}`);
          if (document?.data?.flags?.cf?.id) setProperty(document, "data.flags.cf.id", undefined);
          await game.CF.FICFolderAPI.moveDocumentToFolder(packName, document, folder);
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
    return false;
  }
  // loop through all existing monts/etc and generate a folder and move documents to it
  const packName = await getCompendiumLabel(type);
  await game.CF.FICFolderAPI.loadFolders(packName);
  await createCompendiumFolderStructure(type);

  const compendium = game.packs.get(packName);
  if (!compendium) return undefined;
  const index = await compendium.getIndex();

  switch (type) {
    case "monsters":
    case "npc":
    case "monster": {
      // loop through all existing monsters and move them to their type
      index
      .filter((monster) => monster.name !== game.CF.TEMP_ENTITY_NAME)
      .forEach(async (monster) => {
        const existingNPC = await compendium.getDocument(monster._id);
        addToCompendiumFolder(type, existingNPC);
      });
      break;
    }
    // no default
  }


  return true;

}
