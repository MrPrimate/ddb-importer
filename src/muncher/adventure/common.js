import logger from "../../logger.js";
import utils from "../../utils.js";
import { DirectoryPicker } from "../../lib/DirectoryPicker.js";
import { checkMonsterCompendium } from "../importMonster.js";
import { parseCritters } from "../monsters.js";
import { parseSpells } from "../spells.js";
import { parseItems } from "../items.js";
import { getPatreonTiers, getCompendiumType } from "../utils.js";
import AdventureMunch from "./adventure.js";

const COMPENDIUM_MAP = {
  "spells": "spells",
  "magicitems": "items",
  "weapons": "items",
  "armor": "items",
  "adventuring-gear": "items",
  "monsters": "monsters",
};

const DDB_MAP = {
  "spells": "spells",
  "magicitems": "magic-items",
  "weapons": "equipment",
  "armor": "equipment",
  "adventuring-gear": "equipment",
  "monsters": "monsters",
};

export default class Helpers {


  static getImportFilePaths(path, adventure, misc) {
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
    const returnFilePath = misc
      ? `${targetPath}/${filename}`
      : `${adventurePath}/${targetPath}/${filename}`;
    return {
      adventurePath,
      targetPath,
      filename,
      baseUploadPath,
      parsedBaseUploadPath,
      uploadPath,
      returnFilePath,
    };
  }

  static unPad(match, p1) {
    if (isNaN(parseInt(p1))) {
      return p1;
    } else {
      return parseInt(p1);
    }
  }

  static async importRawFile(path, content, mimeType, adventure, misc) {
    try {
      if (path[0] === "*") {
        // this file was flagged as core data, just replace name.
        return path.replace(/\*/g, "");
      } else if (path.startsWith("icons/") || path.startsWith("systems/dnd5e/icons/") || path.startsWith("ddb://")) {
        // these are core icons, ignore
        // or are ddb:// paths that will be replaced by muncher
        return path;
      } else {
        const paths = Helpers.getImportFilePaths(path, adventure, misc);

        if (!CONFIG.DDBI.ADVENTURE.TEMPORARY.import[path]) {
          await DirectoryPicker.verifyPath(paths.parsedBaseUploadPath, `${paths.uploadPath}`);
          const fileData = new File([content], paths.filename, { type: mimeType });
          await Helpers.UploadFile(paths.parsedBaseUploadPath.activeSource, `${paths.uploadPath}`, fileData, { bucket: paths.parsedBaseUploadPath.bucket });
          // eslint-disable-next-line require-atomic-updates
          CONFIG.DDBI.ADVENTURE.TEMPORARY.import[path] = true;
        } else {
          logger.debug(`File already imported ${path}`);
        }

        const returnPath = await utils.getFileUrl(paths.baseUploadPath, paths.returnFilePath);
        return `${returnPath}`;
      }
    } catch (err) {
      logger.error(`Error importing image file ${path} : ${err.message}`);
    }

    return path;
  }

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
      } else if (path.startsWith("icons/") || path.startsWith("systems/dnd5e/icons/") || path.startsWith("ddb://")) {
        // these are core icons, ignore
        // or are ddb:// paths that will be replaced by muncher
        return path;
      } else {
        const paths = Helpers.getImportFilePaths(path, adventure, misc);

        if (!CONFIG.DDBI.ADVENTURE.TEMPORARY.import[path]) {
          await DirectoryPicker.verifyPath(paths.parsedBaseUploadPath, `${paths.uploadPath}`);
          const img = await zip.file(path).async("uint8array");
          const fileData = new File([img], paths.filename);
          await Helpers.UploadFile(paths.parsedBaseUploadPath.activeSource, `${paths.uploadPath}`, fileData, { bucket: paths.parsedBaseUploadPath.bucket });
          // eslint-disable-next-line require-atomic-updates
          CONFIG.DDBI.ADVENTURE.TEMPORARY.import[path] = true;
        } else {
          logger.debug(`File already imported ${path}`);
        }

        const returnPath = await utils.getFileUrl(paths.baseUploadPath, paths.returnFilePath);
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

  static async loadMissingDocuments(type, docIds) {
    return new Promise((resolve) => {
      if (docIds && docIds.length > 0) {
        logger.debug(`Importing missing ${type}s from DDB`, docIds);
        AdventureMunch._progressNote(`Importing ${docIds.length} missing ${type}s from DDB`);
        switch (type) {
          case "item":
            resolve(parseItems(docIds));
            break;
          case "monster": {
            const tier = game.settings.get("ddb-importer", "patreon-tier");
            const tiers = getPatreonTiers(tier);
            if (tiers.all) {
              resolve(parseCritters(docIds));
            } else {
              resolve([]);
            }
            break;
          }
          case "spell":
            // we actually want all spells, because monsters don't just use spells from a single source
            resolve(parseSpells());
            break;
          // no default
        }
      } else {
        resolve([]);
      }
    });
  }

  static async getCompendiumIndex(type) {
    return new Promise((resolve) => {
      const compendium = getCompendiumType(type);
      const fields = (type === "monster")
        ? ["flags.ddbimporter.id"]
        : ["flags.ddbimporter.definitionId"];

      const compendiumIndex = compendium.getIndex({ fields: fields });
      resolve(compendiumIndex);
    });
  }

  static async checkForMissingDocuments(type, ids) {
    const index = await Helpers.getCompendiumIndex(type);

    return new Promise((resolve) => {
      const missingIds = ids.filter((id) => {
        switch (type) {
          case "monster":
            return !index.some((i) => i.flags?.ddbimporter?.id && String(i.flags.ddbimporter.id) == id);
          case "spell":
          case "item":
            return !index.some((i) => i.flags?.ddbimporter?.definitionId && String(i.flags.ddbimporter.definitionId) == id);
          // no default
        }
        return false;
      });
      const missingDocuments = Helpers.loadMissingDocuments(type, missingIds);
      resolve(missingDocuments);
    });
  }

  static async linkExistingActorTokens(tokens) {
    const monsterIndex = await Helpers.getCompendiumIndex("monster");

    const newTokens = tokens.map((token) => {
      const monsterHit = monsterIndex.find((monster) =>
        monster.flags?.ddbimporter?.id && token.flags.ddbActorFlags?.id &&
        monster.flags.ddbimporter.id === token.flags.ddbActorFlags.id);
      if (monsterHit) {
        token.flags.compendiumActorId = monsterHit._id;
      }
      return token;
    });

    return newTokens;
  }

  static foundryCompendiumReplace(text) {
    // replace the ddb:// entries with known compendium look ups if we have them
    // ddb://spells
    // ddb://magicitems || weapons || adventuring-gear || armor
    // ddb://monsters

    let doc = utils.htmlToDoc(text);

    const lookups = CONFIG.DDBI.ADVENTURE.TEMPORARY.lookups.lookups;

    for (const lookupKey in COMPENDIUM_MAP) {
      const compendiumLinks = doc.querySelectorAll(`a[href*="ddb://${lookupKey}/"]`);
      logger.debug(`replacing ${lookupKey} references`, compendiumLinks);

      const lookupRegExp = new RegExp(`ddb://${lookupKey}/([0-9]*)`);
      compendiumLinks.forEach((node) => {
        const lookupMatch = node.outerHTML.match(lookupRegExp);
        const lookupValue = lookups[COMPENDIUM_MAP[lookupKey]];

        if (lookupValue) {
          const lookupEntry = lookupValue.find((e) => e.id == lookupMatch[1]);
          if (lookupEntry) {
            const documentRef = lookupEntry.documentName ? lookupEntry.documentName : lookupEntry._id;
            doc.body.innerHTML = doc.body.innerHTML.replace(node.outerHTML, `@Compendium[${lookupEntry.compendium}.${documentRef}]{${node.textContent}}`);
          } else {
            logger.warn(`NO Lookup Compendium Entry for ${node.outerHTML}`);
          }
        }
      });
    }

    // vehicles - not yet handled, links to DDB
    const compendiumLinks = doc.querySelectorAll("a[href*=\"ddb://vehicles/\"]");
    const lookupRegExp = /ddb:\/\/vehicles\/([0-9]*)/g;
    compendiumLinks.forEach((node) => {
      const target = node.outerHTML;
      const lookupMatch = node.outerHTML.match(lookupRegExp);
      const lookupValue = lookups["vehicles"];
      if (lookupMatch) {
        const lookupEntry = lookupValue.find((e) => e.id == lookupMatch[1]);
        if (lookupEntry) {
          node.setAttribute("href", `https://www.dndbeyond.com${lookupEntry.url}`);
          doc.body.innerHTML = doc.body.innerHTML.replace(target, node.outerHTML);
        } else {
          logger.warn(`NO Vehicle Lookup Entry for ${node.outerHTML}`);
        }
      } else {
        logger.warn(`NO Vehicle Lookup Match for ${node.outerHTML}`);
      }
    });

    // final replace in case of failure
    // there is a chance that the adventure references items or monsters we don't have access to
    // in this case attempt to link to DDB instead of compendium doc
    for (const lookupKey in COMPENDIUM_MAP) {
      const compendiumLinks = doc.querySelectorAll(`a[href*="ddb://${lookupKey}/"]`);
      logger.debug(`final replace for missing ${lookupKey} references`, compendiumLinks);

      compendiumLinks.forEach((node) => {
        const target = node.outerHTML;
        const ddbStub = DDB_MAP[lookupKey];
        const ddbNameGuess = node.textContent.toLowerCase().replace(" ", "-").replace(/[^0-9a-z-]/gi, '');
        logger.warn(`No Compendium Entry for ${node.outerHTML} attempting to guess a link to DDB`);

        node.setAttribute("href", `https://www.dndbeyond.com/${ddbStub}/${ddbNameGuess}`);
        doc.body.innerHTML = doc.body.innerHTML.replace(target, node.outerHTML);
      });
    }

    return doc.body.innerHTML;
  }

  static async linkDDBActors(tokens) {
    const linkedExistingTokens = await Helpers.linkExistingActorTokens(tokens);
    const newTokens = linkedExistingTokens
      .filter((token) => token.flags.ddbActorFlags?.id && token.flags.compendiumActorId);

    return Promise.all(newTokens);
  }

  static async generateTokenActors(scene) {
    const monsterCompendium = checkMonsterCompendium();

    const tokens = await Helpers.linkDDBActors(scene.tokens);

    const neededActors = tokens
      .map((token) => {
        return { name: token.name, ddbId: token.flags.ddbActorFlags.id, actorId: token.actorId, compendiumId: token.flags.compendiumActorId, folderId: token.flags.actorFolderId };
      })
      .filter((obj, pos, arr) => {
        // we only need to create 1 actor per actorId
        return arr.map((mapObj) => mapObj["actorId"]).indexOf(obj["actorId"]) === pos;
      });

    logger.debug("Trying to import actors from compendium", neededActors);
    await Helpers.asyncForEach(neededActors, async (actor) => {
      let worldActor = game.actors.get(actor.actorId);
      if (!worldActor) {
        logger.info(`Importing actor ${actor.name} with DDB ID ${actor.ddbId} from ${monsterCompendium.metadata.name} with id ${actor.compendiumId}`);
        try {
          worldActor = await game.actors.importFromCompendium(monsterCompendium, actor.compendiumId, { _id: actor.actorId, folder: actor.folderId }, { keepId: true });
        } catch (err) {
          logger.error(err);
          logger.warn(`Unable to import actor ${actor.name} with id ${actor.compendiumId} from DDB Compendium`);
          logger.debug(`Failed on: game.actors.importFromCompendium(monsterCompendium, "${actor.compendiumId}", { _id: "${actor.actorId}", folder: "${actor.folderId}" }, { keepId: true });`);
        }
      }
    });

    logger.debug("Actors transferred from compendium to world.");

  }

  // check the document for version data and for update info to see if we can replace it
  static extractDocumentVersionData(newDoc, existingDoc, ddbIVersion) {
    // do we have versioned metadata?
    if (newDoc?.flags?.ddb?.versions?.ddbMetaData?.lastUpdate) {
      // check old data, it might not exist
      const oldDDBMetaDataVersions = existingDoc.data?.flags?.ddb?.versions?.ddbMetaData?.lastUpdate
        ? existingDoc.data.flags.ddb.versions.ddbMetaData
        : {
          lastUpdate: "0.0.1",
          drawings: "0.0.1",
          notes: "0.0.1",
          tokens: "0.0.1",
          walls: "0.0.1",
          lights: "0.0.1",
        };
      const oldDDBImporterVersion = existingDoc.data?.flags?.ddb?.versions?.ddbImporter
      ? existingDoc.data.flags.ddb.versions.ddbImporter
      : "2.0.1";
      const oldAdventureMuncherVersion = existingDoc.data?.flags?.ddb?.versions?.adventureMuncher
      ? existingDoc.data.flags.ddb.versions.adventureMuncher
      : "0.3.0";
      const oldVersions = { ddbImporter: oldDDBImporterVersion, ddbMetaData: oldDDBMetaDataVersions, adventureMuncher: oldAdventureMuncherVersion };

      const documentVersions = newDoc.flags.ddb.versions;
      const importerVersionChanged = isNewerVersion(ddbIVersion, oldVersions["ddbImporter"]);
      const metaVersionChanged = isNewerVersion(documentVersions["ddbMetaData"]["lastUpdate"], oldVersions["ddbMetaData"]["lastUpdate"]);
      const muncherVersionChanged = isNewerVersion(documentVersions["adventureMuncher"], oldVersions["adventureMuncher"]);

      if (importerVersionChanged || metaVersionChanged || muncherVersionChanged) {
        newDoc.oldVersions = oldVersions;
        newDoc.importerVersionChanged = importerVersionChanged;
        newDoc.metaVersionChanged = metaVersionChanged;
        newDoc.muncherVersionChanged = muncherVersionChanged;
        newDoc.drawingVersionChanged = isNewerVersion(documentVersions["ddbMetaData"]["drawings"], oldVersions["ddbMetaData"]["drawings"]);
        newDoc.noteVersionChanged = isNewerVersion(documentVersions["ddbMetaData"]["notes"], oldVersions["ddbMetaData"]["notes"]);
        newDoc.tokenVersionChanged = isNewerVersion(documentVersions["ddbMetaData"]["tokens"], oldVersions["ddbMetaData"]["tokens"]);
        newDoc.wallVersionChanged = isNewerVersion(documentVersions["ddbMetaData"]["walls"], oldVersions["ddbMetaData"]["walls"]);
        newDoc.lightVersionChanged = isNewerVersion(documentVersions["ddbMetaData"]["lights"], oldVersions["ddbMetaData"]["lights"]);
      }
    }
    return newDoc;
  }

  static getImportType(type) {
    const typeName = type[0].toUpperCase() + type.slice(1);
    let importType = typeName;

    switch (type) {
      case "journal":
        importType = "JournalEntry";
        break;
      case "table":
        importType = "RollTable";
        break;
      default:
        importType = typeName;
        break;
    }

    return importType;
  }

  static folderExists(folder, zip) {
    const files = Object.values(zip.files).filter((file) => {
      return file.dir && file.name.toLowerCase().includes(folder);
    });

    return files.length > 0;
  }

  static getFiles(folder, zip) {
    const files = Object.values(zip.files).filter((file) => {
      return !file.dir && file.name.split('.').pop() === 'json' && file.name.includes(`${folder}/`);
    });

    return files;
  }


}
