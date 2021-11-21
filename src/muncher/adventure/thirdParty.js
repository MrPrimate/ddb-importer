import Helpers from "./common.js";
import logger from "../../logger.js";
import { generateAdventureConfig } from "../adventure.js";

const MR_PRIMATES_THIRD_PARTY_REPO = "MrPrimate/ddb-third-party-scenes";
const RAW_BASE_URL = `https://raw.githubusercontent.com/${MR_PRIMATES_THIRD_PARTY_REPO}`;
const RAW_MODULES_URL = `${RAW_BASE_URL}/main/modules.json`;

export default class ThirdPartyMunch extends FormApplication {
  /** @override */
  constructor(object = {}, options = {}) {
    super(object, options);
    this._itemsToRevisit = [];
    this._adventure = {};
  }

  /** @override */
  static get defaultOptions() {
    this.pattern = /(@[a-z]*)(\[)([a-z0-9]*|[a-z0-9.]*)(\])(\{)(.*?)(\})/gmi;
    this.altpattern = /((data-entity)=\\?["']?([a-zA-Z]*)\\?["']?|(data-pack)=\\?["']?([[\S.]*)\\?["']?) data-id=\\?["']?([a-zA-Z0-9]*)\\?["']?.*?>(.*?)<\/a>/gmi;

    return mergeObject(super.defaultOptions, {
      id: "ddb-adventure-import",
      classes: ["ddb-adventure-import"],
      title: "Third Party Munch",
      template: "modules/ddb-importer/handlebars/adventure/import-third.hbs",
      width: 350,
    });
  }

  /** @override */
  // eslint-disable-next-line class-methods-use-this
  async getData() {
    let data;
    let packages = [];

    try {
      data = await $.getJSON(RAW_MODULES_URL);
      this._defaultRepoData = data;
      for (const [key, value] of Object.entries(data.packages)) {
        console.log(`${key}: ${value}`);
        packages.push(value);
      }
      packages = packages.sort((a, b) => a.name.localeCompare(b.last_nom));
      console.warn(this._defaultRepoData);
    } catch (err) {
      logger.error(err);
      logger.warn(`Unable to generate package list.`);
    }

    return {
      data,
      packages,
      cssClass: "ddb-importer-window"
    };

  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".dialog-button").on("click", this._dialogButton.bind(this));
  }

  // eslint-disable-next-line complexity
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

        let zip;
        if (form.data.files.length) {
          importFilename = form.data.files[0].name;
          zip = await Helpers.readBlobFromFile(form.data.files[0]).then(JSZip.loadAsync);
        } else {
          const selectedFile = $("#import-file").val();
          importFilename = selectedFile;
          zip = await fetch(`/${selectedFile}`)
            .then((response) => {
                if (response.status === 200 || response.status === 0) {
                    return Promise.resolve(response.blob());
                } else {
                    return Promise.reject(new Error(response.statusText));
                }
            })
            .then(JSZip.loadAsync);
        }

        const adventure = JSON.parse(await zip.file("adventure.json").async("text"));
        let folders;
        try {
          folders = JSON.parse(await zip.file("folders.json").async("text"));
        } catch (err) {
          logger.warn(`Folder structure file not found.`);
        }

        if (adventure.system !== game.data.system.data.name) {
          ui.notifications.error(`Invalid system for Adventure ${adventure.name}.  Expects ${adventure.system}`);
          throw new Error(`Invalid system for Adventure ${adventure.name}.  Expects ${adventure.system}`);
        }

        CONFIG.DDBI.ADVENTURE.TEMPORARY = {
          folders: {},
          import: {},
          actors: {},
          sceneTokens: {},
        };

        await ThirdPartyMunch._createFolders(adventure, folders);

        if (adventure.required?.monsters && adventure.required.monsters.length > 0) {
          logger.debug(`${adventure.name} - monsters required`, adventure.required.monsters);
          ThirdPartyMunch._progressNote(`Checking for missing monsters from DDB`);
          await Helpers.checkForMissingDocuments("monster", adventure.required.monsters);
        }
        if (adventure.required?.spells && adventure.required.spells.length > 0) {
          logger.debug(`${adventure.name} - spells required`, adventure.required.spells);
          ThirdPartyMunch._progressNote(`Checking for missing spells from DDB`);
          await Helpers.checkForMissingDocuments("spell", adventure.required.spells);
        }
        if (adventure.required?.items && adventure.required.items.length > 0) {
          logger.debug(`${adventure.name} - items required`, adventure.required.items);
          ThirdPartyMunch._progressNote(`Checking for missing items from DDB`);
          await Helpers.checkForMissingDocuments("item", adventure.required.items);
        }

        // now we have imported all missing data, generate the lookup data
        CONFIG.DDBI.ADVENTURE.TEMPORARY.lookups = await generateAdventureConfig();
        logger.debug("Lookups loaded", CONFIG.DDBI.ADVENTURE.TEMPORARY.lookups.lookups);

        if (Helpers.folderExists("scene", zip)) {
          logger.debug(`${adventure.name} - Loading scenes`);
          await this._checkForDataUpdates("scene", zip, adventure);
        }

        try {
          if (this._itemsToRevisit.length > 0) {
            let totalCount = this._itemsToRevisit.length;
            let currentCount = 0;

            await Helpers.asyncForEach(this._itemsToRevisit, async (item) => {
              const toTimer = setTimeout(() => {
                logger.warn(`Reference update timed out.`);
                const title = `Successful Import of ${adventure.name}`;
                new Dialog(
                  {
                    title: title,
                    content: {
                      adventure
                    },
                    buttons: {
                      two: {
                        label: "Ok",
                      },
                    },
                  },
                  {
                    classes: ["dialog", "adventure-import-export"],
                    template: "modules/ddb-importer/handlebars/adventure/import-complete.hbs",
                  }
                ).render(true);
                this.close();
              }, 60000);
              try {
                const obj = await fromUuid(item);
                // let rawData;
                let updatedData = {};
                switch (obj.documentName) {
                  case "Scene": {
                    const scene = JSON.parse(JSON.stringify(obj.data));
                    // this is a scene we need to update links to all items
                    logger.info(`Updating ${scene.name}, ${scene.tokens.length} tokens`);
                    await Helpers.asyncForEach(scene.tokens, async (token) => {
                      if (token.actorId) {
                        const sceneToken = scene.flags.ddb.tokens.find((t) => t._id === token._id);
                        delete sceneToken.scale;
                        const worldActor = game.actors.get(token.actorId);
                        if (worldActor) {
                          const tokenData = await worldActor.getTokenData();
                          delete tokenData.y;
                          delete tokenData.x;
                          const jsonTokenData = JSON.parse(JSON.stringify(tokenData));
                          const updateData = mergeObject(jsonTokenData, sceneToken);
                          logger.debug(`${token.name} token data for id ${token.actorId}`, updateData);
                          await obj.updateEmbeddedDocuments("Token", [updateData], { keepId: true });
                        }
                      }
                    });

                    // In 0.8.x the thumbs don't seem to be generated.
                    // This code would embed the thumbnail.
                    // Consider writing this out.
                    if (!obj.data.thumb) {
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
              ThirdPartyMunch._updateProgress(totalCount, currentCount, "References");
              clearTimeout(toTimer);
            });
          }
        } catch (err) {
          // eslint-disable-next-line no-undef
          logger.warn(`Error during reference update for object ${item}`, err);
        }

        $(".ddb-overlay").toggleClass("import-invalid");

        const title = `Successful Import of ${adventure.name}`;
        new Dialog(
          {
            title: title,
            content: {
              adventure
            },
            buttons: {
              two: {
                label: "Ok",
              },
            },
          },
          {
            classes: ["dialog", "adventure-import-export"],
            template: "modules/ddb-importer/handlebars/adventure/import-complete.hbs",
          }
        ).render(true);

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

  // import a scene file
  async _importRenderedSceneFile(adventure, typeName, data, zip, needRevisit, overwriteIds, overwriteEntity) {
    if (!Helpers.findEntityByImportId("scenes", data._id) || overwriteEntity) {
      await Helpers.asyncForEach(data.tokens, async (token) => {
        // eslint-disable-next-line require-atomic-updates
        if (token.img) token.img = await Helpers.importImage(token.img, zip, adventure);
      });

      await Helpers.asyncForEach(data.sounds, async (sound) => {
        // eslint-disable-next-line require-atomic-updates
        sound.path = await Helpers.importImage(sound.path, zip, adventure);
      });

      await Helpers.asyncForEach(data.notes, async (note) => {
        // eslint-disable-next-line require-atomic-updates
        note.icon = await Helpers.importImage(note.icon, zip, adventure, true);
      });

      await Helpers.asyncForEach(data.tiles, async (tile) => {
        // eslint-disable-next-line require-atomic-updates
        tile.img = await Helpers.importImage(tile.img, zip, adventure);
      });

      if (overwriteEntity) await Scene.delete([data._id]);
      const scene = await Scene.create(data, { keepId: true });
      this._itemsToRevisit.push(`Scene.${scene.data._id}`);
    }
  }

  async _importRenderedFile(adventure, typeName, data, zip, needRevisit, overwriteIds) {
    const overwriteEntity = overwriteIds.includes(data._id);
    switch (typeName) {
      case "Scene": {
        await this._importRenderedSceneFile(adventure, typeName, data, zip, needRevisit, overwriteIds, overwriteEntity);
        break;
      }
      // no default
    }
  }

  async _checkForDataUpdates(type, zip, adventure) {
    const importType = Helpers.getImportType(type);
    const dataFiles = Helpers.getFiles(type, zip);

    logger.info(`Checking ${adventure.name} - ${importType} (${dataFiles.length} for updates)`);

    let fileData = [];
    let hasVersions = false;
    const moduleInfo = game.modules.get("ddb-importer").data;
    const installedVersion = moduleInfo.version;

    await Helpers.asyncForEach(dataFiles, async (file) => {
      const raw = await zip.file(file.name).async("text");
      const json = JSON.parse(raw);
      if (!hasVersions && json?.flags?.ddb?.versions) {
        hasVersions = true;
      }
      switch (importType) {
        case "Scene": {
          const existingScene = await game.scenes.find((item) => item.data._id === json._id);
          if (existingScene) {
            const scene = Helpers.extractDocumentVersionData(json, existingScene, installedVersion);
            if (scene.importerVersionChanged || scene.metaVersionChanged || scene.muncherVersionChanged) {
              fileData.push(scene);
            }
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
              "dataType": type,
              "dataTypeDisplay": importType,
              "fileData": fileData,
              "cssClass": "import-data-updates"
            },
            buttons: {
              confirm: {
                label: "Confirm",
                callback: async () => {
                  const formData = $('.import-data-updates').serializeArray();
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
                  resolve(this._importFile(dataType, zip, adventure, ids));
                }
              },
            },
            default: "confirm",
            close: async () => {
              resolve(this._importFile(type, zip, adventure));
            },
          },
          {
            width: 700,
            classes: ["dialog", "adventure-import-updates"],
            template: "modules/ddb-importer/handlebars/adventure/import-updates.hbs",
          }
        ).render(true);
      } else {
        resolve(this._importFile(type, zip, adventure));
      }
    });

  }

  async _importFile(type, zip, adventure, overwriteIds = []) {
    let totalCount = 0;
    let currentCount = 0;

    logger.info(`IDs to overwrite of type ${type}: ${JSON.stringify(overwriteIds)}`);

    const importType = Helpers.getImportType(type);
    const dataFiles = Helpers.getFiles(type, zip);

    logger.info(`Importing ${adventure.name} - ${importType} (${dataFiles.length} items)`);

    totalCount = dataFiles.length;

    await Helpers.asyncForEach(dataFiles, async (file) => {
      const rawData = await zip.file(file.name).async("text");
      const data = JSON.parse(rawData);

      let needRevisit = false;

      // let pattern = /(\@[a-z]*)(\[)([a-z0-9]*|[a-z0-9\.]*)(\])/gmi
      if (rawData.match(this.pattern) || rawData.match(this.altpattern)) {
        needRevisit = true;
      }

      if (data.img) {
        // eslint-disable-next-line require-atomic-updates
        data.img = await Helpers.importImage(data.img, zip, adventure);
      }
      if (data.thumb) {
        // eslint-disable-next-line require-atomic-updates
        data.thumb = await Helpers.importImage(data.thumb, zip, adventure);
      }
      if (data?.token?.img) {
        if (data?.token?.randomImg) {
          const imgFilepaths = data.token.img.split("/");
          const imgFilename = (imgFilepaths.reverse())[0];
          const imgFilepath = data.token.img.replace(imgFilename, "");

          const filesToUpload = Object.values(zip.files).filter((file) => {
            return !file.dir && file.name.includes(imgFilepath);
          });

          let adventurePath = (adventure.name).replace(/[^a-z0-9]/gi, '_');

          data.token.img = `${this._importPathData.current}/${adventurePath}/${data.token.img}`;

          if (filesToUpload.length > 0) {
            totalCount += filesToUpload.length;

            await Helpers.asyncForEach(filesToUpload, async (file) => {
              await Helpers.importImage(file.name, zip, adventure);
              currentCount += 1;
              ThirdPartyMunch._updateProgress(totalCount, currentCount, importType);
            });
          }

        } else {
          // eslint-disable-next-line require-atomic-updates
          data.token.img = await Helpers.importImage(data.token.img, zip, adventure);
        }
      }

      if (data?.items?.length) {
        await Helpers.asyncForEach(data.items, async (item) => {
          if (item.img) {
            // eslint-disable-next-line require-atomic-updates
            item.img = await Helpers.importImage(item.img, zip, adventure);
          }
        });
      }

      if (importType === "Scene") {
        if (data.tokens) {
          await Helpers.generateTokenActors(data);
        }
      }

      data.flags.importid = data._id;
      await this._importRenderedFile(adventure, importType, data, zip, needRevisit, overwriteIds);

      currentCount += 1;
      ThirdPartyMunch._updateProgress(totalCount, currentCount, importType);
    });


  }

  static _updateProgress(total, count, type) {
    const localizedType = `dbb-importer.label.${type}`;
    $(".import-progress-bar")
      .width(`${Math.trunc((count / total) * 100)}%`)
      .html(`<span>${game.i18n.localize("dbb-importer.label.Working")} (${game.i18n.localize(localizedType)})...</span>`);
  }

  static _progressNote(note) {
    $(".import-progress-bar")
      .html(`<span>${game.i18n.localize("dbb-importer.label.Working")} (${note})...</span>`);
  }
}
