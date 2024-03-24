import logger from "../logger.js";
import DDBItemImporter from "./DDBItemImporter.js";
import SETTINGS from "../settings.js";
import utils from "./utils.js";

export default class FolderHelper {

  static async getOrCreateFolder (root, entityType, folderName, folderColor = "") {
    let folder = game.folders.contents.find((f) =>
      f.type === entityType && f.name === folderName
      // if a root folder we want to match the root id for the parent folder
      && (root ? root.id : null) === (f.folder?.id ?? null)
    );
    // console.warn(`Looking for ${root} ${entityType} ${folderName}`);
    // console.warn(folder);
    if (folder) return folder;
    folder = await Folder.create(
      {
        name: folderName,
        type: entityType,
        color: folderColor,
        parent: (root) ? root.id : null,
      },
      { displaySheet: false }
    );
    return folder;
  }

  // eslint-disable-next-line no-unused-vars
  static async getFolder(kind, subFolder = "", baseFolderName = "D&D Beyond Import", baseColor = "#6f0006", subColor = "#98020a", typeFolder = true) {
    const entityTypes = utils.entityMap();
    const folderName = game.i18n.localize(`ddb-importer.item-type.${kind}`);
    const entityType = entityTypes.get(kind);
    const baseFolder = await FolderHelper.getOrCreateFolder(null, entityType, baseFolderName, baseColor);
    const entityFolder = typeFolder
      ? await FolderHelper.getOrCreateFolder(baseFolder, entityType, folderName, subColor)
      : baseFolder;
    if (subFolder !== "") {
      const subFolderName = subFolder.charAt(0).toUpperCase() + subFolder.slice(1);
      const typeFolder = await FolderHelper.getOrCreateFolder(entityFolder, entityType, subFolderName, subColor);
      return typeFolder;
    } else {
      return entityFolder;
    }
  }

  /**
   * Retrieves the folder ID of a compendium with a given name within a specified compendium.
   *
   * @param {string} name - The name of the folder to search for.
   * @param {string} compendiumName - The name of the compendium to search within.
   * @return {Promise<string|undefined>} The ID of the folder if found, otherwise undefined.
   */
  static async getCompendiumFolderId(name, compendiumName) {
    const compendium = game.packs.get(compendiumName);
    return compendium.folders.find((f) => f.name === name)?._id;
  }

  /**
   * Updates game folder items
   * @param {*} type
   */
  static async updateFolderItems(type, input, update = true) {
    const folderLookup = SETTINGS.GAME_FOLDER_LOOKUPS.find((c) => c.type == type);
    const itemFolderNames = [...new Set(input[type]
      .filter((item) => item.flags?.ddbimporter?.dndbeyond?.lookupName)
      .map((item) => item.flags.ddbimporter.dndbeyond.lookupName))];

    const getSubFolders = async () => {
      return Promise.all(
        itemFolderNames.map((name) => {
          return FolderHelper.getFolder(folderLookup.folder, name);
        })
      );
    };

    const subFolders = await getSubFolders();

    const defaultItemsFolder = await FolderHelper.getFolder(folderLookup.folder);
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
            DDBItemImporter.copySupportedItemFlags(existingItem, item);
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

}


