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

  /**
   * Find an entity by the import key.
   * @param  {string} type - Entity type to search for
   * @param  {string} id - Entity Id
   * @returns {object} - Entity Object Data
   */
  static findEntityByImportId(type, id) {
    return game.data[type].find((item) => item._id === id);
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

  static async loadMissingDocuments(type, docIds) {
    return new Promise((resolve) => {
      if (docIds && docIds.length > 0) {
        switch (type) {
          case "item":
            logger.debug(`Importing missing ${type}s from DDB`, docIds);
            AdventureMunch._progressNote(`Importing ${docIds.length} missing ${type}s from DDB`);
            resolve(parseItems(docIds, false));
            break;
          case "monster": {
            try {
              const tier = PatreonHelper.getPatreonTier();
              const tiers = PatreonHelper.calculateAccessMatrix(tier);
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
            resolve(parseSpells(null, false));
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
              return ddbIds.includes(String(foundry.utils.getProperty(idx, "flags.ddbimporter.id")));
            case "spell":
            case "item":
              return ddbIds.includes(String(foundry.utils.getProperty(idx, "flags.ddbimporter.definitionId")));
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
    foundry.utils.setProperty(newDoc, "flags.ddb.versions.importer", {});
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
      const importerVersionChanged = foundry.utils.isNewerVersion(ddbIVersion, oldVersions["ddbImporter"]);
      const metaVersionChanged = foundry.utils.isNewerVersion(documentVersions["ddbMetaData"]["lastUpdate"], oldVersions["ddbMetaData"]["lastUpdate"]);
      const muncherVersionChanged = foundry.utils.isNewerVersion(documentVersions["adventureMuncher"], oldVersions["adventureMuncher"]);
      const foundryVersionNewer = foundry.utils.isNewerVersion(documentFoundryVersion, game.version);

      let versionUpdates = {};

      if (metaVersionChanged || muncherVersionChanged || foundryVersionNewer) {
        versionUpdates.importerVersionChanged = importerVersionChanged;
        versionUpdates.metaVersionChanged = metaVersionChanged;
        versionUpdates.muncherVersionChanged = muncherVersionChanged;
        versionUpdates.foundryVersionNewer = foundryVersionNewer;
        versionUpdates.drawingVersionChanged = foundry.utils.isNewerVersion(documentVersions["ddbMetaData"]["drawings"], oldVersions["ddbMetaData"]["drawings"]);
        versionUpdates.noteVersionChanged = foundry.utils.isNewerVersion(documentVersions["ddbMetaData"]["notes"], oldVersions["ddbMetaData"]["notes"]);
        versionUpdates.tokenVersionChanged = foundry.utils.isNewerVersion(documentVersions["ddbMetaData"]["tokens"], oldVersions["ddbMetaData"]["tokens"]);
        versionUpdates.wallVersionChanged = foundry.utils.isNewerVersion(documentVersions["ddbMetaData"]["walls"], oldVersions["ddbMetaData"]["walls"]);
        versionUpdates.lightVersionChanged = foundry.utils.isNewerVersion(documentVersions["ddbMetaData"]["lights"], oldVersions["ddbMetaData"]["lights"]);
      }
      foundry.utils.setProperty(newDoc, "flags.ddb.versions.ddbImporter", ddbIVersion);
      foundry.utils.setProperty(newDoc, "flags.ddb.versions.importer", versionUpdates);
      foundry.utils.setProperty(newDoc, "flags.ddb.oldVersions", oldVersions);
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
