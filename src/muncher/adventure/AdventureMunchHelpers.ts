import { logger, CompendiumHelper, PatreonHelper, FileHelper } from "../../lib/_module";
import { parseSpells } from "../spells";
import DDBItemsImporter from "../DDBItemsImporter";
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

  static async loadMissingDocuments(type, docIds, notifierV2 = null) {
    return new Promise((resolve) => {
      if (docIds && docIds.length > 0) {
        switch (type) {
          case "item":
            logger.debug(`Importing missing ${type}s from DDB`, docIds);
            notifierV2?.({ section: "note", message: `Importing ${docIds.length} missing ${type}s from DDB` });
            resolve(DDBItemsImporter.fetchAndImportItems({
              useSourceFilter: false,
              ids: docIds,
              deleteBeforeUpdate: false,
              notifierV2,
            }));
            break;
          case "monster": {
            try {
              const tier = PatreonHelper.getPatreonTier();
              const tiers = PatreonHelper.calculateAccessMatrix(tier);
              if (tiers.all) {
                logger.debug(`Importing missing ${type}s from DDB`, docIds);
                notifierV2?.({ section: "note", message: `Importing ${docIds.length} missing ${type}s from DDB` });
                const monsterFactory = new DDBMonsterFactory({
                  notifierV2,
                });
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
            notifierV2?.({ section: "note", message: `Missing spells detected, importing from DDB` });
            // we actually want all spells, because monsters don't just use spells from a single source
            resolve(parseSpells({ ids: null, deleteBeforeUpdate: false, notifierV2 }));
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

  static async getMissingIds(type, ids) {
    const index = await AdventureMunchHelpers.getCompendiumIndex(type);
    const flagPath = (type === "monster") ? "flags.ddbimporter.id" : "flags.ddbimporter.definitionId";
    return ids.filter((id) =>
      !index.some((i) => {
        const v = foundry.utils.getProperty(i, flagPath);
        return v != null && String(v) === String(id);
      }),
    );
  }

  static async checkForMissingDocuments(type, ids, notifierV2 = null) {
    const missingIds = await AdventureMunchHelpers.getMissingIds(type, ids);
    logger.debug(`${type} missing ids`, missingIds);
    const missingDocuments = AdventureMunchHelpers.loadMissingDocuments(type, missingIds, notifierV2);
    logger.debug(`${type} missing`, missingDocuments);
    return missingDocuments;
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

  /**
   * Import compendium monsters (by DDB id) into the world, deduping against
   * existing world actors by `flags.ddbimporter.id`. Per-actor resilient: a
   * failed import warns and is skipped rather than throwing.
   * @param {Array<number|string>} ddbIds DDB monster ids to import
   * @param {object} [options]
   * @param {string|null} [options.folderId] default target world Actor folder id
   * @param {Map<string|number, object>} [options.overridesById] per-ddbId import
   *   overrides (e.g. `{ _id, folder }`) that take precedence over `folderId`
   * @returns {Promise<Array>} the imported/existing world actors
   */
  static async importMonstersToWorld(ddbIds, { folderId = null, overridesById = null } = {}) {
    const compendium = CompendiumHelper.getCompendiumType("monster", false);
    if (!compendium) {
      logger.warn("AdventureMunchHelpers.importMonstersToWorld: no monster compendium available");
      return [];
    }
    const index = await AdventureMunchHelpers.getCompendiumIndex("monster");
    const wanted = new Set(ddbIds.map((id) => String(id)));
    const results = [];
    for (const idx of index) {
      const ddbId = String(foundry.utils.getProperty(idx, "flags.ddbimporter.id") ?? "");
      if (!wanted.has(ddbId)) continue;
      let worldActor = game.actors.find(
        (a) => String(foundry.utils.getProperty(a, "flags.ddbimporter.id") ?? "") === ddbId,
      );
      if (!worldActor) {
        const override = overridesById?.get?.(ddbId) ?? overridesById?.get?.(Number(ddbId)) ?? {};
        const overrides = { folder: folderId, ...override };
        try {
          worldActor = await game.actors.importFromCompendium(
            compendium as CompendiumCollection<"Actor">,
            idx._id, overrides, { keepId: true, keepEmbeddedIds: true },
          );
        } catch (err) {
          logger.warn(`AdventureMunchHelpers: failed to import monster ${idx.name} (ddbId ${ddbId}) into world: ${(err as Error).message ?? err}`);
          continue;
        }
      }
      if (worldActor) results.push(worldActor);
    }
    return results;
  }

  /**
   * Generic scene-selection dialog. Shows a checkbox per item; returns the
   * selected `_id` array ("Selected" button) or `null` ("All" button or
   * dismissed - callers treat `null` as "import everything").
   * @param {Array<{_id: string, name: string, label?: string}>} items the
   *   selectable scenes (`label` is an optional version/suffix, shown italic)
   * @returns {Promise<string[] | null>} selected ids, or `null` for "All"
   */
  static async chooseScenesDialog(items) {
    if (!items?.length) return null;

    const checkboxes = items.map((item) => {
      const suffix = item.label ? ` : <i>${item.label}</i>` : "";
      return `<div>`
        + `<input id="scene_${item._id}" name="${item._id}" type="checkbox" value="">`
        + `<label for="scene_${item._id}">${item.name}${suffix}</label>`
        + `</div>`;
    }).join("");

    const content = `<form class="import-data-selection" autocomplete="off" onsubmit="event.preventDefault();">`
      + `<div>`
      + `<p class="notes">The following scenes are available for import.</p>`
      + `<p class="notes">Select required scenes or All button.</p>`
      + `<div class="form-description">${checkboxes}</div>`
      + `</div>`
      + `</form>`;

    const response = await foundry.applications.api.DialogV2.wait({
      rejectClose: false,
      window: { title: "Choose Scenes to Import" },
      content,
      classes: ["adventure-import-selection"],
      position: { width: 700 },
      buttons: [
        {
          action: "selection",
          label: "Selected",
          icon: "fas fa-list-check",
          callback: (_event, button, _dialog) => {
            const formData = new FormDataExtended(button.form);
            return Object.keys(formData.object);
          },
        },
        {
          action: "all",
          label: "All",
          icon: "fas fa-check-double",
          callback: () => null,
        },
      ],
    });

    return response ?? null;
  }

}
