import AdventureMunchHelpers from "./AdventureMunchHelpers";
import { logger, utils, Iconizer, DDBSources, fetchJson } from "../../lib/_module";
import { generateAdventureConfig } from "../adventure";
import AdventureMunch from "./AdventureMunch";
import { PageFinder } from "./PageFinder";
import MonsterReplacer from "../../apps/MonsterReplacer";

const MR_PRIMATES_THIRD_PARTY_REPO = "MrPrimate/ddb-third-party-scenes";
const RAW_BASE_URL = `https://raw.githubusercontent.com/${MR_PRIMATES_THIRD_PARTY_REPO}`;
const RAW_MODULES_URL = `${RAW_BASE_URL}/main/modules.json`;

interface IThirdPartyRepoData {
  packages: Record<string, {
    module: string;
    description: string;
    books: string[];
    released?: boolean;
    name?: string;
  }>;
}

export default class ThirdPartyMunch extends FormApplication {

  // FormApplication's abstract member; this application never submits a form,
  // so no runtime implementation exists (type-only declaration)
  declare protected _updateObject: (event: Event, formData?: object) => Promise<unknown>;

  _itemsToRevisit: string[];
  _adventure: Record<string, unknown>;
  _scenePackage: { scenes?: I5eSceneData[]; folder?: string };
  _packageName: string;
  _description: string;
  _pageFinders: Record<string, PageFinder>;
  adventureMunch: AdventureMunch;
  monstersToReplace: IMonsterReplacerData[];
  _defaultRepoData: IThirdPartyRepoData;
  folderNames: string[];

  static pattern: RegExp;

  static altpattern: RegExp;

  /** @override */
  constructor(object = {}, options = {}) {
    super(object, options);
    this._itemsToRevisit = [];
    this._adventure = {};
    this._scenePackage = {};
    this._packageName = "";
    this._description = "";
    this._pageFinders = {};
    this.adventureMunch = new AdventureMunch();
    this.monstersToReplace = [];
  }

  async _updateMonsterData() {
    if (!this.adventureMunch.use2024monsters) return;

    const allTokens = (this._scenePackage.scenes ?? [])
      .flatMap((scene) => scene.flags?.ddb?.tokens ?? [])
      .filter((token) => token.flags?.ddbActorFlags?.id);
    const ids = Array.from(new Set(allTokens
      .map((t) => t.flags.ddbActorFlags?.id)
      .filter((id): id is number => Boolean(id))));
    if (ids.length === 0) return;

    const monsterData = await MonsterReplacer.fetchUpdatedMonsterInfo(ids);
    logger.debug("Third Party Updated Monster Data", monsterData);
    if (monsterData.length === 0) return;

    const monsterReplacer = new MonsterReplacer({ name: this._packageName });
    const monstersToReplace = await monsterReplacer.chooseMonstersToReplace(monsterData);
    logger.debug("Third Party Monsters to Replace", monstersToReplace);
    if (monstersToReplace.length === 0) return;

    this.monstersToReplace = monsterData.filter((m) => monstersToReplace.includes(m.id2014));
    this.adventureMunch.monstersToReplace = this.monstersToReplace;

    for (const scene of this._scenePackage.scenes ?? []) {
      if (!scene.flags?.ddb?.tokens) continue;
      for (const token of scene.flags.ddb.tokens) {
        const ddbActorFlags = token.flags?.ddbActorFlags;
        const ddbId = ddbActorFlags?.id;
        const match = this.monstersToReplace.find((m) => m.id2014 === ddbId);
        if (!match || !ddbActorFlags) continue;
        const originalName = ddbActorFlags.name;
        ddbActorFlags.id = match.id2024;
        if (originalName === match.name2014) {
          token.name = match.name2024;
        }
        ddbActorFlags.name = match.name2024;
      }
    }
  }

  /** @override */
  static get defaultOptions() {
    this.pattern = /(@[a-z]*)(\[)([a-z0-9]*|[a-z0-9.]*)(\])(\{)(.*?)(\})/gmi;
    this.altpattern = /((data-entity)=\\?["']?([a-zA-Z]*)\\?["']?|(data-pack)=\\?["']?([[\S.]*)\\?["']?) data-id=\\?["']?([a-zA-Z0-9]*)\\?["']?.*?>(.*?)<\/a>/gmi;

    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ddb-adventure-import",
      classes: ["ddb-adventure-import"],
      title: "Third Party Munch",
      template: "modules/ddb-importer/handlebars/adventure/import-third.hbs",
      width: 400,
      height: "auto",
    });
  }

  /** @override */

  async getData() {
    let data;
    let packages: any[] = [];

    try {
      data = await $.getJSON(RAW_MODULES_URL);
      this._defaultRepoData = data;
      for (const [key, value] of Object.entries(data.packages)) {
        logger.debug(`${key}: ${value}`);
        packages.push(value);
      }
      const partialScenes = utils.getSetting<boolean>("third-party-scenes-partial");
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
      cssClass: "ddb-importer-third-party-window",
    };

  }

  /** @override */
  activateListeners(html: JQuery<HTMLElement>) {
    super.activateListeners(html);

    html.find(".dialog-button").on("click", this._dialogButton.bind(this));
    html.find("#select-package").on("change", this._selectPackage.bind(this, null, html));
  }

  async _selectPackage(_event: any, html: JQuery<HTMLElement>) {
    const packageSelectionElement = html.find("#select-package");

    // get selected campaign from html selection
    const packageSelection = (packageSelectionElement[0] as HTMLSelectElement).selectedOptions[0]
      ? (packageSelectionElement[0] as HTMLSelectElement).selectedOptions[0].value
      : undefined;

    const moduleMessage = html.find("#ddb-message");

    if (packageSelection) {
      const missingModules = [this._defaultRepoData.packages[packageSelection].module].filter((module) => {
        return !game.modules.get(module)?.active;
      });

      this._packageName = (packageSelectionElement[0] as HTMLSelectElement).selectedOptions[0].text;
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
        const bookString = missingBooks.map((bookCode) => DDBSources.getBookName(bookCode)).join(", ");
        message += `<p>You need to use Adventure Muncher to load the following books first: ${bookString}</p>`;
      }

      if (this._description && (this as ThirdPartyMunch & { description?: string }).description !== "") {
        message += `<p><b>Details</b>: ${this._description}</p>`;
      }

      if (message !== "") {
        moduleMessage[0].innerHTML = message;
        $(".ddb-message").removeClass("import-hidden");
      }

      if (missingBooks.length === 0 && missingModules.length === 0) {
        $(".dialog-button").prop("disabled", false);
      }

    } else {
      moduleMessage[0].innerHTML = "";
      $(".ddb-message").addClass("import-hidden");
    }
    $("#ddb-adventure-import").css("height", "auto");
  }

  async _createFolders(adventure: IDDBAdventure, folders: any[]) {
    if (folders) {
      CONFIG.DDBI.ADVENTURE.TEMPORARY.folders["null"] = null;
      CONFIG.DDBI.ADVENTURE.TEMPORARY.lookups = null;

      // the folder list could be out of order, we need to create all folders with parent null first
      const firstLevelFolders = folders.filter((folder) => folder.parent === null);
      // n.b. importFolder only takes (folders, folderList); the extra args predate that signature
      await (this.adventureMunch.importFolder as (folders: any[], folderList?: unknown, extra?: unknown) => Promise<void>)(
        firstLevelFolders, adventure, folders,
      );
    }
  }

  async _checkForMissingData(adventure: IDDBAdventure, folders: any) {
    await this._createFolders(adventure, folders);

    if (adventure.required?.spells && adventure.required.spells.length > 0) {
      logger.debug(`${adventure.name} - spells required`, adventure.required.spells);
      ThirdPartyMunch._progressNote(`Checking for missing spells from DDB`);
      await AdventureMunchHelpers.checkForMissingDocuments("spell", adventure.required.spells);
    }
    if (adventure.required?.items && adventure.required.items.length > 0) {
      logger.debug(`${adventure.name} - items required`, adventure.required.items);
      ThirdPartyMunch._progressNote(`Checking for missing items from DDB`);
      await AdventureMunchHelpers.checkForMissingDocuments("item", adventure.required.items);
    }
    if (adventure.required?.monsters && adventure.required.monsters.length > 0) {
      logger.debug(`${adventure.name} - monsters required`, adventure.required.monsters);
      ThirdPartyMunch._progressNote(`Checking for missing monsters from DDB`);
      await AdventureMunchHelpers.checkForMissingDocuments("monster", adventure.required.monsters);
    }
  }

  static _renderCompleteDialog(title: string, adventure: IDDBAdventure) {
    foundry.applications.api.DialogV2.prompt({
      window: { title },
      content: `<h1>${adventure.name}</h1>`,
      ok: { label: "OK" },
      classes: ["adventure-import-export"],
    });
  }

  static async _fixupScenes(scenes: I5eSceneData[]) {
    try {
      if (scenes.length > 0) {
        const totalCount = scenes.length;
        let currentCount = 0;

        await utils.asyncForEach(scenes, async (obj) => {
          try {
            const updatedData = {};
            switch (obj.documentName) {
              case "Scene": {
                // In 0.8.x the thumbs don't seem to be auto generated anymore
                // This code would embed the thumbnail.
                // Remove once/if resolved
                if (!obj.thumb) {
                  const thumbData = await obj.createThumbnail();
                  foundry.utils.setProperty(updatedData, "thumb", thumbData.thumb);
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

      logger.warn(`Error during reference update for object on scenes update`, err);
    }
  }

  static async _createFolder(label: string, type: string) {
    const folderData = {
      "name": label,
      "type": type,
      "parent": null as string | null,
      "sorting": "m",
    };
    const newFolder = await Folder.create(folderData as unknown as Folder.CreateInput) as unknown as Folder.Implementation;
    logger.debug(`Created new folder ${newFolder._id} with data:`, folderData, newFolder);
    return newFolder;
  }

  static async _findFolder(label: string, type: string): Promise<Folder.Implementation> {
    const folder = game.folders.find((f) =>
      f.type === type
      && (f as unknown as { parentFolder?: unknown }).parentFolder === undefined
      && f.name === label,
    );

    return (folder ? folder : ThirdPartyMunch._createFolder(label, type)) as unknown as Folder.Implementation;
  }

  static _generateMockAdventure(scene: I5eSceneData): IDDBAdventure {
    const monsters = scene.flags?.ddbimporter?.export?.actors && scene.flags?.ddb?.tokens
      ? scene.flags.ddb.tokens
        .filter((token) => token.flags?.ddbActorFlags?.id)
        .map((token) => String(token.flags.ddbActorFlags?.id))
      : [];
    return {
      id: foundry.utils.randomID(),
      name: DDBSources.getBookName(scene.flags?.ddb?.bookCode ?? ""),
      description: "",
      system: "dnd5e",
      modules: [] as any[],
      version: "2.5",
      options: {
        folders: true,
      },
      folderColour: "FF0000",
      required: {
        monsterData: [],
        monsters,
        items: [],
        spells: [],
        vehicles: [],
        skills: [],
        senses: [],
        conditions: [],
        actions: [],
        weaponproperties: [],
      },
    };
  }

  static _generateActorId(token: I5eTokenData) {
    if (!foundry.utils.hasProperty(token, "flags.ddbActorFlags.id")) logger.warn("Token does not link to DDB Actor", token);
    const ddbId = token.flags.ddbActorFlags?.id;
    const folderId = token.flags.actorFolderId;
    const key = `${ddbId}-${folderId}`;
    if (CONFIG.DDBI.ADVENTURE.TEMPORARY.mockActors[key]) {
      return CONFIG.DDBI.ADVENTURE.TEMPORARY.mockActors[key];
    } else {
      const existingActor = game.actors.find((actor) =>
        actor.folder?.id == folderId
        && foundry.utils.hasProperty(actor, "flags.ddbimporter.id")
        && actor.flags.ddbimporter.id == ddbId,
      );
      const actorId = existingActor ? existingActor.id : foundry.utils.randomID();
      CONFIG.DDBI.ADVENTURE.TEMPORARY.mockActors[key] = actorId;
      return actorId;
    }
  }

  async _linkSceneTokens(scene: I5eSceneData) {
    const sceneTokens = scene.tokens ?? [];
    logger.info(`Linking ${scene.name}, ${sceneTokens.length} tokens`);
    const tokens = await Promise.all(sceneTokens.map(async (token: any) => {
      if (token.actorId) {
        const worldActor = game.actors.get(token.actorId) as Actor.Known;
        if (worldActor) {
          // we merge the override data provided by the token to the actor to get
          // world specific things like img paths and scales etc
          const sceneToken = scene.flags?.ddb?.tokens?.find((t) => t._id === token._id);
          if (!sceneToken) {
            logger.warn(`Unable to find matching ddb token ${token._id} for scene ${scene.name}`, { token, scene });
            return token;
          }
          delete (sceneToken as any).scale;

          const newToken = await this.adventureMunch._getTokenUpdateData(worldActor, sceneToken);
          return newToken;
        }
      }
      return token;
    }));
    return tokens;
  }

  // this needs reworking as the note data on the thord party scenes is not quite like the data on  the ddb adv muncher scenees
  // see the third party config export
  async _linkSceneNotes(scene: I5eSceneData, adventure: IDDBAdventure) {
    const journalNotes = game.journal.filter((journal) => journal?.flags?.ddb?.bookCode === scene.flags?.ddb?.bookCode);
    this.adventureMunch.adventure = foundry.utils.deepClone(adventure);

    const noJournalPinNotes = utils.getSetting<boolean>("third-party-scenes-notes-merged");

    const notes = await Promise.all([scene]
      .map((scene) => scene.flags?.ddb?.notes ?? [])
      .flat()
      .map(async (note) => {
        const noteFlags = note.flags;
        const noteDdbFlags = noteFlags?.ddb;
        if (!noteFlags || !noteDdbFlags) {
          logger.warn(`Note on scene ${scene.name} is missing ddb flags, unable to link`, { note, scene });
          return note;
        }
        const noteJournal = noJournalPinNotes
          ? journalNotes.find((journal) => journal.flags.ddb?.cobaltId == noteDdbFlags.parentId)
          : journalNotes.find((journal) => {
            const journalDdbFlags = journal.flags.ddb;
            const contentChunkIdMatch = noteDdbFlags.contentChunkId
              ? journalDdbFlags
                && journalDdbFlags.contentChunkId == noteDdbFlags.contentChunkId
              : false;

            const noContentChunk = !noteDdbFlags.contentChunkId
              && noteDdbFlags.originalLink && noteDdbFlags.ddbId && noteDdbFlags.parentId
              && noteDdbFlags.slug && noteDdbFlags.linkName;
            const originMatch = noContentChunk && journalDdbFlags
              ? journalDdbFlags.slug == noteDdbFlags.slug
                && journalDdbFlags.ddbId == noteFlags.ddbId
                && journalDdbFlags.parentId == noteDdbFlags.parentId
                && journalDdbFlags.cobaltId == noteDdbFlags.cobaltId
                && journalDdbFlags.originalLink == noteDdbFlags.originalLink
                && journalDdbFlags.linkName == noteDdbFlags.linkName
              : false;
            const journalNameMatch = !contentChunkIdMatch && !originMatch
              ? (journal.name as string).trim() == ((note as any).label ?? note.text).trim() // ||
              //  journal.pages.some((page) => page.name.trim() === note.label.trim())
              : false;
            return Boolean(contentChunkIdMatch || originMatch || journalNameMatch);

          });

        if (noteJournal) {
          logger.info(`Found note "${(note as any).label ?? note.text}" matched to Journal with ID "${noteJournal.id}" (${noteJournal.name})`);
          noteDdbFlags.journalId = noteJournal.id;
          (note as any).icon = await Iconizer.generateIcon(this.adventureMunch.adventure.name, (note as any).label ?? note.text);
          if (noJournalPinNotes) {
            noteDdbFlags.labelName = `${(note as any).label ?? note.text}`;
            noteDdbFlags.slugLink = (note as any).label ?? (note.text ?? "").replace(/[^\w\d]+/g, "").replace(/^([a-zA-Z]?)0+/, "$1");
            noteFlags.anchor = {
              slug: noteDdbFlags.slugLink,
            };
            note.text = (note as any).label ?? note.text;

            if (!this._pageFinders[noteJournal._id]) {
              this._pageFinders[noteJournal._id] = new PageFinder(noteJournal);
            }
            const contentChunkIdPageId = foundry.utils.hasProperty(note, "flags.ddb.contentChunkId")
              ? this._pageFinders[noteJournal._id].getPageIdForContentChunkId(noteDdbFlags.contentChunkId as string)
              : undefined;
            const slugLinkPageId = foundry.utils.hasProperty(note, "flags.ddb.slugLink")
              ? this._pageFinders[noteJournal._id].getPageIdForElementId(noteDdbFlags.slugLink as string)
              : undefined;

            // console.warn("MATCHES", { slugLinkPageId, contentChunkIdPageId, noteFlags: note.flags.ddb });
            // console.warn("PageIds", noteJournal.pages.map((p) => {return {id: p._id, flags: p.flags.ddb}}));
            const journalPage = noteJournal.pages.find((pageDoc: unknown) => {
              // pages is typed differently between the base and strict configs; the ddb flag
              // shape is importer data, so view the page structurally for the match checks
              const page = pageDoc as { _id?: string | null; flags?: I5eNoteFlags };
              const pageDdbFlags = page.flags?.ddb;
              if (!pageDdbFlags) return false;
              const pageSlug = pageDdbFlags.slug;
              const noteSlug = noteDdbFlags.slug;
              const slugMatch = pageSlug == noteSlug
                || (pageSlug != null && pageSlug.replace(/^([a-zA-Z]?)0+/, "$1") == noteSlug)
                || (pageSlug != null && noteSlug != null && pageSlug.startsWith(noteSlug))
                || (pageSlug != null && noteSlug != null && noteSlug.startsWith(pageSlug));
              return pageDdbFlags.parentId == noteDdbFlags.parentId
                && slugMatch
                && (page._id === contentChunkIdPageId || page._id === slugLinkPageId);
            });

            if (journalPage) {
              note.pageId = journalPage._id;
            }
          }
        }
        return note;
      }));

    const positionedNotes: any[] = [];
    notes.forEach((note) => {
      const noteDdbFlags = note.flags?.ddb;
      if (noteDdbFlags?.journalId) {
        (note as any).positions.forEach((position: any) => {
          logger.info(`Matching ${(note as any).label ?? note.text} to position ${position.x}/${position.y}`);
          const noteId = foundry.utils.randomID();
          const n = {
            "_id": noteId,
            "flags": {
              "ddb": noteDdbFlags,
              "importid": noteId,
              "anchor": note.flags?.anchor ?? {},
            },
            "entryId": noteDdbFlags.journalId,
            "x": position.x,
            "y": position.y,
            "texture": {
              "src": (note as any).icon, // "assets/icons/1.svg",
            },
            "iconSize": note.iconSize ? note.iconSize : 40,
            "text": note.text ? note.text : "",
            "fontFamily": note.fontFamily ? note.fontFamily : "Signika",
            "fontSize": note.fontSize ? note.fontSize : 48,
            "textAnchor": 1,
            "textColor": note.textColor ? note.textColor : "",
            "pageId": note.pageId ? note.pageId : undefined,
          };
          positionedNotes.push(n);
        });
      }
    });

    return positionedNotes;
  }

  async _getAdjustedScenes() {
    const adjustedScenes = (this._scenePackage.scenes ?? [])
      .filter((scene) => scene.flags?.ddbimporter?.export?.actors && scene.flags?.ddb?.tokens);

    await utils.asyncForEach(adjustedScenes, async(scene: I5eSceneData) => {
      logger.debug(`Adjusting scene ${scene.name}`);
      const mockAdventure = ThirdPartyMunch._generateMockAdventure(scene);
      if (scene.flags?.ddbimporter?.export?.actors && scene.flags?.ddb?.tokens) {
        await this._checkForMissingData(mockAdventure, []);
        const bookName = DDBSources.getBookName(scene.flags.ddb.bookCode ?? "");
        const actorFolder = await ThirdPartyMunch._findFolder(bookName, "Actor");
        scene.tokens = scene.flags.ddb.tokens.map((token: any) => {
          token.flags.actorFolderId = actorFolder.id;
          token.actorId = ThirdPartyMunch._generateActorId(token);
          if (foundry.utils.hasProperty(token, "actorData")) {
            foundry.utils.setProperty(token, "delta", foundry.utils.deepClone(token.actorData));
            delete token.actorData;
          }
          return token;
        });

      }
      scene.notes = await this._linkSceneNotes(scene, mockAdventure);
      logger.debug(`Finished scene adjustment for ${scene.name}`);
    });

    return adjustedScenes;
  }

  async _getScene(scene: I5eSceneData): Promise<Scene> {
    const compendiumId = scene.flags?.ddbimporter?.export?.compendium;
    const compendium = compendiumId ? game.packs.get(compendiumId) : undefined;
    if (!compendium) {
      logger.warn(`Unable to find compendium for scene ${scene.name}`, { scene, compendiumId });
      throw new Error(`Unable to find compendium for scene ${scene.name}`);
    }
    const folderName = this._scenePackage.folder ? this._scenePackage.folder : compendium.metadata.label;
    const folder = await ThirdPartyMunch._findFolder(folderName, "Scene");
    const compendiumScene = compendium.index.find((s) => s.name === scene.name);

    const existingScene = game.scenes.find((s) =>
      s.name === scene.name
      && (s.folder?.id === folder.id || (s.folder?.ancestors?.some((f) => f.id === folder.id) ?? false)),
    );

    logger.debug("Third Party Scene Processing", {
      existingScene,
      scene,
      folder,
      folderName,
      compendiumScene,
    });

    // if scene already exists, update
    if (existingScene) {
      logger.info(`Updating ${scene.name}`);
      logger.debug(`${scene.name}update data`, { scene, existingScene });
      await existingScene.update(scene as any);
      return existingScene;
    } else {
      if (!compendiumScene) {
        logger.warn(`Unable to find compendium scene matching ${scene.name}`, { scene, compendium });
        throw new Error(`Unable to find compendium scene matching ${scene.name}`);
      }
      scene.folder = folder.id ?? undefined;
      const worldScene = await game.scenes.importFromCompendium(compendium as unknown as CompendiumCollection<"Scene">, compendiumScene._id, scene as any, { keepId: true });
      logger.info(`Scene: ${scene.name} folder:`, folder);
      logger.debug("worldScene:", worldScene);
      return worldScene;
    }
  }

  async _updateScenes(scenes: I5eSceneData[]) {
    logger.debug("Processing scenes!", scenes);
    const filteredScenes = scenes
      .filter((scene) => scene.flags?.ddbimporter?.export?.compendium)
      // does the scene match a compendium scene
      .filter(async (scene) => {
        const compendiumId = scene.flags?.ddbimporter?.export?.compendium;
        const compendium = compendiumId ? game.packs.get(compendiumId) : undefined;
        const compendiumScene = compendium?.index.find((s) => s.name === scene.name);
        if (compendiumScene) return true;
        else return false;
      });

    const processedScenes: any[] = [];

    await utils.asyncForEach(filteredScenes, async(scene: I5eSceneData) => {
      logger.debug(`Processing scene ${scene.name} with DDB Updates`);
      const tokenUpdates = foundry.utils.duplicate(scene.tokens);
      logger.debug("tokenUpdates", tokenUpdates);
      scene.tokens = [];
      const worldScene = await this._getScene(scene);

      logger.debug("World scene to add tokens to", worldScene);
      const existingTokens = tokenUpdates.filter((t) => worldScene.tokens.some((wT: { _id: string | null }) => t._id === wT._id));
      logger.debug("existingTokens", existingTokens);
      await worldScene.updateEmbeddedDocuments("Token", existingTokens as any, {
        keepId: true,
        keepEmbeddedIds: true,
      } as unknown as TokenDocument.Database.UpdateManyDocumentsOperation);
      const newTokens = tokenUpdates.filter((t) => !worldScene.tokens.some((wT: { _id: string | null }) => t._id === wT._id));
      logger.debug("newTokens", newTokens);
      await worldScene.createEmbeddedDocuments("Token", newTokens as any, { keepId: true, keepEmbeddedIds: true });

      logger.debug(`Finished scene DDB update ${scene.name}`);
    });
    return processedScenes;
  }

  async _dialogButton(event: any) {
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

      this._scenePackage = await fetchJson(packageURL);

      // check for valid json object?

      logger.debug("_scenePackage", this._scenePackage);

      CONFIG.DDBI.ADVENTURE.TEMPORARY = {
        folders: {},
        import: {},
        actors: {},
        sceneTokens: {},
        mockActors: {},
      };

      this.folderNames = this._scenePackage.folder
        ? [this._scenePackage.folder]
        : [...new Set((this._scenePackage.scenes ?? [])
          .flatMap((scene): string[] => {
            const compendiumId = scene.flags?.ddbimporter?.export?.compendium;
            const compendium = compendiumId ? game.packs.get(compendiumId) : undefined;
            return compendium ? [compendium.metadata.label] : [];
          }))];

      // We need to check for potential Scene Folders and Create if missing
      const compendiumLabels = this.folderNames
        .map((label) => {
          return ThirdPartyMunch._findFolder(label, "Scene");
        });

      await Promise.all(compendiumLabels);

      const adventureLabels = [...new Set((this._scenePackage.scenes ?? [])
        .map((scene) => scene.flags?.ddb?.bookCode)
        .filter((bookCode): bookCode is string => Boolean(bookCode))
        .map((bookCode) => {
          return DDBSources.getBookName(bookCode);
        }))]
        .map((label) => {
          return ThirdPartyMunch._findFolder(label, "Actor");
        });
      await Promise.all(adventureLabels);

      logger.debug("Competed folder creation");

      // checks to see if we want to swap legacy monsters for 2024 versions
      await this._updateMonsterData();

      // import any missing monsters into the compendium
      // add tokens to scene
      // add notes to scene
      const adjustedScenes = await this._getAdjustedScenes();

      logger.debug("adjustedScenes", foundry.utils.duplicate(adjustedScenes));

      logger.debug("About to generate Token Actors");
      // load token actors into world
      await utils.asyncForEach(adjustedScenes, async(scene) => {
        logger.debug(`Generating scene actors for ${scene.name}`);
        await this.adventureMunch.generateTokenActors(scene);
        logger.debug(`Finished scene actors for ${scene.name}`);
      });

      // link tokens on scene to imported actors
      const tokenAdjustedScenes = await Promise.all(adjustedScenes
        .map(async (scene) => {
          logger.debug(`Generating scene tokens for ${scene.name}`);
          const newScene = foundry.utils.duplicate(scene) as unknown as I5eSceneData;
          newScene.tokens = await this._linkSceneTokens(scene);
          return newScene;
        }),
      );

      logger.debug("tokenAdjustedScenes", tokenAdjustedScenes);

      CONFIG.DDBI.ADVENTURE.TEMPORARY.lookups = await generateAdventureConfig({ full: true });
      logger.debug("Lookups loaded", CONFIG.DDBI.ADVENTURE.TEMPORARY.lookups.lookups);

      const scenes = await this._updateScenes(tokenAdjustedScenes);
      // logger.debug("finalScenes", scenes);

      const toTimer = setTimeout(() => {
        logger.warn(`Reference update timed out.`);
        ThirdPartyMunch._renderCompleteDialog(`Un-Successful Import of ${packageName}`, { name: packageName } as unknown as IDDBAdventure);
        this.close();
      }, 120000);

      // clearup remaining scene things
      await ThirdPartyMunch._fixupScenes(scenes);
      clearTimeout(toTimer);

      $(".ddb-overlay").toggleClass("import-invalid");

      ThirdPartyMunch._renderCompleteDialog(`Successful Import of ${packageName}`, { name: packageName } as unknown as IDDBAdventure);
      CONFIG.DDBI.ADVENTURE.TEMPORARY = {};
      this.close();
    }
  }

  static _updateProgress(total: number, count: number, type: string) {
    const localizedType = `ddb-importer.label.${type}`;
    $(".import-progress-bar")
      .width(`${Math.trunc((count / total) * 100)}%`)
      .html(`<span>${game.i18n.localize("ddb-importer.label.Working")} (${game.i18n.localize(localizedType)})...</span>`);
  }

  static _progressNote(note: string) {
    $(".import-progress-bar")
      .html(`<span>${game.i18n.localize("ddb-importer.label.Working")} (${note})...</span>`);
  }
}
