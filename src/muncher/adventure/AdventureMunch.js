import AdventureMunchHelpers from "./AdventureMunchHelpers.js";
import logger from "../../logger.js";
import FileHelper from "../../lib/FileHelper.js";
import { generateAdventureConfig } from "../adventure.js";
import { DirectoryPicker } from "../../lib/DirectoryPicker.js";
import SETTINGS from "../../settings.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";
import utils from "../../lib/utils.js";
import { createDDBCompendium } from "../../hooks/ready/checkCompendiums.js";
import { parseTags } from "../../lib/DDBReferenceLinker.js";

export default class AdventureMunch extends FormApplication {

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


  /** @override */
  constructor(object = {}, options = {}) {
    super(object, options);
    this._itemsToRevisit = [];
    const importPathData = game.settings.get(SETTINGS.MODULE_ID, "adventure-import-path");
    this._importPathData = DirectoryPicker.parse(importPathData);
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
    this.remove = {
      folderIds: new Set(),
    };
    this.zip = null;
    this.allMonsters = false;
    this.journalWorldActors = false;
    this.importFilename = null;
    this.importToAdventureCompendium = false;
    this.lookups = {
      folders: {},
      compendiumFolders: {},
      import: {},
      actors: {},
      sceneTokens: {},
      adventureConfig: {},
    };

    this.addToCompendiums = false;
    this.compendiums = {
      journal: null,
      table: null,
    };
    this._compendiumItemsToRevisit = [];
  }

  /** @override */
  static get defaultOptions() {
    this.pattern = /(@[a-z]*)(\[)([a-z0-9]*|[a-z0-9.]*)(\])(\{)(.*?)(\})/gim;
    this.altpattern
      = /((data-entity)=\\?["']?([a-zA-Z]*)\\?["']?|(data-pack)=\\?["']?([[\S.]*)\\?["']?) data-id=\\?["']?([a-zA-Z0-9]*)\\?["']?.*?>(.*?)<\/a>/gim;

    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ddb-adventure-import",
      classes: ["ddb-adventure-import"],
      title: "Adventure Munch",
      template: "modules/ddb-importer/handlebars/adventure/import.hbs",
      width: 350,
    });
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
   * @param  {String} path
   * @param  {Boolean} misc Miscellaneous import type/location?
   * @returns {Object} An object detailing various file path
   */
  getImportFilePaths(path, misc) {
    const useWebP = game.settings.get(SETTINGS.MODULE_ID, "use-webp") && !path.endsWith("svg") && !path.endsWith("pdf");
    const adventurePath = this.adventure.name.replace(/[^a-z0-9]/gi, "_");
    const targetPath = path.replace(/[\\/][^\\/]+$/, "");
    const baseFilename = path.replace(/^.*[\\/]/, "").replace(/\?(.*)/, "");
    const filename
      = useWebP && !baseFilename.endsWith(".webp")
        ? `${FileHelper.removeFileExtension(baseFilename)}.webp`
        : baseFilename;
    const baseUploadPath = misc
      ? game.settings.get(SETTINGS.MODULE_ID, "adventure-misc-path")
      : game.settings.get(SETTINGS.MODULE_ID, "adventure-upload-path");
    const parsedBaseUploadPath = DirectoryPicker.parse(baseUploadPath);
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
   * Import a non-image file
   * @param {String} path
   * @param {Blob} content
   * @param {String} mimeType
   * @param {Boolean} misc Miscellaneous import type/location?
   * @returns {Promise<String>} file path
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
          await DirectoryPicker.verifyPath(paths.parsedBaseUploadPath, `${paths.uploadPath}`);
          await FileHelper.generateCurrentFiles(paths.fullUploadPath);
          CONFIG.DDBI.KNOWN.CHECKED_DIRS.add(paths.fullUploadPath);
        }

        if (!CONFIG.DDBI.KNOWN.FILES.has(paths.pathKey)) {
          logger.debug(`Importing raw file from ${path}`, paths);
          const fileData = new File([content], paths.filename, { type: mimeType });
          const targetPath = (await DirectoryPicker.uploadToPath(paths.fullUploadPath, fileData))?.path;
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
   * @param  {String} path - Path to image within zip file
   * @returns {Promise<String>} - Path to file within VTT
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
          await DirectoryPicker.verifyPath(paths.parsedBaseUploadPath, `${paths.uploadPath}`);
          await FileHelper.generateCurrentFiles(paths.fullUploadPath);
          CONFIG.DDBI.KNOWN.CHECKED_DIRS.add(paths.fullUploadPath);
        }

        if (!CONFIG.DDBI.KNOWN.FILES.has(paths.pathKey)) {
          logger.debug(`Importing image from ${path}`, paths);
          const img = await this.zip.file(path).async("blob");
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

  /** @override */
  // eslint-disable-next-line class-methods-use-this
  async getData() {
    let data;
    let files = [];

    try {
      const verifiedDirectory = await DirectoryPicker.verifyPath(this._importPathData);
      if (verifiedDirectory) {
        const options = {
          bucket: this._importPathData.bucket,
          extensions: [".fvttadv", ".FVTTADV", ".zip"],
          wildcard: false,
        };
        data = await DirectoryPicker.browseFiles(this._importPathData.activeSource, this._importPathData.current, options);
        files = data.files.map((file) => {
          const filename = decodeURIComponent(file).replace(/^.*[\\/]/, "");

          return { path: decodeURIComponent(file), name: filename };
        });
      }
    } catch (err) {
      logger.error(err);
      logger.warn(
        `Unable to verify import path, this may be due to permissions on the server. You may be able to ignore this message.`
      );
    }

    return {
      data,
      allScenes: game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-all-scenes"),
      allMonsters: game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-all-actors-into-world"),
      journalWorldActors: game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-journal-world-actors"),
      addToCompendiums: game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-add-to-compendiums"),
      files,
      cssClass: "ddb-importer-window",
    };
  }

  async importFolder(folders, folderList) {
    await utils.asyncForEach(folders, async (f) => {
      let folderData = f;

      let newFolder = game.folders.find((folder) =>
        (folder._id === folderData._id || folder.flags.importid === folderData._id)
        && folder.type === folderData.type
      );

      if (newFolder) {
        if (!this.temporary.folders.some((f) => f._id === newFolder._id)) {
          this.temporary.folders.push(newFolder);
        }
        logger.debug(`Found existing folder ${newFolder._id} with data:`, folderData, newFolder);
      } else {
        if (folderData.parent === null) {
          folderData.parent = this.lookups.folders[folderData.type];
        } else {
          folderData.parent = this.lookups.folders[folderData.parent];
        }

        // eslint-disable-next-line require-atomic-updates
        newFolder = await Folder.create(folderData, { keepId: true });
        this.temporary.folders.push(newFolder);
        if (this.importToAdventureCompendium) this.remove.folderIds.add(newFolder._id);
        logger.debug(`Created new folder ${newFolder._id} with data:`, folderData, newFolder);
      }

      // eslint-disable-next-line require-atomic-updates
      this.lookups.folders[folderData.flags.importid] = newFolder._id;

      let childFolders = folderList.filter((folder) => {
        return folder.parent === folderData._id;
      });

      if (childFolders.length > 0) {
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
          && folder.type === folderData.type
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

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".world-button").on("click", this._importAdventure.bind(this));
    html.find(".compendium-button").on("click", this._importAdventure.bind(this));
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
      AdventureMunch._progressNote(`Checking for missing world actors (${this.adventure.required.monsterData}) from compendium...`);
      await this.importRemainingActors(this.adventure.required.monsterData);
    }
    logger.debug("Missing data check complete");
  }

  /**
   * Work through the different types in the adventure and import them
   * @returns {Promise<>}
   */
  async _importFiles() {
    if (AdventureMunchHelpers.folderExists("scene", this.zip)) {
      logger.debug(`${this.adventure.name} - Loading scenes`);
      await this._checkForDataUpdates("scene");
    }
    if (AdventureMunchHelpers.folderExists("actor", this.zip)) {
      logger.debug(`${this.adventure.name} - Loading actors`);
      await this._importFile("actor");
    }
    if (AdventureMunchHelpers.folderExists("item", this.zip)) {
      logger.debug(`${this.adventure.name} - Loading item`);
      await this._importFile("item");
    }
    if (AdventureMunchHelpers.folderExists("journal", this.zip)) {
      logger.debug(`${this.adventure.name} - Loading journal`);
      await this._importFile("journal");
    }
    if (AdventureMunchHelpers.folderExists("table", this.zip)) {
      logger.debug(`${this.adventure.name} - Loading table`);
      await this._importFile("table");
    }
    if (AdventureMunchHelpers.folderExists("playlist", this.zip)) {
      logger.debug(`${this.adventure.name} - Loading playlist`);
      await this._importFile("playlist");
    }
    if (AdventureMunchHelpers.folderExists("macro", this.zip)) {
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
      }
    ).render(true);
  }

  /**
   * Search temporary items and return a match
   *
   * @param  {String} uuid - Item id or uuid
   * @returns {Object} - Document
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

  /**
   * Get the world actor, or actor that represents the world actor for adventure compendium build
   *
   * @param  {String} actorId - Actor Id
   * @returns {Object} - Actor
   */
  _getWorldActor(actorId) {
    return this.importToAdventureCompendium
      ? this.temporary.actors.find((a) => a._id === actorId)
      : game.actors.get(actorId);
  }

  static async _getTokenUpdateData(worldActor, sceneToken) {
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
            // eslint-disable-next-line no-await-in-loop
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

    if (items.length > 0) {
      foundry.utils.setProperty(tokenStub, "delta.items", items);
    }
    if (sceneToken.flags.ddbImages?.keepToken)
      foundry.utils.setProperty(tokenStub, "texture.src", sceneToken.flags.ddbImages.tokenImage);
    if (sceneToken.flags.ddbImages?.keepAvatar)
      foundry.utils.setProperty(tokenStub, "delta.img", sceneToken.flags.ddbImages.avatarImage);

    const updateData = foundry.utils.mergeObject(tokenStub, sceneToken);
    if (updateData.name !== worldActor.name && !foundry.utils.hasProperty(updateData, "delta.name")) {
      foundry.utils.setProperty(updateData, "delta.name", updateData.name);
    }

    const tokenData = await worldActor.getTokenDocument(updateData);

    logger.debug(`${sceneToken.name} token data for id ${sceneToken.actorId}`, tokenData);
    return tokenData.toObject();
  }

  async _getSceneTokensV11(scene, tokens) {
    const tokenResults = [];
    const deadTokens = [];

    for (const token of tokens) {
      if (token.actorId && !token.actorLink) {
        const sceneToken = scene.flags.ddb.tokens.find((t) => t._id === foundry.utils.getProperty(token, "flags.ddbActorFlags.tokenLinkId"));
        delete sceneToken.scale;
        const worldActor = this._getWorldActor(token.actorId);
        if (worldActor) {
          // eslint-disable-next-line no-await-in-loop
          const updateData = await AdventureMunch._getTokenUpdateData(worldActor, sceneToken);
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

  async _revisitScene(document) {
    let updatedData = {};
    const scene = foundry.utils.duplicate(document);
    // this is a scene we need to update links to all items
    logger.info(`Updating ${scene.name}, ${scene.tokens.length} tokens`);

    if (!this.importToAdventureCompendium) {
      // In 0.8.x the thumbs don't seem to be generated.
      // This code would embed the thumbnail.
      // Consider writing this out.
      if (!document.thumb) {
        const thumbData = await document.createThumbnail();
        updatedData["thumb"] = thumbData.thumb;
      }
      await document.update(updatedData);
    }
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
            const document = this.importToAdventureCompendium
              ? this.fetchTemporaryItem(itemUuid)
              : await fromUuid(itemUuid);
            // let rawData;
            switch (document.documentName) {
              case "Scene": {
                await this._revisitScene(document);
                break;
              }
              // no default
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

  async _loadZip() {
    const form = document.querySelector(`form[class="ddb-importer-window"]`);
    if (form.data.files.length) {
      this.importFilename = form.data.files[0].name;
      this.zip = await FileHelper.readBlobFromFile(form.data.files[0]).then(JSZip.loadAsync);
    } else {
      const selectedFile = document.querySelector(`[name="import-file"]`).value;
      this.importFilename = selectedFile;
      this.zip = await fetch(`/${selectedFile}`)
        .then((response) => {
          if (response.status === 200 || response.status === 0) {
            return Promise.resolve(response.blob());
          } else {
            return Promise.reject(new Error(response.statusText));
          }
        })
        .then(JSZip.loadAsync);
    }
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
    } finally {
      const folderIds = [...this.remove.folderIds];
      if (folderIds.length > 0) {
        logger.debug("Removing folders", folderIds);
        const results = await Folder.deleteDocuments(folderIds);
        logger.debug("Delete results", results);
      }
    }

  }

  _unpackZip() {
    for (const key of Object.keys(this.raw)) {
      this.raw[key] = AdventureMunchHelpers.getFiles(key, this.zip);
    }
  }

  async _chooseScenes() {
    const dataFiles = this.raw["scene"];

    logger.info(`Selecting Scenes for ${this.adventure.name} - (${dataFiles.length} possible scenes for import)`);

    let fileData = [];

    await utils.asyncForEach(dataFiles, async (file) => {
      const raw = await this.zip.file(file.name).async("text");
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
        }
      ).render(true);
    });

  }

  async _importAdventure(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const a = event.currentTarget;
    const action = a.dataset.button;

    if (action === "world" || action === "compendium") {
      try {
        $(".import-progress").toggleClass("import-hidden");
        $(".ddb-overlay").toggleClass("import-invalid");

        this.allScenes = document.querySelector(`[name="all-scenes"]`).checked;
        game.settings.set(SETTINGS.MODULE_ID, "adventure-policy-all-scenes", this.allScenes);
        this.allMonsters = document.querySelector(`[name="all-monsters"]`).checked;
        game.settings.set(SETTINGS.MODULE_ID, "adventure-policy-all-actors-into-world", this.allMonsters);
        this.journalWorldActors = document.querySelector(`[name="journal-world-actors"]`).checked;
        game.settings.set(SETTINGS.MODULE_ID, "adventure-policy-journal-world-actors", this.journalWorldActors);
        this.addToCompendiums = document.querySelector(`[name="add-to-compendiums"]`).checked;
        game.settings.set(SETTINGS.MODULE_ID, "adventure-policy-add-to-compendiums", this.addToCompendiums);

        if (this.addToCompendiums) {
          const compData = SETTINGS.COMPENDIUMS.find((c) => c.title === "Journals");
          await createDDBCompendium(compData);
          for (const key of Object.keys(this.compendiums)) {
            this.compendiums[key] = CompendiumHelper.getCompendiumType(key);
            // eslint-disable-next-line no-await-in-loop
            await this.compendiums[key].getIndex();
          }
        }

        await this._loadZip();
        this._unpackZip();

        this.adventure = JSON.parse(await this.zip.file("adventure.json").async("text"));
        logger.debug("Loaded adventure data", { adventure: this.adventure });
        try {
          this.folders = JSON.parse(await this.zip.file("folders.json").async("text"));
          logger.debug("Adventure folders", { folders: this.folders });
        } catch (err) {
          logger.warn(`Folder structure file not found.`);
        }

        if (this.adventure.system !== game.data.system.id) {
          ui.notifications.error(
            `Invalid system for Adventure ${this.adventure.name}.  Expects ${this.adventure.system}`,
            { permanent: true }
          );
          throw new Error(`Invalid system for Adventure ${this.adventure.name}.  Expects ${this.adventure.system}`);
        }

        if (parseFloat(this.adventure.version) < 4.0) {
          ui.notifications.error(
            `This Adventure (${this.adventure.name}) was generated for v9.  Please regenerate your config file for Adventure Muncher.`,
            { permanent: true }
          );
          throw new Error(
            `This Adventure (${this.adventure.name}) was generated for v9.  Please regenerate your config file for Adventure Muncher.`
          );
        }

        if (action === "compendium") this.importToAdventureCompendium = true;

        await this._createFolders();
        if (!this.allScenes) await this._chooseScenes();
        await this._checkForMissingData();
        this.lookups.adventureConfig = await generateAdventureConfig(true);

        if (action === "world") await this._importAdventureToWorld();
        else if (action === "compendium") {
          const compData = SETTINGS.COMPENDIUMS.find((c) => c.title === "Adventures");
          await createDDBCompendium(compData);
          await this._importAdventureToCompendium();
        }

        $(".ddb-overlay").toggleClass("import-invalid");

        this._renderCompleteDialog();

        this.close();
      } catch (err) {
        $(".ddb-overlay").toggleClass("import-invalid");
        ui.notifications.error(`There was an error importing ${this.importFilename}`);
        logger.error(`Error importing file ${this.importFilename}`, err);
        logger.error(err);
        logger.error(err.stack);
        this.close();
      } finally {
        // eslint-disable-next-line require-atomic-updates
        this.lookups = {};
      }
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
      let worldActor = this._getWorldActor(actor.actorId);
      if (!worldActor) {
        logger.info(`Importing actor ${actor.name} with DDB ID ${actor.ddbId} from ${monsterCompendium.metadata.name} with compendium id ${actor.compendiumId}`);
        try {
          const options = { keepId: true, keepEmbeddedIds: true, temporary: this.importToAdventureCompendium };
          worldActor = await game.actors.importFromCompendium(monsterCompendium, actor.compendiumId, { _id: actor.actorId, folder: actor.folderId }, options);
        } catch (err) {
          logger.error(err);
          logger.warn(`Unable to import actor ${actor.name} with id ${actor.compendiumId} from DDB Compendium`);
          logger.debug(`Failed on: game.actors.importFromCompendium(monsterCompendium, "${actor.compendiumId}", { _id: "${actor.actorId}", folder: "${actor.folderId}" }, { keepId: true });`);
        }
      }
      if (worldActor) results.push(worldActor);
      if (this.importToAdventureCompendium && !this.temporary.actors.some((a) => a._id === actor.actorId)) {
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
   * @param {boolean} temporary create the items in the world?
   * @returns {Promise<Array>} array of world actors
   */
  async importRemainingActors(data) {
    const results = [];
    const monsterCompendium = CompendiumHelper.getCompendiumType("monster", false);
    const monsterIndex = await AdventureMunchHelpers.getCompendiumIndex("monster");

    logger.debug("Checking for the following actors in world", data);
    await utils.asyncForEach(data, async (actorData) => {
      logger.debug(`Checking for ${actorData.ddbId}`, actorData);
      let worldActor = this._getWorldActor(actorData.actorId);

      if (worldActor) {
        logger.debug(`Actor found for ${actorData.actorId}, with name ${worldActor.name}`);
      } else {
        const monsterHit = monsterIndex.find((monster) =>
          monster.flags?.ddbimporter?.id && monster.flags.ddbimporter.id == actorData.ddbId
        );
        if (monsterHit) {
          logger.info(`Importing actor ${monsterHit.name} with DDB ID ${actorData.ddbId} from ${monsterCompendium.metadata.name} with compendium id ${monsterHit._id} (temporary? ${this.importToAdventureCompendium})`);
          try {
            const actorOverride = { _id: actorData.actorId, folder: actorData.folderId };
            const options = { keepId: true, keepEmbeddedIds: true, temporary: this.importToAdventureCompendium };
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
      if (worldActor && this.importToAdventureCompendium && !this.temporary.actors.some((a) => worldActor.flags.ddbimporter.id == a.flags.ddbimporter.id)) {
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
          folderId: token.flags.actorFolderId
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
    if (data.toke?.texture?.src) {
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
            page.text.content
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

    logger.debug("Writing out Journals");
    await this._importFile("journal");
    logger.debug("Cartographer is working on Scenes");
    await this._importFile("scene");
    logger.debug("Performing some table calculations");
    await this._importFile("table");
    // await this._importFile("Macro", [], true);
    // await this._importFile("Card", [], true);
    // await this._importFile("Playlist", [], true);
    // await this._importFile("Combat", [], true);
    // await this._importFile("Actor", [], true);
    // await this._importFile("Item", [], true);

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


  async _importAdventureCompendium(adventureData) {
    try {
      const pack = CompendiumHelper.getCompendiumType("adventure");
      const existingAdventure = pack.index.find((i) => i.name === adventureData.name);

      let adventure;
      if (existingAdventure) {
        logger.debug("Deleting existing adventure", existingAdventure._id);
        adventureData._id = existingAdventure._id;
        const loadedAdventure = await pack.getDocument(existingAdventure._id);
        adventure = await loadedAdventure.update(adventureData, { diff: false, recursive: false });
        ui.notifications.info(game.i18n.format("ADVENTURE.UpdateSuccess", { name: adventureData.name }));
      } else {
        adventure = await Adventure.createDocuments([adventureData], {
          pack: pack.metadata.id,
          keepId: true,
          keepEmbeddedIds: true
        });
        ui.notifications.info(game.i18n.format("ADVENTURE.CreateSuccess", { name: adventureData.name }));

      }

      // console.warn("Adventure!", {
      //   pack,
      //   item: adventureData,
      //   adventure,
      //   temp: this.temporary,
      //   thisAdventure: this.adventure,
      // });
      return adventure;
    } catch (err) {
      logger.error("error building adventure", { err, this: this });
      throw err;
    }
  }

  // import a scene file
  async _importRenderedSceneFile(data, overwriteEntity) {
    if (!AdventureMunchHelpers.findEntityByImportId("scenes", data._id) || overwriteEntity || this.importToAdventureCompendium) {
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
      const options = { keepId: true, keepEmbeddedIds: true, temporary: false };
      logger.debug(`Creating Scene ${data.name}`, foundry.utils.deepClone(data));
      const tokens = foundry.utils.deepClone(data.tokens);
      data.tokens = [];
      const scene = await Scene.create(data, options);
      logger.debug(`Created Scene ${data.name}`, scene);
      const tokenUpdates = await this._getSceneTokensV11(scene, tokens);
      logger.debug(`Token Updates for ${data.name}`, tokenUpdates);
      const sceneTokens = await scene.createEmbeddedDocuments("Token", tokenUpdates, { keepId: false });
      logger.debug(`Token update response for ${data.name}`, sceneTokens);
      this._itemsToRevisit.push(`Scene.${scene.id}`);
      if (this.importToAdventureCompendium) {
        this.temporary.scenes.push(scene);
        scene.delete();
      }
    }
  }

  // eslint-disable-next-line complexity
  async _importRenderedFile(typeName, data, needRevisit, overwriteIds) {
    const overwriteEntity = overwriteIds.includes(data._id);
    const options = { keepId: true, keepEmbeddedIds: true, temporary: this.importToAdventureCompendium };
    switch (typeName) {
      case "Scene": {
        await this._importRenderedSceneFile(data, overwriteEntity);
        break;
      }
      case "Actor":
        if (!AdventureMunchHelpers.findEntityByImportId("actors", data._id)) {
          let actor = await Actor.create(data, options);
          await actor.update({ [`prototypeToken.actorId`]: actor.id });
          if (needRevisit) this._itemsToRevisit.push(`Actor.${actor.id}`);
          if (this.importToAdventureCompendium) this.temporary.actors.push(actor);
        }
        break;
      case "Item":
        if (!AdventureMunchHelpers.findEntityByImportId("items", data._id)) {
          let item = await Item.create(data, options);
          if (needRevisit) this._itemsToRevisit.push(`Item.${item.id}`);
          if (this.importToAdventureCompendium) this.temporary.items.push(item);
        }
        break;
      case "JournalEntry":
        if (!AdventureMunchHelpers.findEntityByImportId("journal", data._id)) {
          let journal = await JournalEntry.create(data, options);
          if (needRevisit) this._itemsToRevisit.push(`JournalEntry.${journal.id}`);
          if (this.importToAdventureCompendium) this.temporary.journals.push(journal);
        }
        if (this.addToCompendiums && !this.findCompendiumEntityByImportId("journal", data._id)) {
          const cOptions = foundry.utils.mergeObject(options, { temporary: false, pack: this.compendiums.journal.metadata.id });
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
          if (this.importToAdventureCompendium) this.temporary.tables.push(rolltable);
        }
        if (this.addToCompendiums && !this.findCompendiumEntityByImportId("table", data._id)) {
          const cOptions = foundry.utils.mergeObject(options, { temporary: false, pack: this.compendiums.table.metadata.id });
          let cTable = await RollTable.create(data, cOptions);
          this._compendiumItemsToRevisit.push(cTable);
        }
        break;
      case "Playlist":
        if (!AdventureMunchHelpers.findEntityByImportId("playlists", data._id)) {
          data.name = `${this.adventure.name}.${data.name}`;
          let playlist = await Playlist.create(data, options);
          if (this.importToAdventureCompendium) this.temporary.playlists.push(playlist);
        }
        break;
      case "Macro":
        if (!AdventureMunchHelpers.findEntityByImportId("macros", data._id)) {
          let macro = await Macro.create(data, options);
          if (needRevisit) this._itemsToRevisit.push(`Macro.${macro.id}`);
          if (this.importToAdventureCompendium) this.temporary.macros.push(macro);
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
      const raw = await this.zip.file(file.name).async("text");
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
          }
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

      const filesToUpload = Object.values(this.zip.files).filter((file) => {
        return !file.dir && file.name.includes(imgFilepath);
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
      const rawData = await this.zip.file(file.name).async("text");
      let data = JSON.parse(rawData);
      let needRevisit = false;

      // let pattern = /(\@[a-z]*)(\[)([a-z0-9]*|[a-z0-9\.]*)(\])/gmi
      if (rawData.match(this.pattern) || rawData.match(this.altpattern)) needRevisit = true;

      // eslint-disable-next-line require-atomic-updates
      data = await this._loadDocumentAssets(data, importType);

      if (data.flags.ddb.needRevisit) needRevisit = true;

      foundry.utils.setProperty(data.flags, "ddbimporter.version", CONFIG.DDBI.version);

      if (importType !== "Playlist" && importType !== "Compendium") {
        if (this.lookups.folders[data.folder]) {
          logger.debug(
            `Adding data to subfolder importkey = ${data.folder}, folder = ${
              this.lookups.folders[data.folder]
            }`
          );
          data.folder = this.lookups.folders[data.folder];
        } else {
          logger.debug(
            `Adding data to subfolder importkey = ${data.folder}, folder = ${this.lookups.folders["null"]}`
          );
          if (this.adventure?.options?.folders) {
            data.folder = this.lookups.folders["null"];
          } else {
            data.folder = this.lookups.folders[importType];
          }
        }
      }

      await this._importRenderedFile(importType, data, needRevisit, overwriteIds);

      currentCount += 1;
      AdventureMunch._updateProgress(totalCount, currentCount, importType);
    });
  }

  /**
   * Replaced ddb links with compendium or world links
   * @param {Document} doc HTML document to act on
   * @param {Object} options provide journalWorldActors and actorData if linking to world actors
   * @returns {Document} HTML document with modified links
   */
  replaceLookupLinks(doc) {
    const lookups = this.lookups.adventureConfig.lookups;
    const actorData = this.adventure.required?.monsterData ?? [];

    for (const lookupKey in AdventureMunch.COMPENDIUM_MAP) {
      const compendiumLinks = doc.querySelectorAll(`a[href*="ddb://${lookupKey}/"]`);
      const lookupRegExp = new RegExp(`ddb://${lookupKey}/([0-9]*)`);
      compendiumLinks.forEach((node) => {
        const lookupMatch = node.outerHTML.match(lookupRegExp);
        const lookupValue = lookups[AdventureMunch.COMPENDIUM_MAP[lookupKey]];
        if (lookupValue) {
          const worldActorLink = this.journalWorldActors && ["monsters"].includes(lookupKey);
          const lookupEntry = worldActorLink
            ? actorData.find((a) => a.ddbId === parseInt(lookupMatch[1]))
            : lookupValue.find((e) => e.id == lookupMatch[1]);

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
   * @param {Document} doc HTML document to act on
   * @param {Object} options provide journalWorldActors and actorData if linking to world actors
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

    doc.body.innerHTML = parseTags(doc.body.innerHTML);

    return doc.body.innerHTML;
  }

  static _updateProgress(total, count, type) {
    const localizedType = `ddb-importer.label.${type}`;
    $(".import-progress-bar")
      .width(`${Math.trunc((count / total) * 100)}%`)
      .html(
        `<span>${game.i18n.localize("ddb-importer.label.Working")} (${game.i18n.localize(localizedType)})...</span>`
      );
  }

  static _progressNote(note) {
    $(".import-progress-bar").html(`<span>${game.i18n.localize("ddb-importer.label.Working")} (${note})...</span>`);
  }
}
