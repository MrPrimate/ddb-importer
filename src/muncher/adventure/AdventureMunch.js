import AdventureMunchHelpers from "./AdventureMunchHelpers.js";
import { logger, utils, FileHelper, CompendiumHelper } from "../../lib/_module.mjs";
import { generateAdventureConfig } from "../adventure.js";
import { SETTINGS } from "../../config/_module.mjs";
import { createDDBCompendium } from "../../hooks/ready/checkCompendiums.js";
import { DDBReferenceLinker } from "../../parser/lib/_module.mjs";
import MonsterReplacer from "../../apps/MonsterReplacer.js";

export default class AdventureMunch {

  static COMPENDIUM_MAP = {
    "spells": "spells",
    "magicitems": "items",
    "weapons": "items",
    "armor": "items",
    "adventuring-gear": "items",
    "monsters": "monsters",
    "vehicles": "vehicles",
  };

  static DDB_MAP = {
    "spells": "spells",
    "magicitems": "magic-items",
    "weapons": "equipment",
    "armor": "equipment",
    "adventuring-gear": "equipment",
    "monsters": "monsters",
    "vehicles": "vehicles",
  };

  static CONFIG_MAP = {
    "armor": "armor",
    "weapons": "weapons",
  };

  /** @override */
  constructor({
    importFile, allScenes = null, allMonsters = null, journalWorldActors = null, addToCompendiums = null,
    addToAdventureCompendium = null, notifierElement = null, use2024monsters = null,
  } = {}) {
    this._itemsToRevisit = [];
    this.adventure = null;
    this.folders = null;
    this.raw = {
      scene: [],
      journal: [],
      actor: [],
      item: [],
      table: [],
      playlist: [],
      macro: [],
      folder: [],
    };
    this.temporary = {
      scenes: [],
      journals: [],
      actors: [],
      items: [],
      tables: [],
      playlists: [],
      macros: [],
      folders: [],
    };
    this.zipEntries = [];
    this.allMonsters = false;
    this.journalWorldActors = false;
    this.importFile = importFile;
    this.importFilename = importFile?.name;
    this.lookups = {
      folders: {},
      compendiumFolders: {},
      import: {},
      actors: {},
      sceneTokens: {},
      adventureConfig: {},
    };

    this.compendiums = {
      journal: null,
      table: null,
      monster: null,
    };
    this._compendiumItemsToRevisit = [];
    this.pattern = /(@[a-z]*)(\[)([a-z0-9]*|[a-z0-9.]*)(\])(\{)(.*?)(\})/gim;
    this.altpattern
      = /((data-entity)=\\?["']?([a-zA-Z]*)\\?["']?|(data-pack)=\\?["']?([[\S.]*)\\?["']?) data-id=\\?["']?([a-zA-Z0-9]*)\\?["']?.*?>(.*?)<\/a>/gim;

    this.allScenes = allScenes ?? game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-all-scenes");
    this.allMonsters = allMonsters ?? game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-all-actors-into-world");
    this.journalWorldActors = journalWorldActors ?? game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-journal-world-actors");
    this.addToCompendiums = addToCompendiums ?? game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-add-to-compendiums");
    this.addToAdventureCompendium = addToAdventureCompendium ?? game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-import-to-adventure-compendium");
    this.use2024monsters = use2024monsters ?? game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-use2024-monsters");

    this.monstersToReplace = [];

    this.notifierElement = notifierElement;
    // this.notifier =

    // if (!notifier) {
    //   this.notifier = (note, nameField = false, monsterNote = false) => {
    //     logger.info(note, { nameField, monsterNote });
    //   };
    // }
  }

  findCompendiumEntityByImportId(type, id) {
    return this.compendiums[type].index.find((item) => item._id === id);
  }

  replaceUUIDSForCompendium(text) {
    const journalRegex = /@UUID\[JournalEntry/g;
    text = text.replaceAll(journalRegex, `@UUID[Compendium.${this.compendiums.journal.metadata.id}.JournalEntry`);
    const tableRegex = /@UUID\[RollTable/g;
    text = text.replaceAll(tableRegex, `@UUID[Compendium.${this.compendiums.table.metadata.id}.RollTable`);
    return text;
  }

  /**
   * Returns an object with various file paths, including the key to the file in the upload folder,
   * the path to the file relative to the adventure upload path, the full path to the file, and the
   * filename with or without the .webp extension.
   * @param {string} path the path to the file
   * @param {boolean} misc whether the file is a miscellaneous import
   * @returns {object} an object with the following properties:
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
  getImportFilePaths(path, misc) {
    return AdventureMunchHelpers.getImportFilePaths({ adventureName: this.adventure.name, path, misc });
  }

  /**
   * Import a non-image file
   * @param {string} path
   * @param {Blob} content
   * @param {string} mimeType
   * @param {boolean} misc Miscellaneous import type/location?
   * @returns {Promise<string>} file path
   */
  async importRawFile(path, content, mimeType, misc) {
    try {
      if (path[0] === "*") {
        // this file was flagged as core data, just replace name.
        return path.replace(/\*/g, "");
      } else if (path.startsWith("icons/") || path.startsWith("systems/dnd5e/icons/") || path.startsWith("ddb://")) {
        // these are core icons, ignore
        // or are ddb:// paths that will be replaced by muncher
        return path;
      } else {
        const paths = this.getImportFilePaths(path, misc);

        if (paths.fullUploadPath && !CONFIG.DDBI.KNOWN.CHECKED_DIRS.has(paths.fullUploadPath)) {
          logger.debug(`Checking dir path ${paths.uploadPath}`, paths);
          await FileHelper.verifyPath(paths.parsedBaseUploadPath, `${paths.uploadPath}`);
          await FileHelper.generateCurrentFiles(paths.fullUploadPath);
          CONFIG.DDBI.KNOWN.CHECKED_DIRS.add(paths.fullUploadPath);
        }

        if (!CONFIG.DDBI.KNOWN.FILES.has(paths.pathKey)) {
          logger.debug(`Importing raw file from ${path}`, paths);
          const fileData = new File([content], paths.filename, { type: mimeType });
          const targetPath = (await FileHelper.uploadToPath(paths.fullUploadPath, fileData))?.path;
          CONFIG.DDBI.KNOWN.FILES.add(paths.pathKey);
          CONFIG.DDBI.KNOWN.LOOKUPS.set(`${paths.pathKey}`, targetPath);
        } else {
          logger.debug(`File already imported ${path}`);
        }

        return `${CONFIG.DDBI.KNOWN.LOOKUPS.get(paths.pathKey)}`;
      }
    } catch (err) {
      logger.error(`Error importing image file ${path} : ${err.message}`, { err });
    }

    return path;
  }

  /**
   * Imports binary file, by extracting from zip file and uploading to path.
   *
   * @param  {string} path Path to image within zip file
   * @param  {boolean} misc Miscellaneous import type/location?
   * @returns {Promise<string>} Path to file within VTT
   */
  async importImage(path, misc = false) {
    try {
      if (path[0] === "*") {
        // this file was flagged as core data, just replace name.
        return path.replace(/\*/g, "");
      } else if (path.startsWith("icons/") || path.startsWith("systems/dnd5e/icons/") || path.startsWith("ddb://")) {
        // these are core icons, ignore
        // or are ddb:// paths that will be replaced by muncher
        return path;
      } else {
        const paths = this.getImportFilePaths(path, misc);

        if (paths.fullUploadPath && !CONFIG.DDBI.KNOWN.CHECKED_DIRS.has(paths.fullUploadPath)) {
          logger.debug(`Checking dir path ${paths.uploadPath}`, paths);
          await FileHelper.verifyPath(paths.parsedBaseUploadPath, `${paths.uploadPath}`);
          await FileHelper.generateCurrentFiles(paths.fullUploadPath);
          CONFIG.DDBI.KNOWN.CHECKED_DIRS.add(paths.fullUploadPath);
        }

        if (!CONFIG.DDBI.KNOWN.FILES.has(paths.pathKey)) {
          logger.debug(`Importing image from ${path}`, paths);
          const img = await this.getZipFile(path);
          const targetPath = await FileHelper.uploadImage(img, paths.fullUploadPath, paths.filename, paths.forcingWebp);
          CONFIG.DDBI.KNOWN.FILES.add(paths.pathKey);
          CONFIG.DDBI.KNOWN.LOOKUPS.set(paths.pathKey, targetPath);
        } else {
          logger.debug(`File already imported ${path}`);
        }
        const returnKey = `${paths.fullUploadPath}/${paths.filename}`;

        return `${CONFIG.DDBI.KNOWN.LOOKUPS.get(returnKey)}`;
      }
    } catch (err) {
      logger.error(`Error importing image file ${path} : ${err.message}`, { err });
    }

    return path;
  }


  async importFolder(folders, folderList) {
    // console.warn("Creating Folders", {
    //   folders,
    //   folderList,
    // });
    await utils.asyncForEach(folders, async (f) => {
      const folderData = f;

      const existingFolder = game.folders.find((folder) =>
        folder._id === folderData._id && folder.type === folderData.type,
      );

      if (existingFolder) {
        if (!this.temporary.folders.some((f) => f._id === existingFolder._id)) {
          this.temporary.folders.push(existingFolder);
        }
        logger.debug(`Found existing folder ${existingFolder._id} with data:`, folderData, existingFolder);
        // eslint-disable-next-line require-atomic-updates
        // this.lookups.folders[folderData.flags.importid] = existingFolder._id;
      } else {
        if (folderData.parent) folderData.folder = folderData.parent;
        // eslint-disable-next-line require-atomic-updates
        const newFolder = await Folder.create(folderData, { keepId: true });
        this.temporary.folders.push(newFolder);
        logger.debug(`Created new folder ${newFolder._id} with data:`, folderData, newFolder);
      }

      let childFolders = folderList.filter((folder) => {
        return folder.parent === folderData._id;
      });

      if (childFolders.length > 0) {
        logger.debug(`Creating subfolders for ${folderData._id} (${folderData.type})`, childFolders);
        await this.importFolder(childFolders, folderList);
      }
    });
  }

  async importCompendiumFolder(folders, folderList) {
    await utils.asyncForEach(folders, async (f) => {
      let folderData = f;
      const supportedFolders = ["JournalEntry", "RollTable"];
      if (supportedFolders.includes(folderData.type)) {
        const pack = CompendiumHelper.getCompendiumType(folderData.type);
        let newFolder = pack.folders.find((folder) =>
          (folder._id === folderData._id || folder.flags.importid === folderData._id)
          && folder.type === folderData.type,
        );

        if (!newFolder) {
          if (folderData.parent === null) {
            folderData.parent = this.lookups.folders[folderData.type];
          } else {
            folderData.parent = this.lookups.folders[folderData.parent];
          }

          // eslint-disable-next-line require-atomic-updates
          newFolder = await Folder.create(folderData, { keepId: true, pack: pack.metadata.id });
          logger.debug(`Created new compendium folder ${newFolder._id} with data:`, folderData, newFolder);
        }

        // eslint-disable-next-line require-atomic-updates
        this.lookups.folders[folderData.flags.importid] = newFolder._id;

        let childFolders = folderList.filter((folder) => {
          return folder.parent === folderData._id;
        });

        if (childFolders.length > 0) {
          await this.importCompendiumFolder(childFolders, folderList);
        }

      }
    });
  }

  /**
   * Create missing folder structures in the world
   */
  async _createFolders() {
    this.lookups.folders = {};
    this.lookups.compendiumFolders = {};

    // the folder list could be out of order, we need to create all folders with parent null first
    const firstLevelFolders = this.folders.filter((folder) => folder.parent === null);
    await this.importFolder(firstLevelFolders, this.folders);
    if (this.addToCompendiums) {
      await this.importCompendiumFolder(firstLevelFolders, this.folders);
    }
  }


  /**
   * Checks for any missing data from DDB in the compendiums, spells, items, monsters that have been referenced by the
   * adventure and imports them using DDB Importer.
   */
  async _checkForMissingData() {
    if (this.adventure.required?.spells && this.adventure.required.spells.length > 0) {
      logger.debug(`${this.adventure.name} - spells required`, this.adventure.required.spells);
      AdventureMunch._progressNote(`Checking for missing spells from DDB`);
      await AdventureMunchHelpers.checkForMissingDocuments("spell", this.adventure.required.spells);
    }
    if (this.adventure.required?.items && this.adventure.required.items.length > 0) {
      logger.debug(`${this.adventure.name} - items required`, this.adventure.required.items);
      AdventureMunch._progressNote(`Checking for missing items from DDB`);
      await AdventureMunchHelpers.checkForMissingDocuments("item", this.adventure.required.items);
    }
    if (this.adventure.required?.monsters && this.adventure.required.monsters.length > 0) {
      logger.debug(`${this.adventure.name} - monsters required`, this.adventure.required.monsters);
      AdventureMunch._progressNote(`Checking for missing monsters from DDB`);
      await AdventureMunchHelpers.checkForMissingDocuments("monster", this.adventure.required.monsters);
    }
    if (parseFloat(this.adventure.version) < 4.1 && this.allMonsters) {
      ui.notifications.warn(`Unable to add all monsters from this adventure, please re-munch adventure with Adventure Muncher v1.0.9 or higher`);
    } else if (parseFloat(this.adventure.version) >= 4.1 && this.allMonsters && this.adventure.required?.monsterData
      && this.adventure.required?.monsterData?.length > 0
    ) {
      logger.debug(`${this.adventure.name} - Importing Remaining Actors`);
      AdventureMunch._progressNote(`Checking for missing world actors (${this.adventure.required.monsterData.length}) from compendium...`);
      await this.importRemainingActors(this.adventure.required.monsterData);
    }
    logger.debug("Missing data check complete");
  }

  /**
   * Work through the different types in the adventure and import them
   * @returns {Promise<>}
   */
  async _importFiles() {
    if (this.folderExistsInZip("scene")) {
      logger.debug(`${this.adventure.name} - Loading scenes`);
      await this._checkForDataUpdates("scene");
    }
    if (this.folderExistsInZip("actor")) {
      logger.debug(`${this.adventure.name} - Loading actors`);
      await this._importFile("actor");
    }
    if (this.folderExistsInZip("item")) {
      logger.debug(`${this.adventure.name} - Loading item`);
      await this._importFile("item");
    }
    if (this.folderExistsInZip("journal")) {
      logger.debug(`${this.adventure.name} - Loading journal`);
      await this._importFile("journal");
    }
    if (this.folderExistsInZip("table")) {
      logger.debug(`${this.adventure.name} - Loading table`);
      await this._importFile("table");
    }
    if (this.folderExistsInZip("playlist")) {
      logger.debug(`${this.adventure.name} - Loading playlist`);
      await this._importFile("playlist");
    }
    if (this.folderExistsInZip("macro")) {
      logger.debug(`${this.adventure.name} - Loading macro`);
      await this._importFile("macro");
    }
  }

  _renderCompleteDialog() {
    new Dialog(
      {
        title: `Successful Import of ${this.adventure.name}`,
        content: { adventure: this.adventure },
        buttons: { two: { label: "OK" } },
      },
      {
        classes: ["dialog", "adventure-import-export"],
        template: "modules/ddb-importer/handlebars/adventure/import-complete.hbs",
      },
    ).render(true);
  }

  /**
   * Search temporary items and return a match
   *
   * @param  {string} uuid Item id or uuid
   * @returns {object} Document
   */
  fetchTemporaryItem(uuid) {
    const id = uuid.split(".").pop();
    for (const [key, itemArray] of Object.entries(this.temporary)) {
      logger.debug(`Checking temporary ${key} for ${uuid}`, itemArray);
      const match = itemArray.find((i) => i._id === id);
      if (match) {
        logger.debug(`Found ${key} match for ${uuid}`, match);
        return match;
      }
    }
    return undefined;
  }

  // eslint-disable-next-line complexity
  async _getTokenUpdateData(worldActor, sceneToken) {
    const items = [];
    const ddbItems = sceneToken.flags.ddbItems ?? [];
    for (const item of ddbItems) {
      if (item.customItem) {
        items.push(item.data);
      } else {
        const ddbId = foundry.utils.getProperty(item, "ddbId");
        if (Number.isInteger(ddbId)) {
          // fetch ddbItem
          const compendium = CompendiumHelper.getCompendiumType(item.type);
          const itemRef = compendium.index.find((i) => i.name === item.name && i.type === item.type);
          if (itemRef) {
            const compendiumItem = await compendium.getDocument(itemRef._id);
            const jsonItem = compendiumItem.toObject();
            delete jsonItem._id;
            items.push(jsonItem);
          } else {
            logger.error(`Unable to find compendium item ${item.name}`, { item, sceneToken });
          }
        } else {
          // fetch actor item here
          const actorItem = worldActor.items.find((i) => i.name === item.name && i.type === item.type);
          if (actorItem) {
            const jsonItem = actorItem.toObject();
            delete jsonItem._id;
            items.push(jsonItem);
          } else {
            logger.error(`Unable to find monster feature/item ${item.name}`, { item, sceneToken, worldActor });
          }
        }
      }
    }

    const tokenStub = { };

    if (foundry.utils.hasProperty(sceneToken, "actorData")) {
      const data = foundry.utils.deepClone(sceneToken.actorData);
      if (data.data) {
        foundry.utils.setProperty(tokenStub, "delta.system", foundry.utils.deepClone(data.data));
        if (data.name) foundry.utils.setProperty(tokenStub, "delta.name", foundry.utils.deepClone(data.name));
      } else {
        foundry.utils.setProperty(tokenStub, "delta", foundry.utils.deepClone(sceneToken.actorData));
      }
      delete sceneToken.actorData;
    }

    if (sceneToken.delta?.effects) {
      for (const effect of sceneToken.delta.effects) {
        if (effect.label) {
          effect.name = effect.label;
          delete effect.label;
        }
        if (effect.icon) {
          effect.img = effect.icon;
          delete effect.icon;
        }
        if (foundry.utils.hasProperty(effect, "flags.core.statusId")) {
          const condition = CONFIG.statusEffects.find((c) => c.id === effect.flags.core.statusId)
            ?? CONFIG.statusEffects.find((c) => c.id.startsWith(effect.flags.core.statusId));
          if (!condition) continue;
          effect.id = dnd5e.utils.staticID(`dnd5e${condition.id}`);
          if (!effect.statuses) effect.statuses = [];
          effect.statuses.push(condition.id);
          delete effect.flags.core.statusId;
        }
      }
    }

    if (items.length > 0) {
      foundry.utils.setProperty(tokenStub, "delta.items", items);
    }

    if (sceneToken.flags.ddbActorFlags?.keepToken
      && sceneToken.flags.ddbActorFlags.tokenImage
      && sceneToken.flags.ddbActorFlags.tokenImage !== ""
    ) {
      const tokenImage = await this.importImage(sceneToken.flags.ddbActorFlags.tokenImage);
      foundry.utils.setProperty(tokenStub, "texture.src", tokenImage);
    }
    if (sceneToken.flags.ddbActorFlags?.keepAvatar
      && sceneToken.flags.ddbActorFlags.avatarImage
      && sceneToken.flags.ddbActorFlags.avatarImage !== ""
    ) {
      const avatarImage = await this.importImage(sceneToken.flags.ddbActorFlags.avatarImage);
      foundry.utils.setProperty(tokenStub, "delta.img", avatarImage);
    }

    const updateData = foundry.utils.mergeObject(tokenStub, sceneToken);
    if (updateData.name !== worldActor.name && !foundry.utils.hasProperty(updateData, "delta.name")) {
      foundry.utils.setProperty(updateData, "delta.name", updateData.name);
    }

    let result;
    try {
      logger.debug(`Creating token data for ${sceneToken.name} for id ${sceneToken.actorId}`, { updateData, worldActorUUID: worldActor.uuid });
      const tokenData = await worldActor.getTokenDocument(updateData);

      logger.debug(`${sceneToken.name} token data for id ${sceneToken.actorId}`, { tokenData, updateData, worldActorUUID: worldActor.uuid });
      result = tokenData.toObject();
    } catch (err) {
      logger.error(`Error creating token data for ${sceneToken.name} for id ${sceneToken.actorId}`, err);
      logger.error("Token data", { updateData, sceneToken, worldActor, result });
      throw err;
    }
    return result;
  }

  async _getSceneTokens(scene, tokens) {
    const tokenResults = [];
    const deadTokens = [];

    for (const token of tokens) {
      if (token.actorId && !token.actorLink) {
        const sceneToken = scene.flags.ddb.tokens.find((t) => t._id === foundry.utils.getProperty(token, "flags.ddbActorFlags.tokenLinkId"));
        delete sceneToken.scale;
        const worldActor = game.actors.get(token.actorId);
        if (worldActor) {
          const updateData = await this._getTokenUpdateData(worldActor, sceneToken);
          tokenResults.push(updateData);
        } else {
          deadTokens.push(token._id);
        }
      } else {
        deadTokens.push(token);
      }
    }

    if (deadTokens.length > 0) {
      logger.warn(`Removing ${scene.name} tokens with no world actors`, deadTokens);
    }

    return tokenResults;
  }

  // eslint-disable-next-line class-methods-use-this
  async _revisitScene(document) {
    let updatedData = {};
    const scene = foundry.utils.duplicate(document);
    // this is a scene we need to update links to all items
    logger.info(`Updating ${scene.name}, ${scene.tokens.length} tokens`);

    if (!document.thumb) {
      const thumbData = await document.createThumbnail();
      updatedData["thumb"] = thumbData.thumb;
    }
    await document.update(updatedData);

  }

  /**
   * Some items need linking up or tweaking post import.
   * @returns {Promise<>}
   */
  async _revisitItems() {
    try {
      if (this._itemsToRevisit.length > 0) {
        let totalCount = this._itemsToRevisit.length;
        let currentCount = 0;

        await utils.asyncForEach(this._itemsToRevisit, async (itemUuid) => {
          const toTimer = setTimeout(() => {
            logger.warn(`Reference update timed out.`);
            this._renderCompleteDialog();
            this.close();
          }, 180000);
          try {
            const loadedDocs = [await fromUuid(itemUuid)];
            if (this.addToAdventureCompendium) {
              loadedDocs.push(this.fetchTemporaryItem(itemUuid));
            }
            for (const document of loadedDocs) {
              switch (document.documentName) {
                case "Scene": {
                  await this._revisitScene(document);
                  break;
                }
                // no default
              }
            }
          } catch (err) {
            logger.warn(`Error updating references for object ${itemUuid}`, err);
          }
          currentCount += 1;
          AdventureMunch._updateProgress(totalCount, currentCount, "References");
          clearTimeout(toTimer);
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-undef
      logger.warn(`Error during reference update for object ${item}`, err);
    }
    logger.info("Revisit data complete");
  }

  async _importAdventureToWorld() {
    await this._importFiles();
    await this._revisitItems();
  }

  async _importAdventureToCompendium() {
    try {
      const adventureData = await this._createAdventure();
      logger.debug("adventureData to add to compendium", adventureData);
      await this._importAdventureCompendium(adventureData);
    } catch (err) {
      logger.error("Error importing to compendium", err);
      throw err;
    }
  }

  async _unpackZip() {
    const zipReader = new globalThis.window.zip.ZipReader(new globalThis.window.zip.BlobReader(this.importFile));
    this.zipEntries = await zipReader.getEntries();
    for (const key of Object.keys(this.raw)) {
      this.raw[key] = this.zipEntries.filter((entry) => {
        return !entry.directory
          && entry.filename.split('.').pop() === 'json'
          && entry.filename.includes(`${key}/`);
      });
    }
  }

  async getZipFile(fileName) {
    const file = this.zipEntries.find((entry) => {
      return entry.filename === fileName;
    });
    if (!file) return null;
    const mimeType = globalThis.window.zip.getMimeType(file.filename);
    const data = await file.getData(new globalThis.window.zip.BlobWriter(mimeType));
    return data;
  }

  async _getTextFileFromZip(filename) {
    const raw = await this.getZipFile(filename);
    if (raw) {
      return raw.text();
    } else {
      logger.error(`Unable to find file ${filename} in adventure zip`, { this: this });
      throw new Error(`Unable to find file ${filename} in adventure zip`);
    }
  }

  folderExistsInZip(folder) {
    return this.zipEntries.some((entry) => {
      return entry.directory && entry.filename.toLowerCase().includes(folder);
    });
  }

  async _chooseScenes() {
    const dataFiles = this.raw["scene"];

    logger.info(`Selecting Scenes for ${this.adventure.name} - (${dataFiles.length} possible scenes for import)`);

    let fileData = [];

    await utils.asyncForEach(dataFiles, async (file) => {
      const raw = await this._getTextFileFromZip(file.filename);
      const json = JSON.parse(raw);
      const existingScene = await game.scenes.find((item) => item.id === json._id);
      const scene = AdventureMunchHelpers.extractDocumentVersionData(json, existingScene);
      fileData.push(scene);
    });

    return new Promise((resolve) => {
      new Dialog(
        {
          title: "Choose Scenes to Import",
          content: {
            fileData: fileData,
            cssClass: "import-data-selection",
          },
          buttons: {
            selection: {
              label: "Selected",
              callback: async () => {
                const formData = $(".import-data-selection").serializeArray();
                const scenes = [];
                for (let i = 0; i < formData.length; i++) {
                  const key = formData[i].name;
                  scenes.push(this.raw.scene.find((s) => s.name.includes(key)));
                }
                logger.debug("scenes to import", scenes);
                this.raw.scene = scenes;
                resolve(this);
              },
            },
            all: {
              label: "All",
              callback: async () => {
                resolve(this);
              },
            },
          },
          default: "all",
          close: async () => {
            resolve(this);
          },
        },
        {
          width: 700,
          classes: ["dialog", "adventure-import-selection"],
          template: "modules/ddb-importer/handlebars/adventure/choose-scenes.hbs",
        },
      ).render(true);
    });

  }

  async _updateMonsterData() {
    if (!this.use2024monsters) return;

    const ids = this.adventure.required?.monsters ?? [];
    const monsterDataIds = this.adventure.required.monsterData.map((m) => m.ddbId) ?? [];

    ids.push(...monsterDataIds);

    const monsterData = await MonsterReplacer.fetchUpdatedMonsterInfo(ids);
    logger.debug("Updated Monster Data", monsterData);

    if (monsterData.length === 0) return;

    const monsterReplacer = new MonsterReplacer({
      name: this.adventure.name,
    });

    const monstersToReplace = await monsterReplacer.chooseMonstersToReplace(monsterData);
    logger.debug("Monsters to Replace", monstersToReplace);

    if (monstersToReplace.length === 0) return;

    this.monstersToReplace = monsterData.filter((m) => monstersToReplace.includes(m.id2014));

    this.adventure.required.monsterData = this.adventure.required.monsterData.map((md) => {
      if (!monstersToReplace.includes(md.ddbId)) return md;
      const updatedMonster = monsterData.find((data) => data.id2014 === md.ddbId);
      md.ddbId = updatedMonster.id2024;
      md.name = updatedMonster.name2024;
      return md;
    });

    this.adventure.required.monsters = this.adventure.required.monsters.map((id) => {
      if (!monstersToReplace.includes(id)) return id;
      const updatedMonster = monsterData.find((data) => data.id2014 === id);
      return updatedMonster.id2024;
    });

  }

  async importAdventure() {
    try {

      if (this.addToCompendiums) {
        const compData = SETTINGS.COMPENDIUMS.find((c) => c.title === "Journals");
        await createDDBCompendium(compData);
        for (const key of Object.keys(this.compendiums)) {
          this.compendiums[key] = CompendiumHelper.getCompendiumType(key);
          await this.compendiums[key].getIndex({ fields: ["name", "flags.ddbimporter.id", "system.source.rules"] });
        }
      }

      await this._unpackZip();

      this.adventure = JSON.parse(await this._getTextFileFromZip("adventure.json"));
      logger.debug("Loaded adventure data", { adventure: this.adventure });
      try {
        this.folders = JSON.parse(await this._getTextFileFromZip("folders.json"));
        logger.debug("Adventure folders", { folders: this.folders });
      } catch (err) {
        logger.warn(`Folder structure file not found.`);
      }

      if (this.adventure.system !== game.data.system.id) {
        ui.notifications.error(
          `Invalid system for Adventure ${this.adventure.name}.  Expects ${this.adventure.system}`,
          { permanent: true },
        );
        throw new Error(`Invalid system for Adventure ${this.adventure.name}.  Expects ${this.adventure.system}`);
      }

      if (parseFloat(this.adventure.version) < 4.0) {
        ui.notifications.error(
          `This Adventure (${this.adventure.name}) was generated for v9.  Please regenerate your config file for Adventure Muncher.`,
          { permanent: true },
        );
        throw new Error(
          `This Adventure (${this.adventure.name}) was generated for v9.  Please regenerate your config file for Adventure Muncher.`,
        );
      }

      await this._createFolders();
      if (!this.allScenes) await this._chooseScenes();

      // checks to see if we want to fiddle some data
      await this._updateMonsterData();

      await this._checkForMissingData();
      this.lookups.adventureConfig = await generateAdventureConfig({ full: true });

      await this._importAdventureToWorld();

      if (this.addToAdventureCompendium) {
        const compData = SETTINGS.COMPENDIUMS.find((c) => c.title === "Adventures");
        await createDDBCompendium(compData);
        await this._importAdventureToCompendium();
      }
      this._renderCompleteDialog();
    } catch (err) {
      ui.notifications.error(`There was an error importing ${this.importFilename}`);
      logger.error(`Error importing file ${this.importFilename}`, err);
      logger.error(err);
      logger.error(err.stack);
    } finally {
      // eslint-disable-next-line require-atomic-updates
      this.lookups = {};
    }
  }

  /**
   * Import actors from compendium into world
   * @param {Array<Objects>} neededActors array of needed actors
   * @returns {Promise<Array>} array of world actors
   */
  async ensureWorldActors(neededActors) {
    logger.debug("Trying to import actors from compendium", neededActors);
    const monsterCompendium = CompendiumHelper.getCompendiumType("monster", false);
    const results = [];
    await utils.asyncForEach(neededActors, async (actor) => {
      let worldActor = game.actors.get(actor.actorId);
      if (!worldActor) {
        logger.info(`Importing actor ${actor.name} with DDB ID ${actor.ddbId} from ${monsterCompendium.metadata.name} with compendium id ${actor.compendiumId}`);
        try {
          const options = { keepId: true, keepEmbeddedIds: true };
          worldActor = await game.actors.importFromCompendium(monsterCompendium, actor.compendiumId, { _id: actor.actorId, folder: actor.folderId }, options);
        } catch (err) {
          logger.error(err);
          logger.warn(`Unable to import actor ${actor.name} with id ${actor.compendiumId} from DDB Compendium`);
          logger.debug(`Failed on: game.actors.importFromCompendium(monsterCompendium, "${actor.compendiumId}", { _id: "${actor.actorId}", folder: "${actor.folderId}" }, { keepId: true });`);
        }
      }
      if (worldActor) results.push(worldActor);
      if (this.addToAdventureCompendium && !this.temporary.actors.some((a) => a._id === actor.actorId)) {
        this.temporary.actors.push(worldActor);
      }
    });
    logger.debug("Actors transferred from compendium to world.", results);
    return results;
  }

  static async linkDDBActors(tokens) {
    const linkedExistingTokens = await AdventureMunchHelpers.linkExistingActorTokens(tokens);
    const newTokens = linkedExistingTokens
      .filter((token) => token.flags.ddbActorFlags?.id && token.flags.compendiumActorId);

    return Promise.all(newTokens);
  }

  /**
   * Import actors, matching up import ids and actor ids for scene token linking
   * @param {object} data array of actor data objects
   * @returns {Promise<Array>} array of world actors
   */
  async importRemainingActors(data) {
    const results = [];
    const monsterCompendium = CompendiumHelper.getCompendiumType("monster", false);
    const monsterIndex = await AdventureMunchHelpers.getCompendiumIndex("monster");

    logger.debug("Checking for the following actors in world", data);
    await utils.asyncForEach(data, async (actorData) => {
      logger.debug(`Checking for ${actorData.ddbId}`, actorData);
      let worldActor = game.actors.get(actorData.actorId);

      if (worldActor) {
        logger.debug(`Actor found for ${actorData.actorId}, with name ${worldActor.name}`);
      } else {
        const monsterHit = monsterIndex.find((monster) =>
          monster.flags?.ddbimporter?.id && monster.flags.ddbimporter.id == actorData.ddbId,
        );
        if (monsterHit) {
          logger.info(`Importing actor ${monsterHit.name} with DDB ID ${actorData.ddbId} from ${monsterCompendium.metadata.name} with compendium id ${monsterHit._id}`);
          try {
            const actorOverride = { _id: actorData.actorId, folder: actorData.folderId };
            const options = { keepId: true, keepEmbeddedIds: true };
            // eslint-disable-next-line require-atomic-updates
            worldActor = await game.actors.importFromCompendium(monsterCompendium, monsterHit._id, actorOverride, options);
          } catch (err) {
            logger.error(err);
            logger.warn(`Unable to import actor ${monsterHit.name} with id ${monsterHit._id} from DDB Compendium`);
            logger.debug(`Failed on: game.actors.importFromCompendium(monsterCompendium, "${monsterHit._id}", { _id: "${actorData.actorId}", folder: "${actorData.folderId}" }, { keepId: true });`);
          }
        } else {
          logger.error("Actor not found in compendium", actorData);
        }
      }
      if (worldActor) results.push(worldActor);
      if (worldActor && this.addToAdventureCompendium && !this.temporary.actors.some((a) => worldActor.flags.ddbimporter.id == a.flags.ddbimporter.id)) {
        this.temporary.actors.push(worldActor);
      }
    });
    return results;
  }

  /**
   * Generates actors for tokens on a scene
   * @param {object} scene the scene to generate actors for
   * @returns {Promise<Array>} array of world actors
   */
  async generateTokenActors(scene) {
    logger.debug(`Token Actor generation for ${scene.name} starting`);
    const tokens = await AdventureMunch.linkDDBActors(scene.tokens);
    const neededActors = tokens
      .map((token) => {
        return {
          name: token.name,
          ddbId: token.flags.ddbActorFlags.id,
          actorId: token.actorId,
          compendiumId: token.flags.compendiumActorId,
          folderId: token.flags.actorFolderId,
        };
      })
      .filter((obj, pos, arr) => {
        // we only need to create 1 actor per actorId
        return arr.map((mapObj) => mapObj["actorId"]).indexOf(obj["actorId"]) === pos;
      });

    const results = await this.ensureWorldActors(neededActors);
    logger.debug(`Token Actor generation for ${scene.name} complete`, results);
    return results;
  }

  async _loadDocumentAssets(data, importType) {

    data.flags.importid = data._id;

    if (data.background?.src) {
      // eslint-disable-next-line require-atomic-updates
      data.background.src = await this.importImage(data.background.src);
    } else if (data.img) {
      // eslint-disable-next-line require-atomic-updates
      data.img = await this.importImage(data.img);
    }
    if (data.thumb) {
      // eslint-disable-next-line require-atomic-updates
      data.thumb = await this.importImage(data.thumb);
    }
    if (data?.token?.img) {
      // eslint-disable-next-line require-atomic-updates
      data = await this._importTokenImage("token", data, { img: true, texture: false });
    }
    if (data.token?.texture?.src) {
      // eslint-disable-next-line require-atomic-updates
      data = await this._importTokenImage("token", data);
    }
    if (data?.prototypeToken?.img) {
      // eslint-disable-next-line require-atomic-updates
      data = await this._importTokenImage("prototypeToken", data, { img: true, texture: false });
    }
    if (data.prototypeToken?.texture?.src) {
      // eslint-disable-next-line require-atomic-updates
      data = await this._importTokenImage("prototypeToken", data);
    }

    if (data?.items?.length) {
      await utils.asyncForEach(data.items, async (item) => {
        if (item.img) {
          // eslint-disable-next-line require-atomic-updates
          item.img = await this.importImage(item.img);
        }
      });
    }

    if (data?.pages?.length) {
      await utils.asyncForEach(data.pages, async (page) => {
        if (page.src) {
          // eslint-disable-next-line require-atomic-updates
          page.src = await this.importImage(page.src);
        }
      });
    }

    if (importType === "Scene") {
      if (data.tokens) {
        this._updateSceneTokensWithNewMonsters(data);
        await this.generateTokenActors(data);
      }
      if (data.flags["perfect-vision"] && Array.isArray(data.flags["perfect-vision"])) {
        data.flags["perfect-vision"] = {};
      }
    } else if (importType === "Playlist") {
      await utils.asyncForEach(data.sounds, async (sound) => {
        if (sound.path) {
          // eslint-disable-next-line require-atomic-updates
          sound.path = await this.importImage(sound.path);
        }
      });
    } else if (importType === "RollTable") {
      await utils.asyncForEach(data.results, async (result) => {
        if (result.img) {
          // eslint-disable-next-line require-atomic-updates
          result.img = await this.importImage(result.img);
        }
        if (result.resultId) {
          data.flags.ddb.needRevisit = true;
        }
        logger.debug(`Updating DDB links for ${data.name}`);
        // eslint-disable-next-line require-atomic-updates
        data.text = this.foundryCompendiumReplace(data.text);
      });
    } else if (importType === "JournalEntry" && data.pages) {
      await utils.asyncForEach(data.pages, async (page) => {
        if (page.text.content) {
          const journalImages = AdventureMunchHelpers.reMatchAll(
            /(src|href)="(?!http(?:s*):\/\/)([\w0-9\-._~%!$&'()*+,;=:@/]*)"/,
            page.text.content,
          );
          if (journalImages) {
            logger.debug(`Updating Image links for ${page.name}`);
            await utils.asyncForEach(journalImages, async (result) => {
              const path = await this.importImage(result[2]);
              page.text.content = page.text.content.replace(result[0], `${result[1]}="${path}"`);
            });
          }
          logger.debug(`Updating DDB links for ${page.name}`);
          page.text.content = this.foundryCompendiumReplace(page.text.content);
        }
      });
    }

    return data;

  }


  async _createAdventure() {
    logger.debug("Packing up adventure");
    if (this.allMonsters) await this.importRemainingActors(this.adventure.required.monsterData, true);
    const itemData = await AdventureMunchHelpers.getDocuments("items", (this.adventure.required.items ?? []), {}, true);
    const spellData = await AdventureMunchHelpers.getDocuments("spells", (this.adventure.required.spells ?? []), {}, true);

    const ddbSource = CONFIG.DDB.sources.find((source) => source.description === this.adventure.name);
    const image = ddbSource?.avatarURL
      ? ddbSource.avatarURL
      : await this.importImage("assets/images/cover.jpg");

    await this._revisitItems();

    const data = {
      img: image,
      name: this.adventure.name,
      description: this.adventure.description,
      folders: this.temporary.folders.map((doc) => doc.toObject()),
      combats: [],
      items: itemData.concat(spellData).map((doc) => doc.toObject()),
      actors: this.temporary.actors.map((doc) => doc.toObject()),
      journal: this.temporary.journals.map((doc) => doc.toObject()),
      scenes: this.temporary.scenes.map((doc) => doc.toObject()),
      tables: this.temporary.tables.map((doc) => doc.toObject()),
      macros: [],
      cards: [],
      playlists: [],
      flags: {
        ddbimporter: {
          isDDBAdventure: true,
          adventure: {
            required: this.adventure.required,
            revisitUuids: this._itemsToRevisit,
          },
        },
        core: { sheetClass: "ddb-importer.DDBAdventureImporter" },
      },
    };

    return data;
  }

  async _getCompendiumAdventure(adventureData) {
    const existingAdventure = this._pack.index.find((i) => i.name === adventureData.name);
    if (existingAdventure) {
      return existingAdventure;
    }
    await Adventure.createDocuments([{
      name: adventureData.name,
      description: adventureData.description,
      img: adventureData.img,
    }], {
      pack: this._pack.metadata.id,
      keepId: true,
      keepEmbeddedIds: true,
    });
    const newAdventure = this._pack.index.find((i) => i.name === adventureData.name);
    return newAdventure;
  }


  async _importAdventureCompendium(adventureData) {
    try {
      this._pack = CompendiumHelper.getCompendiumType("adventure");
      const existingAdventure = await this._getCompendiumAdventure(adventureData);

      // console.warn("Adventure!", {
      //   pack: this._pack,
      //   adventureData: foundry.utils.deepClone(adventureData),
      //   temp: this.temporary,
      //   this: this,
      //   thisAdventure: this.adventure,
      //   existingAdventure,
      // });

      let adventure;
      if (existingAdventure) {
        const loadedAdventure = await this._pack.getDocument(existingAdventure._id);
        // eslint-disable-next-line require-atomic-updates
        adventureData._id = loadedAdventure._id;
        adventure = await loadedAdventure.update(adventureData, { diff: false, recursive: false });
        ui.notifications.info(game.i18n.format("ADVENTURE.UpdateSuccess", { name: adventureData.name }));
      }

      return adventure;
    } catch (err) {
      logger.error("error building adventure", { err, this: this });
      throw err;
    }
  }

  // import a scene file
  async _importRenderedSceneFile(data, overwriteEntity) {
    if (!AdventureMunchHelpers.findEntityByImportId("scenes", data._id) || overwriteEntity || this.addToAdventureCompendium) {
      await utils.asyncForEach(data.tokens, async (token) => {
        foundry.utils.setProperty(token, "flags.ddbActorFlags.tokenLinkId", token._id);
        // eslint-disable-next-line require-atomic-updates
        if (token.img) token.img = await this.importImage(token.img);
        if (token.prototypeToken?.texture?.src) {
          // eslint-disable-next-line require-atomic-updates
          token.prototypeToken.texture.src = await this.importImage(token.prototypeToken.texture.src);
        }
      });

      await utils.asyncForEach(data.sounds, async (sound) => {
        // eslint-disable-next-line require-atomic-updates
        sound.path = await this.importImage(sound.path);
      });

      await utils.asyncForEach(data.notes, async (note) => {
        // eslint-disable-next-line require-atomic-updates
        if (note.icon) note.icon = await this.importImage(note.icon, true);
        // eslint-disable-next-line require-atomic-updates
        if (note.texture?.src) note.texture.src = await this.importImage(note.texture.src, true);
      });

      await utils.asyncForEach(data.tiles, async (tile) => {
        // eslint-disable-next-line require-atomic-updates
        if (tile.img) tile.img = await this.importImage(tile.img);
        // eslint-disable-next-line require-atomic-updates
        if (tile.texture?.src) tile.texture.src = await this.importImage(tile.texture.src);
      });

      for (const wall of data.walls) {
        if (wall.door !== 0 && !wall.doorSound && wall.doorSound !== "") {
          wall.doorSound = "woodBasic";
        }
      }

      if (overwriteEntity) await Scene.deleteDocuments([data._id]);
      const options = { keepId: true, keepEmbeddedIds: true };
      logger.debug(`Creating Scene ${data.name}`, foundry.utils.deepClone(data));
      const tokens = foundry.utils.deepClone(data.tokens);
      data.tokens = [];
      const scene = await Scene.create(data, options);
      logger.debug(`Created Scene ${data.name}`, scene);
      const tokenUpdates = await this._getSceneTokens(scene, tokens);
      logger.debug(`Token Updates for ${data.name}`, tokenUpdates);
      const sceneTokens = await scene.createEmbeddedDocuments("Token", tokenUpdates, { keepId: false });
      logger.debug(`Token update response for ${data.name}`, sceneTokens);
      this._itemsToRevisit.push(`Scene.${scene.id}`);
      if (this.addToAdventureCompendium) {
        this.temporary.scenes.push(scene);
      }
    }
  }

  // eslint-disable-next-line complexity
  async _importRenderedFile(typeName, data, needRevisit, overwriteIds) {
    const overwriteEntity = overwriteIds.includes(data._id);
    const options = { keepId: true, keepEmbeddedIds: true };
    switch (typeName) {
      case "Scene": {
        // stairways changed how data is stored for v13 and final version of v12
        // make sure any old style data in exports will be imported in the correct format
        if (Array.isArray(data.flags.stairways)
          && foundry.utils.isNewerVersion((game.modules.get("stairways")?.version ?? "0.10.7"), "0.10.6")
        ) {
          data.flags.stairways = {
            data: foundry.utils.duplicate(data.flags.stairways ?? []),
          };
        }
        await this._importRenderedSceneFile(data, overwriteEntity);
        break;
      }
      case "Actor":
        if (!AdventureMunchHelpers.findEntityByImportId("actors", data._id)) {
          let actor = await Actor.create(data, options);
          await actor.update({ [`prototypeToken.actorId`]: actor.id });
          if (needRevisit) this._itemsToRevisit.push(`Actor.${actor.id}`);
          if (this.addToAdventureCompendium) this.temporary.actors.push(actor);
        }
        break;
      case "Item":
        if (!AdventureMunchHelpers.findEntityByImportId("items", data._id)) {
          let item = await Item.create(data, options);
          if (needRevisit) this._itemsToRevisit.push(`Item.${item.id}`);
          if (this.addToAdventureCompendium) this.temporary.items.push(item);
        }
        break;
      case "JournalEntry":
        foundry.utils.setProperty(data, "flags.core.sheetClass", "ddb-importer.DDBJournalSheet");
        if (!AdventureMunchHelpers.findEntityByImportId("journal", data._id)) {
          let journal = await JournalEntry.create(data, options);
          if (needRevisit) this._itemsToRevisit.push(`JournalEntry.${journal.id}`);
          if (this.addToAdventureCompendium) this.temporary.journals.push(journal);
        }
        if (this.addToCompendiums && !this.findCompendiumEntityByImportId("journal", data._id)) {
          const cOptions = foundry.utils.mergeObject(options, { pack: this.compendiums.journal.metadata.id });
          data.pages.forEach((page) => {
            if (page.type == "text") {
              page.text.content = this.replaceUUIDSForCompendium(page.text.content);
            }
          });
          let cJournal = await JournalEntry.create(data, cOptions);
          this._compendiumItemsToRevisit.push(cJournal);
        }
        break;
      case "RollTable":
        if (!AdventureMunchHelpers.findEntityByImportId("tables", data._id)) {
          let rolltable = await RollTable.create(data, options);
          if (needRevisit) this._itemsToRevisit.push(`RollTable.${rolltable.id}`);
          if (this.addToAdventureCompendium) this.temporary.tables.push(rolltable);
        }
        if (this.addToCompendiums && !this.findCompendiumEntityByImportId("table", data._id)) {
          const cOptions = foundry.utils.mergeObject(options, { pack: this.compendiums.table.metadata.id });
          let cTable = await RollTable.create(data, cOptions);
          this._compendiumItemsToRevisit.push(cTable);
        }
        break;
      case "Playlist":
        if (!AdventureMunchHelpers.findEntityByImportId("playlists", data._id)) {
          data.name = `${this.adventure.name}.${data.name}`;
          let playlist = await Playlist.create(data, options);
          if (this.addToAdventureCompendium) this.temporary.playlists.push(playlist);
        }
        break;
      case "Macro":
        if (!AdventureMunchHelpers.findEntityByImportId("macros", data._id)) {
          let macro = await Macro.create(data, options);
          if (needRevisit) this._itemsToRevisit.push(`Macro.${macro.id}`);
          if (this.addToAdventureCompendium) this.temporary.macros.push(macro);
        }
        break;
      // no default
    }
  }

  async _checkForDataUpdates(type) {
    const importType = AdventureMunchHelpers.getImportType(type);
    const dataFiles = this.raw[type];

    logger.info(`Checking ${this.adventure.name} - ${importType} (${dataFiles.length} for updates)`);

    let fileData = [];
    let hasVersions = false;

    await utils.asyncForEach(dataFiles, async (file) => {
      const raw = await this._getTextFileFromZip(file.filename);
      const json = JSON.parse(raw);
      if (!hasVersions && json?.flags?.ddb?.versions) {
        hasVersions = true;
      }
      switch (importType) {
        case "Scene": {
          const existingScene = await game.scenes.find((item) => item.id === json._id);
          const scene = AdventureMunchHelpers.extractDocumentVersionData(json, existingScene);
          const sceneVersions = scene.flags?.ddb?.versions?.importer;
          if (existingScene) {
            if (
              sceneVersions
              && (sceneVersions.metaVersionChanged
                || sceneVersions.muncherVersionChanged
                || sceneVersions.foundryVersionNewer)
            ) {
              fileData.push(scene);
            }
          } else if (sceneVersions && sceneVersions.foundryVersionNewer) {
            fileData.push(scene);
          }
          break;
        }
        // no default
      }
    });

    logger.debug("Scene update choices", fileData);

    return new Promise((resolve) => {
      if (hasVersions && fileData.length > 0) {
        new Dialog(
          {
            title: `${importType} updates`,
            content: {
              dataType: type,
              dataTypeDisplay: importType,
              fileData,
              cssClass: "import-data-updates",
            },
            buttons: {
              confirm: {
                label: "Confirm",
                callback: async () => {
                  const formData = $(".import-data-updates").serializeArray();
                  let ids = [];
                  let dataType = "";
                  for (let i = 0; i < formData.length; i++) {
                    const key = formData[i].name;
                    if (key.startsWith("new_")) {
                      ids.push(key.substr(4));
                    } else if (key === "type") {
                      dataType = formData[i].value;
                    }
                  }
                  resolve(this._importFile(dataType, { overwriteIds: ids }));
                },
              },
            },
            default: "confirm",
            close: async () => {
              resolve(this._importFile(type));
            },
          },
          {
            width: 700,
            classes: ["dialog", "adventure-import-updates"],
            template: "modules/ddb-importer/handlebars/adventure/import-updates.hbs",
          },
        ).render(true);
      } else {
        resolve(this._importFile(type));
      }
    });
  }

  async _importTokenImage(tokenType, data, { img = false, texture = true } = {}) {
    if (data[tokenType]?.randomImg) {
      const imgFilepaths = data[tokenType].img.split("/");
      const imgFilename = imgFilepaths.reverse()[0];
      const imgFilepath = data[tokenType].img.replace(imgFilename, "");

      const filesToUpload = this.zipEntries.filter((file) => {
        return !file.directory && file.filename.includes(imgFilepath);
      });

      let adventurePath = this.adventure.name.replace(/[^a-z0-9]/gi, "_");

      if (img) {
        const imgPath = `${this._importPathData.current}/${adventurePath}/${data[tokenType].img}`;
        data[tokenType].img = imgPath;
      }
      if (texture) {
        const imgPath = `${this._importPathData.current}/${adventurePath}/${data[tokenType].texture.src}`;
        data[tokenType].texture.src = imgPath;
      }

      if (filesToUpload.length > 0) {
        let currentCount = 1;

        await utils.asyncForEach(filesToUpload, async (file) => {
          await this.importImage(file.name);
          currentCount += 1;
          AdventureMunch._updateProgress(filesToUpload.length, currentCount, "Token Image");
        });
      }
    } else {

      if (img) {
        // eslint-disable-next-line require-atomic-updates
        data[tokenType].img = await this.importImage(data[tokenType].img);
      }
      if (texture) {
        // eslint-disable-next-line require-atomic-updates
        data[tokenType].texture.src = await this.importImage(data[tokenType].texture.src);
      }
    }

    return data;
  }

  _updateSceneTokensWithNewMonsters(scene) {
    logger.debug(`Updating Scene Tokens (${scene.tokens.length}) with new monsters`, { scene, monstersToReplace: this.monstersToReplace });
    scene.tokens = scene.tokens.map((token) => {
      const ddbId = token.flags?.ddbActorFlags?.id;
      const name = token.flags?.ddbActorFlags?.name;
      const match = this.monstersToReplace.find((m) => m.id2014 === ddbId);

      logger.debug("Checking Token", { ddbId, name, match });
      if (!match) return token;
      token.flags.ddbActorFlags.id = match.id2024;
      if (name !== match.name2014) {
        token.name = match.name2024;
      }
      return token;
    });
    logger.info(`Updated Scene Tokens for ${scene.name}`, scene.tokens);
  }

  async _importFile(type, { overwriteIds = [] } = {}) {
    let totalCount = 0;
    let currentCount = 0;

    logger.info(`IDs to overwrite of type ${type}: ${JSON.stringify(overwriteIds)}`);

    const importType = AdventureMunchHelpers.getImportType(type);
    const dataFiles = this.raw[type];

    logger.info(`Importing ${this.adventure.name} - ${importType} (${dataFiles.length} items)`);

    totalCount = dataFiles.length;

    // eslint-disable-next-line complexity
    await utils.asyncForEach(dataFiles, async (file) => {
      const rawData = await this._getTextFileFromZip(file.filename);
      let data = JSON.parse(rawData);
      let needRevisit = false;

      if (rawData.match(this.pattern) || rawData.match(this.altpattern)) needRevisit = true;

      // eslint-disable-next-line require-atomic-updates
      data = await this._loadDocumentAssets(data, importType);

      if (data.flags.ddb.needRevisit) needRevisit = true;

      foundry.utils.setProperty(data.flags, "ddbimporter.version", CONFIG.DDBI.version);

      await this._importRenderedFile(importType, data, needRevisit, overwriteIds);

      currentCount += 1;
      AdventureMunch._updateProgress(totalCount, currentCount, importType);
    });
  }

  /**
   * Replaced ddb links with compendium or world links
   * @param {Document} doc HTML document to act on
   * @returns {Document} HTML document with modified links
   */
  replaceLookupLinks(doc) {
    const lookups = this.lookups.adventureConfig.lookups;
    const actorData = this.adventure.required?.monsterData ?? [];

    for (const lookupKey in AdventureMunch.COMPENDIUM_MAP) {
      const compendiumLinks = doc.querySelectorAll(`a[href*="ddb://${lookupKey}/"]`);
      const lookupRegExp = new RegExp(`ddb://${lookupKey}/([0-9]*)"`);
      compendiumLinks.forEach((node) => {
        const lookupMatch = node.outerHTML.match(lookupRegExp);
        const lookupDictionary = lookups[AdventureMunch.COMPENDIUM_MAP[lookupKey]];
        if (lookupDictionary) {
          const worldActorLink = this.journalWorldActors && ["monsters"].includes(lookupKey);
          let ddbId = lookupMatch[1];
          const dictionaryName = AdventureMunch.CONFIG_MAP[lookupKey]
            ? CONFIG.DDB[lookupKey]?.find((e) => e.id == ddbId)?.name
            : null;
          const replacedMonster = this.monstersToReplace.find((m) => m.id2014 === parseInt(ddbId));
          if (replacedMonster) ddbId = replacedMonster.id2024;
          const lookupEntry = worldActorLink
            ? actorData.find((a) => a.ddbId === parseInt(ddbId))
            : dictionaryName
              ? lookupDictionary.find((e) => e.name == dictionaryName)
              : (lookupDictionary.find((e) => e.id == ddbId && e.name === (node.textContent?.trim() ?? ""))
               ?? lookupDictionary.find((e) => e.id == ddbId));

          if (lookupEntry) {
            const pageLink = lookupEntry.pageId ? `.JournalEntryPage.${lookupEntry.pageId}` : "";
            const linkStub = lookupEntry.headerLink ? `#${lookupEntry.headerLink}` : "";
            const linkType = worldActorLink ? "UUID" : "Compendium";
            const linkBody = worldActorLink
              ? `Actor.${lookupEntry.actorId}`
              : `${lookupEntry.compendium}.${lookupEntry._id}${pageLink}${linkStub}`;
            doc.body.innerHTML = doc.body.innerHTML.replace(node.outerHTML, `@${linkType}[${linkBody}]{${node.textContent}}`);
          } else {
            logger.warn(`NO Lookup Compendium Entry for ${node.outerHTML}, using key "${lookupKey}"`, {
              lookups,
              actorData,
              lookupRegExp,
              lookupKey,
            });
          }
        }
      });
    }

    return doc;
  }

  /**
   * Replaced ddb links with compendium or world links, or links back to DDB
   * @param {string} text HTML text to act on
   * @returns {Document} HTML document with modified links
   */
  foundryCompendiumReplace(text) {
    // replace the ddb:// entries with known compendium look ups if we have them
    // ddb://spells
    // ddb://magicitems || weapons || adventuring-gear || armor
    // ddb://monsters

    let doc = this.replaceLookupLinks(utils.htmlToDoc(text));

    // vehicles - if not imported, link to DDB
    const compendiumLinks = doc.querySelectorAll("a[href*=\"ddb://vehicles/\"]");
    const lookupRegExp = /ddb:\/\/vehicles\/([0-9]*)/g;
    compendiumLinks.forEach((node) => {
      const target = node.outerHTML;
      const lookupMatch = node.outerHTML.match(lookupRegExp);
      const lookupValue = this.lookups.adventureConfig.lookups["vehicles"];
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
    for (const lookupKey in AdventureMunch.COMPENDIUM_MAP) {
      const compendiumLinks = doc.querySelectorAll(`a[href*="ddb://${lookupKey}/"]`);
      // logger.debug(`final replace for missing ${lookupKey} references`, compendiumLinks);

      compendiumLinks.forEach((node) => {
        const target = node.outerHTML;
        const ddbStub = AdventureMunch.DDB_MAP[lookupKey];
        const ddbNameGuess = node.textContent.toLowerCase().replace(" ", "-").replace(/[^0-9a-z-]/gi, '');
        logger.warn(`No Compendium Entry for ${node.outerHTML} attempting to guess a link to DDB`);

        node.setAttribute("href", `https://www.dndbeyond.com/${ddbStub}/${ddbNameGuess}`);
        doc.body.innerHTML = doc.body.innerHTML.replace(target, node.outerHTML);
      });
    }

    doc.body.innerHTML = DDBReferenceLinker.parseTags(doc.body.innerHTML);

    return doc.body.innerHTML;
  }

  static _updateProgress(total, count, type) {
    const localizedType = `ddb-importer.label.${type}`;
    $(".import-progress-bar")
      .width(`${Math.trunc((count / total) * 100)}%`)
      .html(
        `<span>${game.i18n.localize("ddb-importer.label.Working")} (${game.i18n.localize(localizedType)})...</span>`,
      );
  }

  static _progressNote(note) {
    $(".import-progress-bar").html(`<span>${game.i18n.localize("ddb-importer.label.Working")} (${note})...</span>`);
  }
}
