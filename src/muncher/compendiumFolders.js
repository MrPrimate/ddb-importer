import utils from "../utils.js";
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

// create compendium folder structure
async function createCompendiumFolderStructure(type) {
  // loop through all existing monts/etc and generate a folder and move documents to it
  const packName = await getCompendiumLabel(type);
  await loadCompendiumFolders(packName);

  switch (type) {
    case "monsters":
    case "npc":
    case "monster": {
      DDB_CONFIG.monsterTypes.forEach(async (monsterType) => {
        console.warn(`Creating compedium folder ${monsterType.name}`);
        const folderName = monsterType.name;
        const existingFolder = game.customFolders.fic.folders.find((f) => f.packCode === packName && f.name == folderName);
        if (!existingFolder) {
          // createFolderAtRoot(packCode,name,color,fontColor)
          await game.CF.FICFolderAPI.createFolderAtRoot(packName, monsterType.name);
        }
      });
      break;
    }
    // no default
  }

}

// create compendium folders for existing things
export async function migrateExistingCompendium(type) {
  // loop through all existing monts/etc and generate a folder and move documents to it
  const packName = await getCompendiumLabel(type);
  await loadCompendiumFolders(packName);
  await createCompendiumFolderStructure(type);

  const compendium = game.packs.get(packName);
  if (!compendium) return undefined;
  const indexFields = [
    "name",
    "data.details.type.value",
    "data.flags.cf",
  ];
  const index = await compendium.getIndex({ fields: indexFields });

  switch (type) {
    case "monsters":
    case "npc":
    case "monster": {
      // loop through all existing monsters and move them to their type
      index
      .filter((monster) => monster.name !== "#[CF_tempEntity]" && monster.data?.details?.type?.value)
      .forEach(async (monster) => {
        console.warn(`Checking ${monster.name}`);
        const type = monster.data.details.type.value;
        const ddbType = DDB_CONFIG.monsterTypes.find((c) => type.toLowerCase() == c.name.toLowerCase());
        if (ddbType) {
          console.warn(`Moving ${monster.name}`);
          const existingNPC = await compendium.getDocument(monster._id);
          const folder = game.customFolders.fic.folders.find((f) => f.packCode === packName && f.name == ddbType.name);
          console.log(`Monster ${monster.name} folder:`, folder);
          await game.CF.FICFolderAPI.moveDocumentToFolder(packName, existingNPC, folder);
        }
      });
      break;
    }
    // no default
  }

  return true;

}

window.migrateExistingCompendium = migrateExistingCompendium;

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

// await game.CF.FICFolderAPI.createFolderAtRoot("world.ddb-monsters-2", "Official!");
// await game.CF.FICFolderAPI.createFolderAtRoot("world.ddb-monsters-2", "Homebrew!");



// let packCode = "world.ddb-monsters-2";
// let folderName = "Official!";

// let compendium = game.packs.getName(packCode);
// let index = await compendium.getIndex();
// let npc = {
//   "name": "Dave",
// }


// let npcMatch = index.contents.find((entity) => entity.name.toLowerCase() === npc.name.toLowerCase());
// let existingNPC = await compendium.getDocument(npcMatch._id);

// let folder = game.customFolders.fic.folders.find((f) => f.packCode === packCode && f.name == folderName);

// game.CF.FICFolderAPI.moveDocumentToFolder(packCode, existingNPC, folder);
