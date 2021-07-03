import logger from "../../logger.js";
import utils from "../../utils.js";
import { DirectoryPicker } from "../../lib/DirectoryPicker.js";

export default class Helpers {

  /**
   * Imports binary file, by extracting from zip file and uploading to path.
   *
   * @param  {string} path - Path to image within zip file
   * @param  {object} zip - Zip file
   * @returns {string} - Path to file within VTT
   */
  static async importImage(path, zip, adventure, misc = false) {
    try {
      if (path[0] === "*") {
        // this file was flagged as core data, just replace name.
        return path.replace(/\*/g, "");
      } else {
        const adventurePath = (adventure.name).replace(/[^a-z0-9]/gi, '_');
        const targetPath = path.replace(/[\\/][^\\/]+$/, '');
        const filename = path.replace(/^.*[\\/]/, '').replace(/\?(.*)/, '');
        const baseUploadPath = misc
          ? game.settings.get("ddb-importer", "adventure-misc-path")
          : game.settings.get("ddb-importer", "adventure-upload-path");
        const parsedBaseUploadPath = DirectoryPicker.parse(baseUploadPath);
        const uploadPath = misc
         ? `${parsedBaseUploadPath.current}/${targetPath}`
         : `${parsedBaseUploadPath.current}/${adventurePath}/${targetPath}`;

        if (!CONFIG.DDBI.ADVENTURE.TEMPORARY.import[path]) {
          await DirectoryPicker.verifyPath(parsedBaseUploadPath, `${uploadPath}`);
          const img = await zip.file(path).async("uint8array");
          const fileData = new File([img], filename);
          await Helpers.UploadFile(parsedBaseUploadPath.activeSource, `${uploadPath}`, fileData, { bucket: parsedBaseUploadPath.bucket });
          // eslint-disable-next-line require-atomic-updates
          CONFIG.DDBI.ADVENTURE.TEMPORARY.import[path] = true;
        } else {
          logger.debug(`File already imported ${path}`);
        }

        const returnFilePath = misc
          ? `${targetPath}/${filename}`
          : `${adventurePath}/${targetPath}/${filename}`;
        const returnPath = await utils.getFileUrl(baseUploadPath, returnFilePath);

        return `${returnPath}`;
      }
    } catch (err) {
      logger.error(`Error importing image file ${path} : ${err.message}`);
    }

    return path;
  }

  /**
   * Async for each loop
   *
   * @param  {array} array - Array to loop through
   * @param  {function} callback - Function to apply to each array item loop
   */
  static async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index += 1) {
      // eslint-disable-next-line callback-return, no-await-in-loop
      await callback(array[index], index, array);
    }
  }

  /**
   * Attempts to find a compendium pack by name, if not found, create a new one based on item type
   * @param  {string} type - Type of compendium
   * @param  {string} name - Name of compendium
   * @returns {object} - Compendium pack
   */
  static async getCompendiumPack(type, name) {
    let pack = game.packs.find((p) => {
      return p.metadata.label === name;
    });

    if (!pack) {
      pack = await Compendium.create({ entity: type, label: name }, { keepId: true });
    }

    return pack;
  }

  /**
   * Find an entity by the import key.
   * @param  {string} type - Entity type to search for
   * @param  {string} id - Entity Id
   * @returns {object} - Entity Object Data
   */
  static findEntityByImportId(type, id) {
    return game.data[type].find((item) => item._id === id);
      // item.flags.importid === id
  }

  /**
   * Converts and object into an update object for entity update function
   * @param  {object} newItem - Object data
   * @returns {object} - Entity Update Object
   */
  static buildUpdateData(newItem) {
    let updateData = {};

    for (let key in newItem) {
      const recursiveObject = (itemkey, obj) => {
        for (let objkey in obj) {
          if (typeof obj[objkey] === "object") {
            recursiveObject(`${itemkey}.${objkey}`, obj[objkey]);
          } else if (obj[objkey]) {
            const datakey = `${itemkey}.${objkey}`;
            updateData[datakey] = obj[objkey];
          }
        }
      };

      if (typeof newItem[key] === "object") {
        recursiveObject(key, newItem[key]);
      } else {
        const datakey = `${key}`;
        updateData[datakey] = `${newItem[key]}`;
      }
    }
    return updateData;
  }


  /**
   * Async replace for all matching patterns
   *
   * @param  {string} str - Original string to replace values in
   * @param  {string} regex - regex for matching
   * @param  {function} asyncFn - async function to run on each match
   * @returns {string}
   */
  static async replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}

  /**
   * Returns the difference between object 1 and 2
   * @param  {object} obj1
   * @param  {object} obj2
   * @returns {object}
   */
  static diff(obj1, obj2) {
    var result = {};
    for (const key in obj1) {
        if (obj2[key] != obj1[key]) result[key] = obj2[key];
        // eslint-disable-next-line valid-typeof
        if (typeof obj2[key] == 'array' && typeof obj1[key] == 'array')
            result[key] = this.diff(obj1[key], obj2[key]);
        if (typeof obj2[key] == 'object' && typeof obj1[key] == 'object')
            result[key] = this.diff(obj1[key], obj2[key]);
    }
    return result;
  }

  /**
   * Read data from a user provided File object
   * @param {File} file           A File object
   * @return {Promise.<String>}   A Promise which resolves to the loaded text data
   */
  static readBlobFromFile(file) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reader.abort();
        reject();
      };
      reader.readAsBinaryString(file);
    });
  }

  static async importFolder(parentFolder, folders, adventure, folderList) {
    await this.asyncForEach(folders, async (f) => {
      let folderData = f;

      let newFolder = game.folders.find((folder) => {
        return (folder.data._id === folderData._id || folder.data.flags.importid === folderData._id) && folder.data.type === folderData.type;
      });

      if (!newFolder) {
        if (folderData.parent !== null) {
          folderData.parent = CONFIG.DDBI.ADVENTURE.TEMPORARY.folders[folderData.parent];
        } else if (adventure?.options?.folders) {
            folderData.parent = CONFIG.DDBI.ADVENTURE.TEMPORARY.folders["null"];
          } else {
            folderData.parent = CONFIG.DDBI.ADVENTURE.TEMPORARY.folders[folderData.type];
          }

        newFolder = await Folder.create(folderData, { keepId: true });
        logger.debug(`Created new folder ${newFolder.data._id} with data:`, folderData, newFolder);
      }

      // eslint-disable-next-line require-atomic-updates
      CONFIG.DDBI.ADVENTURE.TEMPORARY.folders[folderData.flags.importid] = newFolder.data._id;

      let childFolders = folderList.filter((folder) => {
        return folder.parent === folderData._id;
      });

      if (childFolders.length > 0) {
        await this.importFolder(newFolder, childFolders, adventure, folderList);
      }
    });
  }

  /**
   * Replaces matchAll as it's not yet available in Electron App
   * @param   {string} regex  RegEx to use
   * @param   {string} string String to match on
   * @returns {Array}
   */
  static reMatchAll(regexp, string) {
    const matches = string.match(new RegExp(regexp, "gm"));
    if (matches) {
        let start = 0;
        return matches.map((group0) => {
            const match = group0.match(regexp);
            match.index = string.indexOf(group0, start);
            start = match.index;
            return match;
        });
    }
    return matches;
  }

  /**
   * Uploads a file to Foundry without the UI Notification
   * @param  {string} source
   * @param  {string} path
   * @param  {blog} file
   * @param  {object} options
   */
  static async UploadFile(source, path, file, options) {
    if (typeof ForgeVTT !== "undefined" && ForgeVTT?.usingTheForge) {
      return Helpers.ForgeUploadFile(path, file);
    }

    const fd = new FormData();
    fd.set("source", source);
    fd.set("target", path);
    fd.set("upload", file);
    Object.entries(options).forEach((o) => fd.set(...o));

    const request = await fetch(FilePicker.uploadURL, { method: "POST", body: fd });
    if (request.status === 413) {
      return ui.notifications.error(game.i18n.localize("FILES.ErrorTooLarge"));
    } else if (request.status !== 200) {
      return ui.notifications.error(game.i18n.localize("FILES.ErrorSomethingWrong"));
    }
    return undefined;
  }

  /**
   * Uploads a file to Forge Asset Library without the UI Notification
   * @param  {string} source
   * @param  {string} path
   * @param  {blog} file
   * @param  {object} options
   */
  static async ForgeUploadFile(path, file) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("path", `${path}/${file.name}`);

    const response = await ForgeAPI.call("assets/upload", fd);
    if (!response || response.error) {
      ui.notifications.error(response ? response.error : "An unknown error occured accessing The Forge API");
      return false;
    } else {
      return { path: response.url };
    }
  }

  /**
   * Browse files using FilePicker
   * @param  {string} source
   * @param  {string} target
   * @param  {object} options={}
   */
  static async BrowseFiles(source, target, options = {}) {
    if (typeof ForgeVTT !== "undefined" && ForgeVTT?.usingTheForge) {
      if (target.startsWith(ForgeVTT.ASSETS_LIBRARY_URL_PREFIX)) source = "forgevtt";

      if (source === "forgevtt") {
        return Helpers.BrowseForgeFiles(source, target, options);
      }
    }

    return FilePicker.browse(source, target, options);
  }

  /**
   * Browse files using Forge API
   * @param  {string} source
   * @param  {string} target
   * @param  {object} options={}
   */
  static async BrowseForgeFiles(source, target, options = {}) {
    if (target.startsWith(ForgeVTT.ASSETS_LIBRARY_URL_PREFIX)) {
      if (options.wildcard)
          options.wildcard = target;
      target = target.slice(ForgeVTT.ASSETS_LIBRARY_URL_PREFIX.length);
      target = target.split("/").slice(1, -1).join("/"); // Remove userid from url to get target path
    }

    const response = await ForgeAPI.call('assets/browse', { path: decodeURIComponent(target), options });
    if (!response || response.error) {
        ui.notifications.error(response ? response.error : "An unknown error occured accessing The Forge API");
        return { target, dirs: [], files: [], gridSize: null, private: false, privateDirs: [], extensions: options.extensions };
    }
    // Should be decodeURIComponent but FilePicker's _onPick needs to do encodeURIComponent too, but on each separate path.
    response.target = decodeURI(response.folder);
    delete response.folder;
    response.dirs = response.dirs.map((d) => d.path.slice(0, -1));
    response.files = response.files.map((f) => f.url);
    // 0.5.6 specific
    response.private = true;
    response.privateDirs = [];
    response.gridSize = null;
    response.extensions = options.extensions;
    return response;
  }

}
