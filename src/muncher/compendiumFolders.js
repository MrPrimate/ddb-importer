import utils from "../../utils.js";
import { getCompendiumLabel } from "./import.js";

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

var compendiumFolders;
var compendiumFoldersLoadedPackCode;

async function loadCompendiumFolders(packCode) {
  if (compendiumFoldersLoadedPackCode == packCode) {
     return compendiumFolders;
  }
  compendiumFolders = await game.CF.FICFolderAPI.loadFolders(packCode);
  // eslint-disable-next-line require-atomic-updates
  compendiumFoldersLoadedPackCode = packCode;
  return compendiumFolders;
}

async function createCompendiumFolder(packName, type, name) {
  // createFolderAtRoot(packCode,name,color,fontColor)
  await game.CF.FICFolderAPI.createFolderAtRoot(packName, name);
}

// create compendium folders for existing things
export async function createCompendiumFoldersExisting(type) {
  // loop through all existing monts/etc and generate a folder and move documents to it
  const packName = await getCompendiumLabel(type);
  await loadCompendiumFolders(packName);

}

export async function addToCompendiumFolder(type, document) {
  const addToCompendium = game.settings.get("ddb-importer", "munching-policy-use-compendium-folders-monster");
  const compendiumFoldersInstalled = utils.isModuleInstalledAndActive("compendium-folders");

  if (addToCompendium && compendiumFoldersInstalled) {
    const packName = await getCompendiumLabel(type);
    await loadCompendiumFolders(packName);
    // check compendium folder exists
    // if not create
    // move object to folder
  }

}
