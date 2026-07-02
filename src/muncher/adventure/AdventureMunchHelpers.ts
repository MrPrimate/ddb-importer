import { logger, CompendiumHelper, PatreonHelper, utils, FileHelper } from "../../lib/_module";
import { parseSpells } from "../spells";
import DDBItemsImporter from "../DDBItemsImporter";
import AdventureMunch from "./AdventureMunch";
import { SETTINGS } from "../../config/_module";
import DDBMonsterFactory from "../../parser/DDBMonsterFactory";

export default class AdventureMunchHelpers {

  /**
   * Find an entity by the import key.
   * @param  {string} type Entity type to search for
   * @param  {string} id Entity Id
   * @returns {object} Entity Object Data
   */
  static findEntityByImportId(type, id) {
    return game.data[type].find((item) => item._id === id);
  }

  /**
   * Reverse-migrate a v14 levels format scene back to v13 format.
   * This is the inverse of `AdventureMunch._migrateSceneDataToV14`.
   * @param {object} data Scene data
   * @returns {object} v13 format scene data
   */
  static migrateSceneDataFromV14(data) {
    if (!Array.isArray(data.levels) || data.levels.length === 0) return data;

    // This is often "mixed" data: a genuine v13 scene that has had a v14 `levels`
    // block appended, with the real background (src + offset + scale) left intact
    // at the top level while the level's own background is empty. In that case keep
    // the v13 background verbatim - the empty level (whose textures.offset is 0, not
    // null) must NOT clobber the real offset, or the map shifts by that offset.
    // Only reconstruct the v13 background from the level for pure-v14 data.
    const existingBg = (data.background && typeof data.background === "object") ? data.background : null;
    const pureV14 = !existingBg?.src;

    if (pureV14) {
      // Prefer the initial level, but if it has no background image, fall back to
      // the first level that does (mixed exports sometimes leave the initial empty).
      const initialLevel = data.levels.find((l) => l._id === data.initialLevel) ?? data.levels[0];
      const level = initialLevel.background?.src
        ? initialLevel
        : (data.levels.find((l) => l.background?.src) ?? initialLevel);
      const bg = level.background ?? {};
      const textures = level.textures ?? {};

      data.background = {
        src: bg.src ?? data.img ?? null,
        tint: bg.tint ?? "#ffffff",
        alphaThreshold: bg.alphaThreshold ?? 0.75,
        anchorX: textures.anchorX ?? 0.5,
        anchorY: textures.anchorY ?? 0.5,
        // v14 top-level shiftX/Y → v13 background.offsetX/Y
        offsetX: data.shiftX ?? textures.offsetX ?? 0,
        offsetY: data.shiftY ?? textures.offsetY ?? 0,
        fit: textures.fit ?? "fill",
        scaleX: textures.scaleX ?? 1,
        scaleY: textures.scaleY ?? 1,
        rotation: textures.rotation ?? 0,
      };

      data.foreground = level.foreground?.src
        ?? (typeof level.foreground === "string" ? level.foreground : null);
    }

    if (data.backgroundColor == null) {
      const initial = data.levels.find((l) => l._id === data.initialLevel) ?? data.levels[0];
      data.backgroundColor = initial?.background?.color ?? "#999999";
    }

    if (data.fog && "mode" in data.fog) {
      data.fog = {
        exploration: data.fog.mode >= 1,
        overlay: null,
        colors: data.fog.colors ?? {},
      };
    }

    delete data.levels;
    delete data.initialLevel;
    delete data.shiftX;
    delete data.shiftY;
    delete data.transition;

    if (Array.isArray(data.tokens)) {
      for (const token of data.tokens) {
        delete token.level;
        delete token.depth;
      }
    }

    if (Array.isArray(data.walls)) {
      for (const wall of data.walls) {
        delete wall.levels;
      }
    }

    if (Array.isArray(data.lights)) {
      for (const light of data.lights) {
        delete light.levels;
        delete light.locked;
      }
    }

    for (const key of ["notes", "sounds", "drawings"]) {
      if (Array.isArray(data[key])) {
        for (const placeable of data[key]) {
          delete placeable.levels;
        }
      }
    }

    // Regions: drop levels, and drop v14 visibility modes v13 rejects (v13 allows 0/1/2)
    if (Array.isArray(data.regions)) {
      for (const region of data.regions) {
        delete region.levels;
        if (![0, 1, 2].includes(region.visibility)) delete region.visibility;
      }
    }

    // Tiles: For pure-v14 data also convert anchor-relative coords back
    // to v13 top-left. v13 tiles natively carry texture.anchorX/Y (default 0.5) with
    // top-left x/y
    if (Array.isArray(data.tiles)) {
      for (const tile of data.tiles) {
        if (pureV14) {
          const anchorX = tile.texture?.anchorX;
          const anchorY = tile.texture?.anchorY;
          if (anchorX !== undefined || anchorY !== undefined) {
            tile.x = (tile.x ?? 0) - (tile.width ?? 0) * (anchorX ?? 0);
            tile.y = (tile.y ?? 0) - (tile.height ?? 0) * (anchorY ?? 0);
            if (tile.texture) {
              delete tile.texture.anchorX;
              delete tile.texture.anchorY;
            }
          }
        }
        delete tile.levels;
      }
    }

    logger.debug("Reverse-migrated scene data from v14 levels format to v13", {
      data,
    });
    return data;
  }

  /**
   * Async replace for all matching patterns
   *
   * @param {string} str Original string to replace values in
   * @param {string} regex regex for matching
   * @param {Function} asyncFn async function to run on each match
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
  static diff(obj1: object, obj2: object): object {
    const result = {};
    for (const key in obj1) {
      if (obj2[key] != obj1[key]) result[key] = obj2[key];
      if (Array.isArray(obj2[key]) && Array.isArray(obj1[key]))
        result[key] = this.diff(obj1[key], obj2[key]);
      if (typeof obj2[key] == "object" && typeof obj1[key] == "object")
        result[key] = this.diff(obj1[key], obj2[key]);
    }
    return result;
  }

  /**
   * Replaces matchAll as it's not yet available in Electron App
   * @param   {string} regexp RegEx to use
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
            resolve(DDBItemsImporter.fetchAndImportItems({ useSourceFilter: false, ids: docIds, deleteBeforeUpdate: false }));
            break;
          case "monster": {
            try {
              const tier = PatreonHelper.getPatreonTier();
              const tiers = PatreonHelper.calculateAccessMatrix(tier);
              if (tiers.all) {
                logger.debug(`Importing missing ${type}s from DDB`, docIds);
                AdventureMunch._progressNote(`Importing ${docIds.length} missing ${type}s from DDB`);
                const monsterFactory = new DDBMonsterFactory({ notifier: utils.munchNote });
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
            resolve(parseSpells({ ids: null, deleteBeforeUpdate: false }));
            break;
          // no default
        }
      } else {
        resolve([]);
      }
    });
  }

  static async getCompendiumIndex(type) {
    const compendium = CompendiumHelper.getCompendiumType(type);
    const fields = (type === "monster")
      ? ["flags.ddbimporter.id"]
      : ["flags.ddbimporter.definitionId"];

    const indexFields = { fields } as CompendiumCollection.GetIndexOptions<CompendiumCollection.DocumentName>;
    const compendiumIndex = await compendium.getIndex(indexFields) as IndexTypeForMetadata<CompendiumCollection.DocumentName>;
    return compendiumIndex;
  }

  static async checkForMissingDocuments(type, ids) {
    const index = await AdventureMunchHelpers.getCompendiumIndex(type);
    // console.warn(`${type} index`, index);

    return new Promise((resolve) => {
      const missingIds = ids.filter((id) => {
        switch (type) {
          case "monster":
            return !index.some((i) => foundry.utils.getProperty(i, "flags.ddbimporter.id") && String(foundry.utils.getProperty(i, "flags.ddbimporter.id")) == String(id));
          case "spell":
          case "item":
            return !index.some((i) => foundry.utils.getProperty(i, "flags.ddbimporter.definitionId") && String(foundry.utils.getProperty(i, "flags.ddbimporter.definitionId")) == String(id));
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
   * @param {object} overrides overrides
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
              return game.actors.importFromCompendium(
                compendium as CompendiumCollection<"Actor">,
                i._id, overrides, { temporary, keepId: true, keepEmbeddedIds: true },
              );
            case "spell":
            case "item":
              return game.items.importFromCompendium(
                compendium as CompendiumCollection<"Item">,
                i._id, overrides, { temporary, keepId: true, keepEmbeddedIds: true },
              );
            default:
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

      const versionUpdates = {
        importerVersionChanged: importerVersionChanged,
        metaVersionChanged: metaVersionChanged,
        muncherVersionChanged: muncherVersionChanged,
        foundryVersionNewer: foundryVersionNewer,
        drawingVersionChanged: foundry.utils.isNewerVersion(documentVersions["ddbMetaData"]["drawings"], oldVersions["ddbMetaData"]["drawings"]),
        noteVersionChanged: foundry.utils.isNewerVersion(documentVersions["ddbMetaData"]["notes"], oldVersions["ddbMetaData"]["notes"]),
        tokenVersionChanged: foundry.utils.isNewerVersion(documentVersions["ddbMetaData"]["tokens"], oldVersions["ddbMetaData"]["tokens"]),
        wallVersionChanged: foundry.utils.isNewerVersion(documentVersions["ddbMetaData"]["walls"], oldVersions["ddbMetaData"]["walls"]),
        lightVersionChanged: foundry.utils.isNewerVersion(documentVersions["ddbMetaData"]["lights"], oldVersions["ddbMetaData"]["lights"]),
      };
      foundry.utils.setProperty(newDoc, "flags.ddb.versions.ddbImporter", ddbIVersion);
      foundry.utils.setProperty(newDoc, "flags.ddb.versions.importer", versionUpdates);
      foundry.utils.setProperty(newDoc, "flags.ddb.oldVersions", oldVersions);
    }
    return newDoc;
  }

  static getImportType(type: string) {
    const typeName = type[0].toUpperCase() + type.slice(1);
    let importType: string;

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
   * Returns an object with various file paths, including the key to the file in the upload folder,
   * the path to the file relative to the adventure upload path, the full path to the file, and the
   * filename with or without the .webp extension.
   * @param {object} options The options object.
   * @param {string} options.adventureName The name of the adventure.
   * @param {string} options.path The path to the file.
   * @param {boolean} options.misc Indicates if the file is a miscellaneous import.
   * @returns {object} An object containing:
   *   pathKey: the key to the file in the upload folder
   *   adventurePath: the path to the file relative to the adventure upload path
   *   targetPath: the path to the file relative to the base upload path
   *   filename: the filename with the .webp extension if useWebP is true
   *   baseUploadPath: the base upload path
   *   parsedBaseUploadPath: the parsed base upload path
   *   uploadPath: the full path to the file
   *   returnFilePath: the path to the file relative to the adventure upload path
   *   baseFilename: the filename without the .webp extension
   *   fullUploadPath: the full path to the file
   *   forcingWebp: whether the .webp extension was added
   */
  static getImportFilePaths({ adventureName, path, misc }: { adventureName: string; path: string; misc: boolean }): object {
    const useWebP = game.settings.get(SETTINGS.MODULE_ID, "use-webp") && !path.endsWith("svg") && !path.endsWith("pdf");
    const adventurePath = adventureName.replace(/[^a-z0-9]/gi, "_");
    const targetPath = path.replace(/[\\/][^\\/]+$/, "");
    const baseFilename = path.replace(/^.*[\\/]/, "").replace(/\?(.*)/, "");
    const filename
      = useWebP && !baseFilename.endsWith(".webp")
        ? `${FileHelper.removeFileExtension(baseFilename)}.webp`
        : baseFilename;
    const baseUploadPath = misc
      ? game.settings.get(SETTINGS.MODULE_ID, "adventure-misc-path")
      : game.settings.get(SETTINGS.MODULE_ID, "adventure-upload-path");
    const parsedBaseUploadPath = FileHelper.parseDirectory(baseUploadPath);
    const uploadPath = misc
      ? `${parsedBaseUploadPath.current}/${targetPath}`
      : `${parsedBaseUploadPath.current}/${adventurePath}/${targetPath}`;
    const fullUploadPath = misc
      ? `${baseUploadPath}/${targetPath}`
      : `${baseUploadPath}/${adventurePath}/${targetPath}`;
    const pathKey = `${fullUploadPath}/${filename}`;
    const returnFilePath = misc ? `${targetPath}/${filename}` : `${adventurePath}/${targetPath}/${filename}`;
    return {
      pathKey,
      adventurePath,
      targetPath,
      filename,
      baseUploadPath,
      parsedBaseUploadPath,
      uploadPath,
      returnFilePath,
      baseFilename,
      fullUploadPath,
      forcingWebp: useWebP && baseFilename !== filename,
    };
  }

}
