import Helpers from "./common.js";
import logger from "../../logger.js";
import { generateAdventureConfig } from "../adventure.js";
import { generateIcon } from "./icons.js";

const MR_PRIMATES_THIRD_PARTY_REPO = "MrPrimate/ddb-third-party-scenes";
const RAW_BASE_URL = `https://raw.githubusercontent.com/${MR_PRIMATES_THIRD_PARTY_REPO}`;
const RAW_MODULES_URL = `${RAW_BASE_URL}/main/modules.json`;

export default class ThirdPartyMunch extends FormApplication {
  /** @override */
  constructor(object = {}, options = {}) {
    super(object, options);
    this._itemsToRevisit = [];
    this._adventure = {};
    this._scenePackage = {};
    this._packageName = "";
    this._description = "";
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
      width: 400,
      height: "auto",
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
        logger.debug(`${key}: ${value}`);
        packages.push(value);
      }
      const partialScenes = game.settings.get("ddb-importer", "third-party-scenes-partial");
      packages = packages
        .filter((p) => p.released || partialScenes)
        .sort((a, b) => a.name.localeCompare(b.last_nom));
      logger.debug("_defaultRepoData", this._defaultRepoData);
    } catch (err) {
      logger.error(err);
      logger.warn(`Unable to generate package list.`);
    }

    return {
      data,
      packages,
      cssClass: "ddb-importer-third-party-window"
    };

  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".dialog-button").on("click", this._dialogButton.bind(this));
    html.find("#select-package").on("change", this._selectPackage.bind(this, null, html));
  }

  async _selectPackage(event, html) {
    const packageSelectionElement = html.find("#select-package");

    // get selected campaign from html selection
    const packageSelection = packageSelectionElement[0].selectedOptions[0]
      ? packageSelectionElement[0].selectedOptions[0].value
      : undefined;

    const moduleMessage = html.find("#ddb-message");

    if (packageSelection) {
      const missingModules = [this._defaultRepoData.packages[packageSelection].module].filter((module) => {
        return !game.modules.get(module)?.active;
      });

      this._packageName = packageSelectionElement[0].selectedOptions[0].text;
      this._description = this._defaultRepoData.packages[packageSelection].description;


      let message = "";
      if (missingModules.length > 0) {
        const missingModulesString = missingModules.join(", ");
        message += `<p>You need to install the modules: ${missingModulesString}</p>`;
      }

      const missingBooks = this._defaultRepoData.packages[packageSelection].books.filter((book) => {
        const matchingJournals = game.journal.some((j) => j.flags.ddb?.bookCode === book);
        if (matchingJournals) {
          logger.info(`Found journals for ${book}`);
          return false;
        } else {
          logger.warn(`Missing journals for ${book}`);
          return true;
        }
      });

      if (missingBooks.length > 0) {
        const bookString = missingBooks.map((bookCode) => ThirdPartyMunch._getDDBBookName(bookCode)).join(", ");
        message += `<p>You need to use Adventure Muncher to load the following books first: ${bookString}</p>`;
      }

      if (this._description && this.description !== "") {
        message += `<p><b>Details</b>: ${this._description}</p>`;
      }

      if (message !== "") {
        moduleMessage[0].innerHTML = message;
        $(".ddb-message").removeClass("import-hidden");
      }

      if (missingBooks.length === 0 && missingModules.length === 0) {
        $(".dialog-button").prop('disabled', false);
      }

    } else {
      moduleMessage[0].innerHTML = "";
      $(".ddb-message").addClass("import-hidden");
    }
    $('#ddb-adventure-import').css("height", "auto");
  }

  static async _createFolders(adventure, folders) {
    if (folders) {
      let itemFolder = null;
      CONFIG.DDBI.ADVENTURE.TEMPORARY.folders["null"] = null;
      CONFIG.DDBI.ADVENTURE.TEMPORARY.lookups = null;

      // the folder list could be out of order, we need to create all folders with parent null first
      const firstLevelFolders = folders.filter((folder) => folder.parent === null);
      await Helpers.importFolder(itemFolder, firstLevelFolders, adventure, folders);
    }
  }

  static async _checkForMissingData(adventure, folders) {
    await ThirdPartyMunch._createFolders(adventure, folders);
    // console.warn("_checkForMissingData", adventure);

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
    if (adventure.required?.monsters && adventure.required.monsters.length > 0) {
      logger.debug(`${adventure.name} - monsters required`, adventure.required.monsters);
      ThirdPartyMunch._progressNote(`Checking for missing monsters from DDB`);
      await Helpers.checkForMissingDocuments("monster", adventure.required.monsters);
    }
  }

  static _renderCompleteDialog(title, adventure) {
    new Dialog(
      {
        title: title,
        content: { adventure },
        buttons: { two: { label: "OK" } },
      },
      {
        classes: ["dialog", "adventure-import-export"],
        template: "modules/ddb-importer/handlebars/adventure/import-complete.hbs",
      }
    ).render(true);
  }

  static async _fixupScenes(scenes) {
    try {
      if (scenes.length > 0) {
        let totalCount = scenes.length;
        let currentCount = 0;

        await Helpers.asyncForEach(scenes, async (obj) => {
          try {
            let updatedData = {};
            switch (obj.documentName) {
              case "Scene": {
                // In 0.8.x the thumbs don't seem to be auto generated anymore
                // This code would embed the thumbnail.
                // Remove once/if resolved
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
            logger.warn(`Error updating references for scene ${obj}`, err);
          }
          currentCount += 1;
          ThirdPartyMunch._updateProgress(totalCount, currentCount, "References");
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-undef
      logger.warn(`Error during reference update for object ${item}`, err);
    }
  }

  static async _createFolder(label, type) {
    const folderData = {
      "name": label,
      "type": type,
      "parent": null,
      "sorting": "m",
    };
    const newFolder = await Folder.create(folderData);
    logger.debug(`Created new folder ${newFolder.data._id} with data:`, folderData, newFolder);
    return newFolder;
  }

  static async _findFolder(label, type) {
    const folder = game.folders.find((f) =>
      f.type === type &&
      f.parentFolder === undefined &&
      f.name === label
    );

    return folder ? folder : ThirdPartyMunch._createFolder(label, type);
  }

  static _getDDBBookName(bookCode) {
    const selection = CONFIG.DDB.sources.find((source) => bookCode.toLowerCase() === source.name.toLowerCase());
    return selection.description;
  }

  static _generateMockAdventure(scene) {
    const monsters = scene.flags?.ddbimporter?.export?.actors && scene.flags?.ddb?.tokens
      ? scene.flags.ddb.tokens
        .filter((token) => token.flags?.ddbActorFlags?.id)
        .map((token) => token.flags.ddbActorFlags.id)
      : [];
    return {
      id: randomID(),
      name: ThirdPartyMunch._getDDBBookName(scene.flags.ddb.bookCode),
      description: "",
      system: "dnd5e",
      modules: [],
      version: "2.5",
      options: {
        folders: true
      },
      folderColour: "FF0000",
      required: {
        monsters,
      }
    };
  }

  static _generateActorId(token) {
    if (!hasProperty(token, "flags.ddbActorFlags.id")) logger.warn("Token does not link to DDB Actor", token);
    const ddbId = token.flags.ddbActorFlags?.id;
    const folderId = token.flags.actorFolderId;
    const key = `${ddbId}-${folderId}`;
    if (CONFIG.DDBI.ADVENTURE.TEMPORARY.mockActors[key]) {
      return CONFIG.DDBI.ADVENTURE.TEMPORARY.mockActors[key];
    } else {
      const existingActor = game.actors.find((actor) => actor.folder == folderId && actor.flags.ddbimporter.id == ddbId);
      const actorId = existingActor ? existingActor.id : randomID();
      CONFIG.DDBI.ADVENTURE.TEMPORARY.mockActors[key] = actorId;
      return actorId;
    }
  }

  static async _linkSceneTokens(scene) {
    logger.info(`Updating ${scene.name}, ${scene.tokens.length} tokens`);
    const tokens = await Promise.all(scene.tokens.map(async (token) => {
      if (token.actorId) {
        const worldActor = game.actors.get(token.actorId);
        if (worldActor) {
          // we merge the override data provided by the token to the actor to get
          // world specific things like img paths and scales etc
          const sceneToken = scene.flags.ddb.tokens.find((t) => t._id === token._id);
          delete sceneToken.scale;
          const tokenData = await worldActor.getTokenData();
          delete tokenData.y;
          delete tokenData.x;
          const jsonTokenData = duplicate(tokenData);
          const newToken = mergeObject(jsonTokenData, sceneToken);
          logger.debug(`${token.name} token data for id ${token.actorId}`, newToken);
          return newToken;
        }
      }
      return token;
    }));
    return tokens;
  }

  static async _linkSceneNotes(scene, adventure) {
    const journalNotes = game.journal.filter((journal) => journal?.flags?.ddb?.bookCode === scene.flags.ddb.bookCode);

    const notes = await Promise.all([scene]
      .filter((scene) => scene.flags?.ddb?.notes)
      .map((scene) => scene.flags.ddb.notes)
      .flat()
      .map(async (note) => {
        const noteJournal = journalNotes.find((journal) => {
          const contentChunkIdMatch = note.flags.ddb.contentChunkId
            ? journal.flags.ddb && note.flags.ddb &&
              journal.flags.ddb.contentChunkId == note.flags.ddb.contentChunkId
            : false;

          const noContentChunk = !note.flags.ddb.contentChunkId &&
            note.flags.ddb.originalLink && note.flags.ddb.ddbId && note.flags.ddb.parentId &&
            note.flags.ddb.slug && note.flags.ddb.linkName;
          const originMatch = noContentChunk
            ? journal.flags.ddb.slug == note.flags.ddb.slug &&
              journal.flags.ddb.ddbId == note.flags.ddbId &&
              journal.flags.ddb.parentId == note.flags.ddb.parentId &&
              journal.flags.ddb.cobaltId == note.flags.ddb.cobaltId &&
              journal.flags.ddb.originalLink == note.flags.ddb.originalLink &&
              journal.flags.ddb.linkName == note.flags.ddb.linkName
            : false;
          const journalNameMatch = !contentChunkIdMatch && !originMatch
            ? journal.name.trim() == note.label.trim()
            : false;
          return contentChunkIdMatch || originMatch || journalNameMatch;

        });
        if (noteJournal) {
          logger.info(`Found note "${note.label}"" matched to Journal with ID "${noteJournal.id}" (${noteJournal.name})`);
          note.flags.ddb.journalId = noteJournal.id;
          // eslint-disable-next-line require-atomic-updates
          note.icon = await generateIcon(adventure, note.label);
        }
        return note;
      }));

    const positionedNotes = [];
    notes.forEach((note) => {
      if (note.flags?.ddb?.journalId) {
        note.positions.forEach((position) => {
          logger.info(`Matching ${note.label} to position ${position.x}/${position.y}`);
          const noteId = randomID();
          const n = {
            "_id": noteId,
            "flags": {
              "ddb": note.flags.ddb,
              "importid": noteId,
            },
            "entryId": note.flags.ddb.journalId,
            "x": position.x,
            "y": position.y,
            "icon": note.icon, // "assets/icons/1.svg",
            "iconSize": note.iconSize ? note.iconSize : 40,
            "iconTint": "",
            "text": "",
            "fontFamily": note.fontFamily ? note.fontFamily : "Signika",
            "fontSize": note.fontSize ? note.fontSize : 48,
            "textAnchor": 1,
            "textColor": note.textColor ? note.textColor : "",
          };
          positionedNotes.push(n);
        });
      }
    });

    return positionedNotes;
  }

  async _dialogButton(event) {
    event.preventDefault();
    event.stopPropagation();
    const a = event.currentTarget;
    const action = a.dataset.button;
    const packageName = this._packageName;

    if (action === "import") {
      $(".import-progress").toggleClass("import-hidden");
      $(".ddb-overlay").toggleClass("import-invalid");
      const selectedPackage = $("#select-package").val();
      const packageURL = `${RAW_BASE_URL}/main/${selectedPackage}/module.json`;

      this._scenePackage = await fetch(packageURL)
        .then((response) => {
          if (response.status === 200 || response.status === 0) {
            return Promise.resolve(response.json());
          } else {
            return Promise.reject(new Error(response.statusText));
          }
        });

      // check for valid json object?

      logger.debug("_scenePackage", this._scenePackage);

      CONFIG.DDBI.ADVENTURE.TEMPORARY = {
        folders: {},
        import: {},
        actors: {},
        sceneTokens: {},
        mockActors: {},
      };

      // We need to check for potential Scene Folders and Create if missing
      const compendiumLabels = [...new Set(this._scenePackage.scenes
        .filter((scene) => scene.flags?.ddbimporter?.export?.compendium)
        .map((scene) => {
          const compendiumId = scene.flags.ddbimporter.export.compendium;
          const compendium = game.packs.get(compendiumId);
          return compendium.metadata.label;
        }))].map((label) => {
        return ThirdPartyMunch._findFolder(label, "Scene");
      });

      await Promise.all(compendiumLabels);

      const adventureLabels = [...new Set(this._scenePackage.scenes
        .filter((scene) => scene.flags?.ddb?.bookCode)
        .map((scene) => {
          return ThirdPartyMunch._getDDBBookName(scene.flags.ddb.bookCode);
        }))].map((label) => {
        return ThirdPartyMunch._findFolder(label, "Actor");
      });
      await Promise.all(adventureLabels);

      logger.debug("Competed folder creation");

      // import any missing monsters into the compendium
      // add tokens to scene
      // add notes to scene
      const adjustedScenes = await Promise.all(this._scenePackage.scenes
        .filter((scene) => scene.flags?.ddbimporter?.export?.actors && scene.flags?.ddb?.tokens)
        .map(async (scene) => {
          const mockScene = duplicate(scene);
          if (mockScene.flags?.ddbimporter?.export?.actors && mockScene.flags?.ddb?.tokens) {
            const mockAdventure = ThirdPartyMunch._generateMockAdventure(mockScene);
            await ThirdPartyMunch._checkForMissingData(mockAdventure, []);
            const bookName = ThirdPartyMunch._getDDBBookName(mockScene.flags.ddb.bookCode);
            const actorFolder = await ThirdPartyMunch._findFolder(bookName, "Actor");
            mockScene.tokens = mockScene.flags.ddb.tokens.map((token) => {
              token.flags.actorFolderId = actorFolder.id;
              token.actorId = ThirdPartyMunch._generateActorId(token);
              return token;
            });
            mockScene.notes = await ThirdPartyMunch._linkSceneNotes(mockScene, mockAdventure);
          }
          return mockScene;
        }));

      logger.debug("adjustedScenes", duplicate(adjustedScenes));

      logger.debug("About to generate Token Actors");
      // load token actors into world
      await Helpers.asyncForEach(adjustedScenes, async(scene) => {
        logger.debug(`Generating scene actors for ${scene.name}`);
        await Helpers.generateTokenActors(scene);
        logger.debug(`Finished scene actors for ${scene.name}`);
      });

      // link tokens on scene to imported actors
      const tokenAdjustedScenes = await Promise.all(adjustedScenes
        .map(async (scene) => {
          logger.debug(`Updating scene tokens for ${scene.name}`);
          const newScene = duplicate(scene);
          newScene.tokens = await ThirdPartyMunch._linkSceneTokens(scene);
          return newScene;
        })
      );

      logger.debug("tokenAdjustedScenes", tokenAdjustedScenes);

      CONFIG.DDBI.ADVENTURE.TEMPORARY.lookups = await generateAdventureConfig();
      logger.debug("Lookups loaded", CONFIG.DDBI.ADVENTURE.TEMPORARY.lookups.lookups);

      const scenes = await Promise.all(tokenAdjustedScenes
        .filter((scene) => scene.flags?.ddbimporter?.export?.compendium)
        // does the scene match a compendium scene
        .filter(async (scene) => {
          const compendium = game.packs.get(scene.flags.ddbimporter.export.compendium);
          const compendiumScene = compendium.index.find((s) => s.name === scene.name);
          if (compendiumScene) return true;
          else return false;
        })
        .map(async (scene) => {
          const compendiumId = scene.flags.ddbimporter.export.compendium;
          const compendium = game.packs.get(compendiumId);
          const folder = await ThirdPartyMunch._findFolder(compendium.metadata.label, "Scene");
          const compendiumScene = compendium.index.find((s) => s.name === scene.name);
          // eslint-disable-next-line require-atomic-updates
          scene.folder = folder.id;

          const existingScene = game.scenes.find((s) => s.name === scene.name && s.folder === folder.id);

          // if scene already exists, update
          if (existingScene) {
            logger.info(`Updating ${scene.name}`, scene);
            await existingScene.update(scene);
            return existingScene;
          } else {
            const worldScene = await game.scenes.importFromCompendium(compendium, compendiumScene._id, scene, { keepId: true });
            logger.info(`Scene: ${scene.name} folder:`, folder);
            logger.debug("worldScene:", worldScene);
            return worldScene;
          }
        }));

      // logger.debug("finalScenes", scenes);

      const toTimer = setTimeout(() => {
        logger.warn(`Reference update timed out.`);
        ThirdPartyMunch._renderCompleteDialog(`Un-Successful Import of ${packageName}`, { name: packageName });
        this.close();
      }, 120000);

      // clearup remaining scene things
      await ThirdPartyMunch._fixupScenes(scenes);
      clearTimeout(toTimer);

      $(".ddb-overlay").toggleClass("import-invalid");

      ThirdPartyMunch._renderCompleteDialog(`Successful Import of ${packageName}`, { name: packageName });

      // eslint-disable-next-line require-atomic-updates
      CONFIG.DDBI.ADVENTURE.TEMPORARY = {};
      this.close();
    }
  }

  static _updateProgress(total, count, type) {
    const localizedType = `ddb-importer.label.${type}`;
    $(".import-progress-bar")
      .width(`${Math.trunc((count / total) * 100)}%`)
      .html(`<span>${game.i18n.localize("ddb-importer.label.Working")} (${game.i18n.localize(localizedType)})...</span>`);
  }

  static _progressNote(note) {
    $(".import-progress-bar")
      .html(`<span>${game.i18n.localize("ddb-importer.label.Working")} (${note})...</span>`);
  }
}
