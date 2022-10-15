import Helpers from "./common.js";
import logger from "../../logger.js";
import FileHelper from "../../lib/FileHelper.js";
import { generateAdventureConfig } from "../adventure.js";
import { DirectoryPicker } from "../../lib/DirectoryPicker.js";

export default class AdventureMunch extends FormApplication {
  /** @override */
  constructor(object = {}, options = {}) {
    super(object, options);
    this._itemsToRevisit = [];
    const importPathData = game.settings.get("ddb-importer", "adventure-import-path");
    this._importPathData = DirectoryPicker.parse(importPathData);
    this.adventure = null;
    this.folders = null;
    this.zip = null;
  }

  /** @override */
  static get defaultOptions() {
    this.pattern = /(@[a-z]*)(\[)([a-z0-9]*|[a-z0-9.]*)(\])(\{)(.*?)(\})/gim;
    this.altpattern
      = /((data-entity)=\\?["']?([a-zA-Z]*)\\?["']?|(data-pack)=\\?["']?([[\S.]*)\\?["']?) data-id=\\?["']?([a-zA-Z0-9]*)\\?["']?.*?>(.*?)<\/a>/gim;

    return mergeObject(super.defaultOptions, {
      id: "ddb-adventure-import",
      classes: ["ddb-adventure-import"],
      title: "Adventure Munch",
      template: "modules/ddb-importer/handlebars/adventure/import.hbs",
      width: 350,
    });
  }

  /**
   * @param  {String} path
   * @param  {Boolean} misc Miscellaneous import type/location?
   * @returns {Object} An object detailing various file path
   */
  getImportFilePaths(path, misc) {
    const useWebP = game.settings.get("ddb-importer", "use-webp") && !path.endsWith("svg") && !path.endsWith("pdf");
    const adventurePath = this.adventure.name.replace(/[^a-z0-9]/gi, "_");
    const targetPath = path.replace(/[\\/][^\\/]+$/, "");
    const baseFilename = path.replace(/^.*[\\/]/, "").replace(/\?(.*)/, "");
    const filename
      = useWebP && !baseFilename.endsWith(".webp")
        ? `${FileHelper.removeFileExtension(baseFilename)}.webp`
        : baseFilename;
    const baseUploadPath = misc
      ? game.settings.get("ddb-importer", "adventure-misc-path")
      : game.settings.get("ddb-importer", "adventure-upload-path");
    const parsedBaseUploadPath = DirectoryPicker.parse(baseUploadPath);
    const uploadPath = misc
      ? `${parsedBaseUploadPath.current}/${targetPath}`
      : `${parsedBaseUploadPath.current}/${adventurePath}/${targetPath}`;
    const fullUploadPath = misc
      ? `${baseUploadPath}/${targetPath}`
      : `${baseUploadPath}/${adventurePath}/${targetPath}`;
    const returnFilePath = misc ? `${targetPath}/${filename}` : `${adventurePath}/${targetPath}/${filename}`;
    return {
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
        const returnPath = await FileHelper.getFileUrl(paths.baseUploadPath, paths.returnFilePath);

        if (paths.uploadPath && !CONFIG.DDBI.KNOWN.CHECKED_DIRS.has(paths.uploadPath)) {
          logger.debug(`Checking dir path ${paths.uploadPath}`, paths);
          await DirectoryPicker.verifyPath(paths.parsedBaseUploadPath, `${paths.uploadPath}`);
          FileHelper.generateCurrentFiles(paths.uploadPath);
          CONFIG.DDBI.KNOWN.CHECKED_DIRS.add(paths.uploadPath);
        }

        if (!CONFIG.DDBI.KNOWN.FILES.has(returnPath)) {
          logger.debug(`Importing raw file from ${path}`, paths);
          const fileData = new File([content], paths.filename, { type: mimeType });
          await Helpers.UploadFile(paths.parsedBaseUploadPath.activeSource, `${paths.uploadPath}`, fileData, {
            bucket: paths.parsedBaseUploadPath.bucket,
          });
          CONFIG.DDBI.KNOWN.FILES.add(returnPath);
        } else {
          logger.debug(`File already imported ${path}`);
        }

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
        const returnPath = await FileHelper.getFileUrl(paths.baseUploadPath, paths.returnFilePath);

        if (paths.uploadPath && !CONFIG.DDBI.KNOWN.CHECKED_DIRS.has(paths.uploadPath)) {
          logger.debug(`Checking dir path ${paths.uploadPath}`, paths);
          await DirectoryPicker.verifyPath(paths.parsedBaseUploadPath, `${paths.uploadPath}`);
          FileHelper.generateCurrentFiles(paths.uploadPath);
          CONFIG.DDBI.KNOWN.CHECKED_DIRS.add(paths.uploadPath);
        }

        if (!CONFIG.DDBI.KNOWN.FILES.has(returnPath)) {
          logger.debug(`Importing image from ${path}`, paths);
          const img = await this.zip.file(path).async("blob");
          await FileHelper.uploadImage(img, paths.fullUploadPath, paths.filename, paths.forcingWebp);
          CONFIG.DDBI.KNOWN.FILES.add(returnPath);
        } else {
          logger.debug(`File already imported ${path}`);
        }

        return `${returnPath}`;
      }
    } catch (err) {
      logger.error(`Error importing image file ${path} : ${err.message}`);
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
        data = await Helpers.BrowseFiles(this._importPathData.activeSource, this._importPathData.current, options);
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
      files,
      cssClass: "ddb-importer-window",
    };
  }

  /**
   * Create missing folder structures in the world
   */
  async _createFolders() {
    CONFIG.DDBI.ADVENTURE.TEMPORARY.folders["null"] = null;
    CONFIG.DDBI.ADVENTURE.TEMPORARY.lookups = null;

    // the folder list could be out of order, we need to create all folders with parent null first
    const firstLevelFolders = this.folders.filter((folder) => folder.parent === null);
    await Helpers.importFolder(firstLevelFolders, this.folders);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".dialog-button").on("click", this._dialogButton.bind(this));
  }

  /**
   * Checks for any missing data from DDB in the compendiums, spells, items, monsters that have been referenced by the
   * adventure and imports them using DDB Importer.
   */
  async _checkForMissingData() {
    await this._createFolders();

    if (this.adventure.required?.spells && this.adventure.required.spells.length > 0) {
      logger.debug(`${this.adventure.name} - spells required`, this.adventure.required.spells);
      AdventureMunch._progressNote(`Checking for missing spells from DDB`);
      await Helpers.checkForMissingDocuments("spell", this.adventure.required.spells);
    }
    if (this.adventure.required?.items && this.adventure.required.items.length > 0) {
      logger.debug(`${this.adventure.name} - items required`, this.adventure.required.items);
      AdventureMunch._progressNote(`Checking for missing items from DDB`);
      await Helpers.checkForMissingDocuments("item", this.adventure.required.items);
    }
    if (this.adventure.required?.monsters && this.adventure.required.monsters.length > 0) {
      logger.debug(`${this.adventure.name} - monsters required`, this.adventure.required.monsters);
      AdventureMunch._progressNote(`Checking for missing monsters from DDB`);
      await Helpers.checkForMissingDocuments("monster", this.adventure.required.monsters);
    }
    logger.debug("Missing data check complete");
  }

  /**
   * Work through the different types in the adventure and import them
   * @returns {Promise<>}
   */
  async _importFiles() {
    if (Helpers.folderExists("scene", this.zip)) {
      logger.debug(`${this.adventure.name} - Loading scenes`);
      await this._checkForDataUpdates("scene");
    }
    if (Helpers.folderExists("actor", this.zip)) {
      logger.debug(`${this.adventure.name} - Loading actors`);
      await this._importFile("actor");
    }
    if (Helpers.folderExists("item", this.zip)) {
      logger.debug(`${this.adventure.name} - Loading item`);
      await this._importFile("item");
    }
    if (Helpers.folderExists("journal", this.zip)) {
      logger.debug(`${this.adventure.name} - Loading journal`);
      await this._importFile("journal");
    }
    if (Helpers.folderExists("table", this.zip)) {
      logger.debug(`${this.adventure.name} - Loading table`);
      await this._importFile("table");
    }
    if (Helpers.folderExists("playlist", this.zip)) {
      logger.debug(`${this.adventure.name} - Loading playlist`);
      await this._importFile("playlist");
    }
    if (Helpers.folderExists("compendium", this.zip)) {
      logger.debug(`${this.adventure.name} - Loading compendium`);
      await this._importCompendium("compendium");
    }
    if (Helpers.folderExists("macro", this.zip)) {
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
   * Some items need linking up or tweaking post import.
   * @returns {Promise<>}
   */
  async _revisitItems() {
    try {
      if (this._itemsToRevisit.length > 0) {
        let totalCount = this._itemsToRevisit.length;
        let currentCount = 0;

        await Helpers.asyncForEach(this._itemsToRevisit, async (item) => {
          const toTimer = setTimeout(() => {
            logger.warn(`Reference update timed out.`);
            this._renderCompleteDialog();
            this.close();
          }, 180000);
          try {
            const obj = await fromUuid(item);
            // let rawData;
            let updatedData = {};
            switch (obj.documentName) {
              case "Scene": {
                const scene = duplicate(obj);
                // this is a scene we need to update links to all items
                logger.info(`Updating ${scene.name}, ${scene.tokens.length} tokens`);
                let deadTokenIds = [];
                await Helpers.asyncForEach(scene.tokens, async (token) => {
                  if (token.actorId) {
                    const sceneToken = scene.flags.ddb.tokens.find((t) => t._id === token._id);
                    delete sceneToken.scale;
                    const worldActor = game.actors.get(token.actorId);
                    if (worldActor) {
                      const tokenData = await worldActor.getTokenDocument();
                      delete tokenData.y;
                      delete tokenData.x;
                      const jsonTokenData = duplicate(tokenData);
                      const updateData = mergeObject(jsonTokenData, sceneToken);
                      logger.debug(`${token.name} token data for id ${token.actorId}`, updateData);
                      await obj.updateEmbeddedDocuments("Token", [updateData], { keepId: true });
                    } else {
                      deadTokenIds.push(token._id);
                    }
                  } else {
                    deadTokenIds.push(token._id);
                  }
                });
                // remove a token from the scene if we have not been able to link it
                if (deadTokenIds.length > 0) {
                  logger.warn(`Removing ${scene.name} tokens with no world actors`, deadTokenIds);
                  await obj.deleteEmbeddedDocuments("Token", deadTokenIds);
                }

                // In 0.8.x the thumbs don't seem to be generated.
                // This code would embed the thumbnail.
                // Consider writing this out.
                if (!obj.thumb) {
                  const thumbData = await obj.createThumbnail();
                  updatedData["thumb"] = thumbData.thumb;
                }
                await obj.update(updatedData);
                break;
              }
              // no default
            }
          } catch (err) {
            logger.warn(`Error updating references for object ${item}`, err);
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
  }

  async _dialogButton(event) {
    event.preventDefault();
    event.stopPropagation();
    const a = event.currentTarget;
    const action = a.dataset.button;

    if (action === "import") {
      let importFilename;
      try {
        $(".import-progress").toggleClass("import-hidden");
        $(".ddb-overlay").toggleClass("import-invalid");

        const form = $("form.ddb-importer-window")[0];

        if (form.data.files.length) {
          importFilename = form.data.files[0].name;
          this.zip = await FileHelper.readBlobFromFile(form.data.files[0]).then(JSZip.loadAsync);
        } else {
          const selectedFile = $("#import-file").val();
          importFilename = selectedFile;
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

        if (this.adventure.version < 4.0) {
          ui.notifications.error(
            `This Adventure (${this.adventure.name}) was generated for v9.  Please regenerate your config file for Adventure Muncher.`,
            { permanent: true }
          );
          throw new Error(
            `This Adventure (${this.adventure.name}) was generated for v9.  Please regenerate your config file for Adventure Muncher.`
          );
        }

        CONFIG.DDBI.ADVENTURE.TEMPORARY = {
          folders: {},
          import: {},
          actors: {},
          sceneTokens: {},
        };

        await this._checkForMissingData();

        // now we have imported all missing data, generate the lookup data
        CONFIG.DDBI.ADVENTURE.TEMPORARY.lookups = await generateAdventureConfig(true);
        logger.debug("Lookups loaded", CONFIG.DDBI.ADVENTURE.TEMPORARY.lookups.lookups);

        await this._importFiles();
        await this._revisitItems();

        $(".ddb-overlay").toggleClass("import-invalid");

        this._renderCompleteDialog();

        // eslint-disable-next-line require-atomic-updates
        CONFIG.DDBI.ADVENTURE.TEMPORARY = {};
        this.close();
      } catch (err) {
        $(".ddb-overlay").toggleClass("import-invalid");
        ui.notifications.error(`There was an error importing ${importFilename}`);
        logger.error(`Error importing file ${importFilename}`, err);
        this.close();
      }
    }
  }

  async _importCompendium(type) {
    let totalCount = 0;
    let currentCount = 0;
    const typeName = type[0].toUpperCase() + type.slice(1);
    const dataFiles = Helpers.getFiles(type, this.zip);
    logger.info(`Importing ${this.adventure.name} - ${typeName} (${dataFiles.length} items)`);
    totalCount = dataFiles.length;

    await Helpers.asyncForEach(dataFiles, async (file) => {
      const rawData = await this.zip.file(file.name).async("text");
      const data = JSON.parse(rawData);

      let pack = await Helpers.getCompendiumPack(data.info.entity, data.info.label);
      await pack.getIndex();

      totalCount += data.items.length;
      await Helpers.asyncForEach(data.items, async (item) => {
        let obj;
        let entry = pack.index.find((e) => e.name === item.name);

        item.flags.importid = item._id;

        if (item.img) {
          // eslint-disable-next-line require-atomic-updates
          item.img = await this.importImage(item.img);
        }
        if (item.thumb) {
          // eslint-disable-next-line require-atomic-updates
          item.thumb = await this.importImage(item.thumb);
        }
        if (item?.token?.img) {
          // eslint-disable-next-line require-atomic-updates
          item.token.img = await this.importImage(item.token.img);
        }

        if (item.prototypeToken?.texture?.src) {
          // eslint-disable-next-line require-atomic-updates
          item.prototypeToken.texture.src = await this.importImage(item.prototypeToken.texture.src);
        }

        if (item?.items?.length) {
          await Helpers.asyncForEach(data.items, async (i) => {
            if (i.img) {
              // eslint-disable-next-line require-atomic-updates
              i.img = await this.importImage(i.img);
            }
          });
        }

        if (item.pages?.length) {
          await Helpers.asyncForEach(item.pages, async (page) => {
            if (page.src) {
              // eslint-disable-next-line require-atomic-updates
              page.src = await this.importImage(page.src);
            }
          });
        }

        switch (data.info.entity) {
          case "Item":
            obj = new Item(item, { temporary: true });
            break;
          case "Actor":
            obj = new Actor(item, { temporary: true });
            break;
          case "Scene":
            obj = new Scene(item, { temporary: true });
            break;
          case "JournalEntry":
            obj = new JournalEntry(item, { temporary: true });
            break;
          case "Macro":
            obj = new Macro(item, { temporary: true });
            break;
          case "RollTable":
            await Helpers.asyncForEach(item.results, async (result) => {
              // eslint-disable-next-line require-atomic-updates
              result.img = await this.importImage(result.img);
            });
            obj = new RollTable(item, { temporary: true });
            break;
          case "Playlist":
            await Helpers.asyncForEach(item.sounds, async (sound) => {
              // eslint-disable-next-line require-atomic-updates
              sound.path = await this.importImage(sound.path);
            });
            obj = new Playlist(item, { temporary: true });
            break;
          // no default
        }

        if (!entry) {
          let compendiumItem = await pack.importDocument(obj);

          if (JSON.stringify(item).match(this.pattern) || JSON.stringify(item).match(this.altpattern)) {
            this._itemsToRevisit.push(`Compendium.${pack.metadata.package}.${pack.metadata.name}.${compendiumItem.id}`);
          }
        }
        currentCount += 1;
        AdventureMunch._updateProgress(totalCount, currentCount, typeName);
      });
      currentCount += 1;
      AdventureMunch._updateProgress(totalCount, currentCount, typeName);
    });
  }

  // import a scene file
  async _importRenderedSceneFile(typeName, data, needRevisit, overwriteIds, overwriteEntity) {
    if (!Helpers.findEntityByImportId("scenes", data._id) || overwriteEntity) {
      await Helpers.asyncForEach(data.tokens, async (token) => {
        // eslint-disable-next-line require-atomic-updates
        if (token.img) token.img = await this.importImage(token.img);
        if (token.prototypeToken?.texture?.src) {
          // eslint-disable-next-line require-atomic-updates
          token.prototypeToken.texture.src = await this.importImage(token.prototypeToken.texture.src);
        }
      });

      await Helpers.asyncForEach(data.sounds, async (sound) => {
        // eslint-disable-next-line require-atomic-updates
        sound.path = await this.importImage(sound.path);
      });

      await Helpers.asyncForEach(data.notes, async (note) => {
        // eslint-disable-next-line require-atomic-updates
        note.icon = await this.importImage(note.icon, true);
      });

      await Helpers.asyncForEach(data.tiles, async (tile) => {
        // eslint-disable-next-line require-atomic-updates
        tile.img = await this.importImage(tile.img);
      });

      if (overwriteEntity) await Scene.deleteDocuments([data._id]);
      const scene = await Scene.create(data, { keepId: true });
      this._itemsToRevisit.push(`Scene.${scene.id}`);
    }
  }

  async _importRenderedFile(typeName, data, needRevisit, overwriteIds) {
    const overwriteEntity = overwriteIds.includes(data._id);
    switch (typeName) {
      case "Scene": {
        await this._importRenderedSceneFile(typeName, data, needRevisit, overwriteIds, overwriteEntity);
        break;
      }
      case "Actor":
        if (!Helpers.findEntityByImportId("actors", data._id)) {
          let actor = await Actor.create(data, { keepId: true });
          await actor.update({ [`data.token.actorId`]: actor.id });
          if (needRevisit) {
            this._itemsToRevisit.push(`Actor.${actor.id}`);
          }
        }
        break;
      case "Item":
        if (!Helpers.findEntityByImportId("items", data._id)) {
          let item = await Item.create(data, { keepId: true });
          if (needRevisit) {
            this._itemsToRevisit.push(`Item.${item.id}`);
          }
        }
        break;
      case "JournalEntry":
        if (!Helpers.findEntityByImportId("journal", data._id)) {
          let journal = await JournalEntry.create(data, { keepId: true });
          if (needRevisit) {
            this._itemsToRevisit.push(`JournalEntry.${journal.id}`);
          }
        }
        break;
      case "RollTable":
        if (!Helpers.findEntityByImportId("tables", data._id)) {
          let rolltable = await RollTable.create(data, { keepId: true });
          if (needRevisit) {
            this._itemsToRevisit.push(`RollTable.${rolltable.id}`);
          }
        }
        break;
      case "Playlist":
        if (!Helpers.findEntityByImportId("playlists", data._id)) {
          data.name = `${this.adventure.name}.${data.name}`;
          await Playlist.create(data, { keepId: true });
        }
        break;
      case "Macro":
        if (!Helpers.findEntityByImportId("macros", data._id)) {
          let macro = await Macro.create(data, { keepId: true });
          if (needRevisit) {
            this._itemsToRevisit.push(`Macro.${macro.id}`);
          }
        }
        break;
      // no default
    }
  }

  async _checkForDataUpdates(type) {
    const importType = Helpers.getImportType(type);
    const dataFiles = Helpers.getFiles(type, this.zip);

    logger.info(`Checking ${this.adventure.name} - ${importType} (${dataFiles.length} for updates)`);

    let fileData = [];
    let hasVersions = false;
    const moduleInfo = game.modules.get("ddb-importer");
    const installedVersion = moduleInfo.version;

    await Helpers.asyncForEach(dataFiles, async (file) => {
      const raw = await this.zip.file(file.name).async("text");
      const json = JSON.parse(raw);
      if (!hasVersions && json?.flags?.ddb?.versions) {
        hasVersions = true;
      }
      switch (importType) {
        case "Scene": {
          const existingScene = await game.scenes.find((item) => item.id === json._id);
          const scene = Helpers.extractDocumentVersionData(json, existingScene, installedVersion);
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

    return new Promise((resolve) => {
      if (hasVersions && fileData.length > 0) {
        new Dialog(
          {
            title: `${importType} updates`,
            content: {
              dataType: type,
              dataTypeDisplay: importType,
              fileData: fileData,
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
                  resolve(this._importFile(dataType, ids));
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

  async _importTokenImage(tokenType, data, totalCount, currentCount, importType) {
    if (data[tokenType]?.randomImg) {
      const imgFilepaths = data[tokenType].img.split("/");
      const imgFilename = imgFilepaths.reverse()[0];
      const imgFilepath = data[tokenType].img.replace(imgFilename, "");

      const filesToUpload = Object.values(this.zip.files).filter((file) => {
        return !file.dir && file.name.includes(imgFilepath);
      });

      let adventurePath = this.adventure.name.replace(/[^a-z0-9]/gi, "_");

      data[tokenType].img = `${this._importPathData.current}/${adventurePath}/${data[tokenType].img}`;

      if (filesToUpload.length > 0) {
        totalCount += filesToUpload.length;

        await Helpers.asyncForEach(filesToUpload, async (file) => {
          await this.importImage(file.name);
          currentCount += 1;
          AdventureMunch._updateProgress(totalCount, currentCount, importType);
        });
      }
    } else {
      // eslint-disable-next-line require-atomic-updates
      data[tokenType].img = await this.importImage(data[tokenType].img);
    }

    return [data, totalCount, currentCount];
  }

  async _importFile(type, overwriteIds = []) {
    let totalCount = 0;
    let currentCount = 0;

    logger.info(`IDs to overwrite of type ${type}: ${JSON.stringify(overwriteIds)}`);

    const importType = Helpers.getImportType(type);
    const dataFiles = Helpers.getFiles(type, this.zip);

    logger.info(`Importing ${this.adventure.name} - ${importType} (${dataFiles.length} items)`);

    totalCount = dataFiles.length;

    // eslint-disable-next-line complexity
    await Helpers.asyncForEach(dataFiles, async (file) => {
      const rawdata = await this.zip.file(file.name).async("text");
      let data = JSON.parse(rawdata);
      let needRevisit = false;

      // let pattern = /(\@[a-z]*)(\[)([a-z0-9]*|[a-z0-9\.]*)(\])/gmi
      if (rawdata.match(this.pattern) || rawdata.match(this.altpattern)) {
        needRevisit = true;
      }

      if (data.img) {
        // eslint-disable-next-line require-atomic-updates
        data.img = await this.importImage(data.img);
      }
      if (data.thumb) {
        // eslint-disable-next-line require-atomic-updates
        data.thumb = await this.importImage(data.thumb);
      }
      if (data?.token?.img) {
        // eslint-disable-next-line require-atomic-updates
        [data, totalCount, currentCount] = await this._importTokenImage(
          "token",
          data,
          totalCount,
          currentCount,
          importType
        );
      }
      if (data?.prototypeToken?.img) {
        // eslint-disable-next-line require-atomic-updates
        [data, totalCount, currentCount] = await this._importTokenImage(
          "prototypeToken",
          data,
          totalCount,
          currentCount,
          importType
        );
      }

      if (data?.items?.length) {
        await Helpers.asyncForEach(data.items, async (item) => {
          if (item.img) {
            // eslint-disable-next-line require-atomic-updates
            item.img = await this.importImage(item.img);
          }
        });
      }

      if (data?.pages?.length) {
        await Helpers.asyncForEach(data.pages, async (page) => {
          if (page.src) {
            // eslint-disable-next-line require-atomic-updates
            page.src = await this.importImage(page.src);
          }
        });
      }

      if (importType === "Scene") {
        if (data.tokens) {
          await Helpers.generateTokenActors(data);
        }
        if (data.flags["perfect-vision"] && Array.isArray(data.flags["perfect-vision"])) {
          data.flags["perfect-vision"] = {};
        }
      } else if (importType === "Playlist") {
        await Helpers.asyncForEach(data.sounds, async (sound) => {
          if (sound.path) {
            // eslint-disable-next-line require-atomic-updates
            sound.path = await this.importImage(sound.path);
          }
        });
      } else if (importType === "RollTable") {
        await Helpers.asyncForEach(data.results, async (result) => {
          if (result.img) {
            // eslint-disable-next-line require-atomic-updates
            result.img = await this.importImage(result.img);
          }
          if (result.resultId) {
            needRevisit = true;
          }
          logger.debug(`Updating DDB links for ${data.name}`);
          // eslint-disable-next-line require-atomic-updates
          data.text = Helpers.foundryCompendiumReplace(data.text);
        });
      } else if (importType === "JournalEntry" && data.pages) {
        await Helpers.asyncForEach(data.pages, async (page) => {
          if (page.text.content) {
            const journalImages = Helpers.reMatchAll(
              /(src|href)="(?!http(?:s*):\/\/)([\w0-9\-._~%!$&'()*+,;=:@/]*)"/,
              page.text.content
            );
            if (journalImages) {
              logger.debug(`Updating Image links for ${page.name}`);
              await Helpers.asyncForEach(journalImages, async (result) => {
                const path = await this.importImage(result[2]);
                page.text.content = page.text.content.replace(result[0], `${result[1]}="${path}"`);
              });
            }
            logger.debug(`Updating DDB links for ${page.name}`);
            page.text.content = Helpers.foundryCompendiumReplace(page.text.content);
          }
        });
      }

      data.flags.importid = data._id;
      setProperty(data.flags, "ddbimporter.version", CONFIG.DDBI.version);

      if (importType !== "Playlist" && importType !== "Compendium") {
        if (CONFIG.DDBI.ADVENTURE.TEMPORARY.folders[data.folder]) {
          logger.debug(
            `Adding data to subfolder importkey = ${data.folder}, folder = ${
              CONFIG.DDBI.ADVENTURE.TEMPORARY.folders[data.folder]
            }`
          );
          data.folder = CONFIG.DDBI.ADVENTURE.TEMPORARY.folders[data.folder];
        } else {
          logger.debug(
            `Adding data to subfolder importkey = ${data.folder}, folder = ${CONFIG.DDBI.ADVENTURE.TEMPORARY.folders["null"]}`
          );
          if (this.adventure?.options?.folders) {
            data.folder = CONFIG.DDBI.ADVENTURE.TEMPORARY.folders["null"];
          } else {
            data.folder = CONFIG.DDBI.ADVENTURE.TEMPORARY.folders[importType];
          }
        }
      }

      await this._importRenderedFile(importType, data, needRevisit, overwriteIds);

      currentCount += 1;
      AdventureMunch._updateProgress(totalCount, currentCount, importType);
    });
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
