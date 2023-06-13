import logger from "../../logger.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";
import PatreonHelper from "../../lib/PatreonHelper.js";
import { parseSpells } from "../spells.js";
import { parseItems } from "../items.js";
import AdventureMunch from "./AdventureMunch.js";
import SETTINGS from "../../settings.js";
import DDBMonsterFactory from "../../parser/DDBMonsterFactory.js";
import DDBMuncher from "../../apps/DDBMuncher.js";

export default class AdventureMunchHelpers {

  static unPad(match, p1) {
    if (isNaN(parseInt(p1))) {
      return p1;
    } else {
      return parseInt(p1);
    }
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
    let result = {};
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
      return AdventureMunchHelpers.ForgeUploadFile(path, file);
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
    return request.path;
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
        return AdventureMunchHelpers.BrowseForgeFiles(source, target, options);
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
        switch (type) {
          case "item":
            logger.debug(`Importing missing ${type}s from DDB`, docIds);
            AdventureMunch._progressNote(`Importing ${docIds.length} missing ${type}s from DDB`);
            resolve(parseItems(docIds));
            break;
          case "monster": {
            try {
              const tier = game.settings.get(SETTINGS.MODULE_ID, "patreon-tier");
              const tiers = PatreonHelper.getPatreonTiers(tier);
              if (tiers.all) {
                logger.debug(`Importing missing ${type}s from DDB`, docIds);
                AdventureMunch._progressNote(`Importing ${docIds.length} missing ${type}s from DDB`);
                const monsterFactory = new DDBMonsterFactory({ munchNote: DDBMuncher.munchNote });
                resolve(monsterFactory.processIntoCompendium(docIds));
              } else {
                logger.warn(`Unable to import missing ${type}s from DDB - link to patreon or use your own proxy`, docIds);
                ui.notifications.warn(`Unable to import missing ${type}s from DDB - link to patreon or use your own proxy`, { permanent: true });
                resolve([]);
              }
            } catch (err) {
              if (err instanceof SyntaxError) {
                ui.notifications.error("Error fetching monsters, likely cause outdated ddb-proxy", { permanent: true });
              } else {
                throw err;
              }
            }
            break;
          }
          case "spell":
            logger.debug(`Importing missing ${type}s from DDB`);
            AdventureMunch._progressNote(`Missing spells detected, importing from DDB`);
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
      const compendium = CompendiumHelper.getCompendiumType(type);
      const fields = (type === "monster")
        ? ["flags.ddbimporter.id"]
        : ["flags.ddbimporter.definitionId"];

      const compendiumIndex = compendium.getIndex({ fields: fields });
      resolve(compendiumIndex);
    });
  }

  static async checkForMissingDocuments(type, ids) {
    const index = await AdventureMunchHelpers.getCompendiumIndex(type);
    // console.warn(`${type} index`, index);

    return new Promise((resolve) => {
      const missingIds = ids.filter((id) => {
        switch (type) {
          case "monster":
            return !index.some((i) => i.flags?.ddbimporter?.id && String(i.flags.ddbimporter.id) == String(id));
          case "spell":
          case "item":
            return !index.some((i) => i.flags?.ddbimporter?.definitionId && String(i.flags.ddbimporter.definitionId) == String(id));
          default:
            return false;
        }
      });
      logger.debug(`${type} missing ids`, missingIds);
      const missingDocuments = AdventureMunchHelpers.loadMissingDocuments(type, missingIds);
      logger.debug(`${type} missing`, missingDocuments);
      resolve(missingDocuments);
    });
  }

  /**
   * Get documents for ids from compendium
   * @param {string} type compendium type
   * @param {Array} ids array of ddb ids
   * @param {boolean} temporary create the items in the world?
   * @returns {Promise<Array>} array of world actors
   */
  static async getDocuments(type, ids, overrides = {}, temporary = false) {
    const compendium = CompendiumHelper.getCompendiumType(type);
    const index = await AdventureMunchHelpers.getCompendiumIndex(type);
    const ddbIds = ids.map((num) => {
      return String(num);
    });

    return new Promise((resolve) => {
      const documents = index
        .filter((idx) => {
          switch (type) {
            case "monster":
              return ddbIds.includes(String(getProperty(idx, "flags.ddbimporter.id")));
            case "spell":
            case "item":
              return ddbIds.includes(String(getProperty(idx, "flags.ddbimporter.definitionId")));
            default:
              return false;
          }
        })
        .map((i) => {
          switch (type) {
            case "monster":
              return game.actors.importFromCompendium(compendium, i._id, overrides, { temporary, keepId: true, keepEmbeddedIds: true });
            case "spell":
            case "item":
              return game.items.importFromCompendium(compendium, i._id, overrides, { temporary, keepId: true, keepEmbeddedIds: true });
            default:
              // this should never happen
              return undefined;
          }

        });
      logger.debug(`${type} documents loaded`, documents);
      resolve(documents);
    });
  }


  static async linkExistingActorTokens(tokens) {
    const monsterIndex = await AdventureMunchHelpers.getCompendiumIndex("monster");

    const newTokens = tokens.map((token) => {
      const monsterHit = monsterIndex.find((monster) =>
        monster.flags?.ddbimporter?.id && token.flags.ddbActorFlags?.id
        && monster.flags.ddbimporter.id === token.flags.ddbActorFlags.id);
      if (monsterHit) {
        token.flags.compendiumActorId = monsterHit._id;
      }
      return token;
    });

    return newTokens;
  }

  // check the document for version data and for update info to see if we can replace it
  static extractDocumentVersionData(newDoc, existingDoc) {
    const ddbIVersion = game.modules.get(SETTINGS.MODULE_ID).version;
    if (!existingDoc) existingDoc = {};
    // do we have versioned metadata?
    setProperty(newDoc, "flags.ddb.versions.importer", {});
    if (newDoc?.flags?.ddb?.versions?.ddbMetaData?.lastUpdate) {
      // check old data, it might not exist
      const oldDDBMetaDataVersions = existingDoc.flags?.ddb?.versions?.ddbMetaData?.lastUpdate
        ? existingDoc.flags.ddb.versions.ddbMetaData
        : {
          lastUpdate: "0.0.1",
          drawings: "0.0.1",
          notes: "0.0.1",
          tokens: "0.0.1",
          walls: "0.0.1",
          lights: "0.0.1",
          foundry: "0.8.9",
        };
      const oldDDBImporterVersion = existingDoc?.flags?.ddb?.versions?.ddbImporter
        ? existingDoc.flags.ddb.versions.ddbImporter
        : "2.0.1";
      const oldAdventureMuncherVersion = existingDoc?.flags?.ddb?.versions?.adventureMuncher
        ? existingDoc.flags.ddb.versions.adventureMuncher
        : "0.3.0";
      const oldVersions = { ddbImporter: oldDDBImporterVersion, ddbMetaData: oldDDBMetaDataVersions, adventureMuncher: oldAdventureMuncherVersion };

      const documentVersions = newDoc.flags.ddb.versions;
      const documentFoundryVersion = documentVersions["ddbMetaData"]["foundry"] !== undefined ? documentVersions["ddbMetaData"]["foundry"] : "0.8.9";
      const importerVersionChanged = isNewerVersion(ddbIVersion, oldVersions["ddbImporter"]);
      const metaVersionChanged = isNewerVersion(documentVersions["ddbMetaData"]["lastUpdate"], oldVersions["ddbMetaData"]["lastUpdate"]);
      const muncherVersionChanged = isNewerVersion(documentVersions["adventureMuncher"], oldVersions["adventureMuncher"]);
      const foundryVersionNewer = isNewerVersion(documentFoundryVersion, game.version);

      let versionUpdates = {};

      if (metaVersionChanged || muncherVersionChanged || foundryVersionNewer) {
        versionUpdates.importerVersionChanged = importerVersionChanged;
        versionUpdates.metaVersionChanged = metaVersionChanged;
        versionUpdates.muncherVersionChanged = muncherVersionChanged;
        versionUpdates.foundryVersionNewer = foundryVersionNewer;
        versionUpdates.drawingVersionChanged = isNewerVersion(documentVersions["ddbMetaData"]["drawings"], oldVersions["ddbMetaData"]["drawings"]);
        versionUpdates.noteVersionChanged = isNewerVersion(documentVersions["ddbMetaData"]["notes"], oldVersions["ddbMetaData"]["notes"]);
        versionUpdates.tokenVersionChanged = isNewerVersion(documentVersions["ddbMetaData"]["tokens"], oldVersions["ddbMetaData"]["tokens"]);
        versionUpdates.wallVersionChanged = isNewerVersion(documentVersions["ddbMetaData"]["walls"], oldVersions["ddbMetaData"]["walls"]);
        versionUpdates.lightVersionChanged = isNewerVersion(documentVersions["ddbMetaData"]["lights"], oldVersions["ddbMetaData"]["lights"]);
      }
      setProperty(newDoc, "flags.ddb.versions.ddbImporter", ddbIVersion);
      setProperty(newDoc, "flags.ddb.versions.importer", versionUpdates);
      setProperty(newDoc, "flags.ddb.oldVersions", oldVersions);
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

  /**
   * Does the folder exist in the zip archive?
   * @param {String} folder folder name
   * @param {Zip} zip
   * @returns {Boolean}
   */
  static folderExists(folder, zip) {
    const files = Object.values(zip.files).filter((file) => {
      return file.dir && file.name.toLowerCase().includes(folder);
    });

    return files.length > 0;
  }

  /**
   * Get the files in the zip archive at the specified path
   * @param {String} folder a folder path to start from
   * @param {Zip} zip
   * @returns {Array} list of files in zip
   */
  static getFiles(folder, zip) {
    const files = Object.values(zip.files).filter((file) => {
      return !file.dir && file.name.split('.').pop() === 'json' && file.name.includes(`${folder}/`);
    });

    return files;
  }


}
