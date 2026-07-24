import { logger, FileHelper, MuncherSettings } from "../lib/_module";

interface IExportNotePin {
  index: number;
  pageId: string | null;
  texture: NoteDocument["texture"];
  label: string | undefined;
  flags: { ddb: I5eJournalPageFlags };
  levels: string[];
  iconSize: NoteDocument["iconSize"];
  textColor: NoteDocument["textColor"];
  textAnchor: NoteDocument["textAnchor"];
  x: number;
  y: number;
}

interface IExportNoteGroup {
  label: string | undefined;
  texture: NoteDocument["texture"];
  flags: { ddb: I5eJournalPageFlags | { noLink: boolean } };
  levels: string[];
  index: number;
  iconSize: NoteDocument["iconSize"];
  textColor: NoteDocument["textColor"];
  textAnchor: NoteDocument["textAnchor"];
  positions: { x: number; y: number }[];
}

// unlinked user-placed notes have no journal, so no index to group or sort on
type TExportNoteUnlinked = Omit<IExportNoteGroup, "index">;


/**
 * Extracts all notes that have been placed by ddb-importer
 * Creates the expected data structure for the database by
 * getting the real label from the appropriate Journal Entry
 * @param {Scene} scene The scene to extract the notes from
 * @param {string} bookCode The bookCode to filter the journal entries by
 * @returns {object[]} An array of extracted notes, each containing the keys:
 *  - label: The label of the note
 *  - flags: The flags of the note
 *  - texture: The texture of the note
 *  - positions: An array of positions the note has been placed at
 *  - iconSize: The size of the icon
 *  - iconTint: The tint of the icon
 *  - textColor: The color of the text
 *  - textAnchor: The anchor of the text
 */
function getNotes(scene: Scene, bookCode: string) {
  // get all notes in the Journal related to this scene
  const relatedJournalEntries = game.journal.filter((journal) =>
    !!journal.flags.ddb?.bookCode && journal.flags.ddb.bookCode === bookCode,
  );

  // get all notes placed on the map
  const journalNotes = scene.notes
    // the user might have placed a note, unless it is based on an imported Journal Entry, we will not carry
    // that one over
    .filter((note: NoteDocument) => relatedJournalEntries.some((journal) => journal.id === note.entryId))
    .map((note: NoteDocument): IExportNotePin => {
      const journal = relatedJournalEntries.find((journal) => journal.id === note.entryId);
      // the preceding filter only keeps notes whose entryId matches a related journal
      if (!journal) throw new Error(`No journal entry found for note ${note.id}`);
      const page = note.pageId
        ? journal.pages.find((page: JournalEntryPage) => page._id === note.pageId)
        : journal;
      if (!page) throw new Error(`No journal page found for note ${note.id} (pageId ${note.pageId})`);
      const index = parseInt(journal.flags.ddb?.ddbId ?? "");
      // removed un-needed userdata
      const pageFlags = page.flags.ddb;
      const noteFlags = note.flags.ddb;
      const flags: I5eJournalPageFlags = foundry.utils.duplicate(pageFlags);
      foundry.utils.mergeObject(flags, noteFlags, { overwrite: true, insertKeys: true, insertValues: true });
      if (flags?.userData) delete flags.userData;
      const label = flags?.labelName && flags.labelName.trim() !== ""
        ? flags.labelName
        : noteFlags?.slugLink && noteFlags.slugLink.trim() !== ""
          ? note.text
          : page.name;

      logger.warn("note details", {
        note,
        page,
        icon: note.texture.src,
        journal,
        flags,
        pageFlags,
        noteFlags,
        label,
      });

      return {
        index,
        pageId: page._id,
        texture: note.texture,
        label,
        flags: {
          ddb: flags,
        },
        levels: Array.from(note.levels ?? []),
        iconSize: note.iconSize,
        textColor: note.textColor,
        textAnchor: note.textAnchor,
        x: note.x,
        y: note.y,
      };
    })
    .reduce((notes: (IExportNoteGroup & { pageId?: string | null })[], note: IExportNotePin) => {
      const idx = notes.find((n) => n.index === note.index && n.pageId === note.pageId && note.label === n.label);
      if (idx) {
        idx.positions.push({ x: note.x, y: note.y });
      } else {
        const n = {
          label: note.label,
          texture: note.texture,
          flags: note.flags,
          levels: note.levels,
          index: note.index,
          iconSize: note.iconSize,
          textColor: note.textColor,
          textAnchor: note.textAnchor,
          positions: [{ x: note.x, y: note.y }],
        };
        notes.push(n);
      }
      return notes;
    }, [])
    .sort((a: IExportNoteGroup, b: IExportNoteGroup) => {
      return a.index - b.index;
    });

  const unLinkedNotes: TExportNoteUnlinked[] = scene.notes
    .filter((note: NoteDocument) => !note.entryId)
    .map((note: NoteDocument): TExportNoteUnlinked => ({
      label: note.text,
      texture: note.texture,
      flags: { ddb: {
        noLink: true,
      } },
      levels: Array.from(note.levels ?? []),
      iconSize: note.iconSize,
      textColor: note.textColor,
      textAnchor: note.textAnchor,
      positions: [{ x: note.x, y: note.y }],
    }));

  const notes = [...journalNotes, ...unLinkedNotes]
    .map((note: TExportNoteUnlinked) => ({
      label: note.label,
      flags: note.flags,
      levels: note.levels,
      texture: note.texture,
      positions: note.positions,
      iconSize: note.iconSize,
      textColor: note.textColor,
      textAnchor: note.textAnchor,
    }));

  return notes;
}

// Prepares the scene data for download
export function collectSceneData(scene: Scene, bookCode: string) {
  const notes = getNotes(scene, bookCode);

  // Export levels from scene, stripping background.src from each
  const levels = scene.levels.map((level) => {
    const l = level.toObject();
    delete l.background?.src;
    return l;
  });

  const walls = scene.walls.map((wall: WallDocument) => {
    const { _id, ...w } = wall.toObject();
    return w;
  });

  const lights = scene.lights.map((light: AmbientLightDocument) => {
    const { _id, ...l } = light.toObject();
    return l;
  });

  const fullData = {
    // flags carry arbitrary module keys (stripped against allow-lists on export),
    // so widen beyond the declared scene flag interfaces to allow string indexing
    flags: scene._source.flags as I5eSceneDataFlags & Record<string, unknown>,
    // fvtt-types collapses the schema-derived name to never at this instantiation depth
    name: scene._source.name as string,
    navName: scene._source.navName,
    navOrder: scene._source.navOrder,
    // dimensions
    width: scene._source.width,
    height: scene._source.height,
    shiftX: scene._source.shiftX,
    shiftY: scene._source.shiftY,
    // grid
    grid: scene._source.grid,
    padding: scene._source.padding,
    // initial
    initial: scene._source.initial,
    initialLevel: scene._source.initialLevel,
    // levels
    levels,
    walls,
    drawings: scene._source.drawings,
    weather: scene._source.weather,
    // environment
    tokenVision: scene._source.tokenVision,
    lights,
    regions: scene._source.regions,
    environment: scene._source.environment,
    fog: {
      mode: scene._source.fog.mode,
      colors: scene._source.fog.colors,
    },
    transition: scene._source.transition,
  };

  // these keys are deleted from the export when the "config" option is not
  // selected, so they must be optional on the exported data shape
  type TConfigKey = "navName" | "width" | "height" | "shiftX" | "shiftY" | "grid" | "padding" | "initial"
    | "initialLevel" | "levels" | "weather" | "tokenVision" | "fog" | "environment" | "regions";
  const data: Omit<typeof fullData, TConfigKey> & { [K in TConfigKey]?: (typeof fullData)[K] } = fullData;

  if (!data.flags.ddb) data.flags.ddb = {};
  data.flags.ddb.foundryVersion = game.version;

  if (data.flags.ddb.tokens) delete data.flags.ddb.tokens;
  data.flags.ddb.tokens = scene.tokens
    .filter((token: TokenDocument) => !token.actorLink)
    .map((token: TokenDocument) => {
      const result = {
        _id: token._id,
        name: token.name,
        width: token.width,
        height: token.height,
        x: token.x,
        y: token.y,
        disposition: token.disposition,
        flags: token.flags,
        actorLink: false,
        bar1: { attribute: "attributes.hp" },
        effects: [] as any[],
        elevation: token.elevation,
        level: token.level,
        depth: token.depth,
        hidden: token.hidden,
        actorData: token.delta?.toObject(),
        light: token.light,
      };

      // the token actor flags here help us match up actors using the DDB ID
      const actor = token.actor;
      const ddbFlags = foundry.utils.getProperty(token, "actor.flags.ddbimporter") as Record<string, any>;
      // ddbFlags come from the token actor, so a hit implies the actor exists
      if (ddbFlags && actor) {
        if (ddbFlags.keepAvatar && actor.img) {
          const image = actor.img.split("assets/").pop();
          ddbFlags.avatarImage = `assets/${image}`;
        }
        if (ddbFlags.keepToken && token.texture.src) {
          const image = token.texture.src.split("assets/").pop();
          ddbFlags.tokenImage = `assets/${image}`;
        }
        ddbFlags.name = actor.prototypeToken?.name ? actor.prototypeToken.name : actor.name;
        result.flags.ddbActorFlags = ddbFlags;
      }

      // console.warn("token details", {
      //   token,
      //   result,
      //   scene,
      // });
      if (foundry.utils.hasProperty(token, "token.actorData.flags")) delete (token as Record<string, any>).actorData.flags["token-action-hud-core"];
      // these might exist, we don't have them in our model, we don't want to carry them over, so delete them
      delete (token.flags as Record<string, any>)["token-action-hud-core"];
      delete (token.flags as Record<string, any>)["simbuls-cover-calculator"];
      delete (token.flags as Record<string, any>)["monks-enhanced-journal"];
      delete (token.flags as Record<string, any>)["monks-tokenbar"];
      delete (token.flags as Record<string, any>)["tagger"];
      delete (token.flags as Record<string, any>)["monks-combat-marker"];
      delete (token.flags as Record<string, any>)["image-hover"];
      delete (token.flags as Record<string, any>)["elevation-drag-ruler"];

      return result;
    }) as unknown as I5eTokenData[];


  // removed un-needed userdata
  if (data.flags.ddb?.userData) delete data.flags.ddb.userData;

  // the note shapes carry live document values (e.g. texture.tint as Color)
  // where I5eNoteData declares the serialized string forms
  data.flags.ddb.notes = notes as unknown as I5eNoteData[];
  if (!scene.background.src) {
    throw new Error(`Scene "${scene.name}" has no background image to export`);
  }
  data.flags.ddb.img = `assets/${scene.background.src.split("assets/").pop()}`;
  data.flags.ddb.levelImages = {};
  for (const level of scene.levels) {
    if (level._id && level.background?.src) {
      data.flags.ddb.levelImages[level._id] = `assets/${level.background.src.split("assets/").pop()}`;
    }
  }

  if (!data.flags.ddbimporter) data.flags.ddbimporter = {};
  data.flags.ddbimporter.version = game.modules.get("ddb-importer")?.version;

  return data;
}

function getCompendiumScenes(compendiumCollection: string, selectedId: string | null = null, selectedName: string | null = null) {
  const scenes: any[] = [];
  const compendium = game.packs.find((pack) => pack.collection === compendiumCollection);
  if (compendium) {
    compendium.index.forEach((scene) => {
      const option = {
        _id: scene._id,
        name: scene.name,
        selected: (!!selectedId && selectedId == scene._id)
          || (!!selectedName && !!scene.name && selectedName.trim().includes(scene.name)),
      };
      scenes.push(option);
    });
  }

  return scenes;
}

const ddbFlags = ["ddb", "ddbimporter"];
const allowedFlags = ["stairways", "perfect-vision", "dynamic-illumination"];

export class SceneEnhancerExport extends Application {

  sceneSet: boolean;
  compendiumBookSet: boolean;
  downloadBookSet: boolean;
  scene: any;
  description: string;
  url: string;
  compendium: string;
  compendiumSceneId: string;
  bookCode: string;
  compendiumScenes: { _id: string; name: string; selected: boolean }[];
  compendiums: any[];
  books: { code: string; name: string; selected: boolean }[];
  exportOptionsCompendium: Record<string, boolean>;
  exportOptionsDownload: Record<string, boolean>;
  compendiumDisabled: boolean;
  downloadDisabled: boolean;

  constructor(scene: any) {
    super();
    this.sceneSet = false;
    this.compendiumBookSet = false;
    this.downloadBookSet = false;

    this.scene = scene;
    const sceneExportFlags = this.scene.flags.ddbimporter?.export;
    const lastCompendium = localStorage.getItem("ddb-last-compendium");
    const lastBook = localStorage.getItem("ddb-last-book");

    this.description = sceneExportFlags?.description || "";
    this.url = sceneExportFlags?.url || "";
    this.compendium = sceneExportFlags?.compendium ?? lastCompendium;
    this.compendiumSceneId = sceneExportFlags?.scene;
    this.bookCode = this.scene.flags?.ddb?.bookCode.toLowerCase() ?? lastBook;
    this.compendiumScenes = this.compendium ? getCompendiumScenes(this.compendium, this.compendiumSceneId, this.scene.name) : [];

    if (this.compendiumScenes && this.compendiumScenes.some((s) => s.selected === true)) this.sceneSet = true;

    this.compendiums = game.packs
      .filter((pack) => pack.metadata?.type === "Scene")
      .map((pack) => {
        if (this.compendium && this.compendium === pack.collection) (pack as { selected?: boolean }).selected = true;
        else (pack as { selected?: boolean }).selected = false;
        return pack;
      })
      .sort((a, b) => (a.metadata.label as string).localeCompare(b.metadata.label as string));

    const selectedBooks = this.bookCode
      ? CONFIG.DDB.sources.filter((s) => s.name.toLowerCase() === this.bookCode).map((s) => s.id)
      : [];
    this.books = MuncherSettings.getSourcesLookups(selectedBooks).map((b) => {
      if (b.selected) {
        this.compendiumBookSet = true;
        this.downloadBookSet = true;
      }
      return {
        code: b.acronym.toLowerCase(),
        name: b.label,
        selected: b.selected,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    this.exportOptionsCompendium = {
      actors: sceneExportFlags?.actors !== undefined ? sceneExportFlags.actors : true,
      notes: sceneExportFlags?.notes !== undefined ? sceneExportFlags.notes : true,
      lights: sceneExportFlags?.lights !== undefined ? sceneExportFlags.lights : false,
      walls: sceneExportFlags?.walls !== undefined ? sceneExportFlags.walls : false,
      drawings: sceneExportFlags?.drawings !== undefined ? sceneExportFlags.drawings : false,
      config: sceneExportFlags?.config !== undefined ? sceneExportFlags.config : false,
    };
    this.exportOptionsDownload = {
      actors: sceneExportFlags?.actors !== undefined ? sceneExportFlags.actors : true,
      notes: sceneExportFlags?.notes !== undefined ? sceneExportFlags.notes : true,
      lights: sceneExportFlags?.lights !== undefined ? sceneExportFlags.lights : true,
      walls: sceneExportFlags?.walls !== undefined ? sceneExportFlags.walls : true,
      drawings: sceneExportFlags?.drawings !== undefined ? sceneExportFlags.drawings : true,
      config: sceneExportFlags?.config !== undefined ? sceneExportFlags.config : true,
    };
    this.compendiumDisabled = !this.sceneSet || !this.compendiumBookSet;
    this.downloadDisabled = !this.downloadBookSet || this.url === "" || !this.url.startsWith("http");
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.baseApplication = "SceneEnhancerExport";
    options.id = "ddb-importer-scene-enhancer";
    options.template = "modules/ddb-importer/handlebars/enhance-export.hbs";
    options.width = 500;
    options.resizable = false;
    options.height = "auto";
    options.classes = ["ddb-muncher", "sheet"];
    options.tabs = [{ navSelector: ".tabs", contentSelector: "div", initial: "compendium" }];
    return options;
  }

  get title() {
    return `DDB Importer Scene Enhancer Exporter: ${this.scene.name}`;
  }

  /** @override */
  getData() {
    const templateData = {
      sceneName: this.scene.name,
      compendiums: this.compendiums,
      compendiumScenes: this.compendiumScenes,
      description: this.description,
      books: this.books,
      url: this.url,
      exportOptionsCompendium: this.exportOptionsCompendium,
      exportOptionsDownload: this.exportOptionsDownload,
      compendiumDisabled: this.compendiumDisabled,
      downloadDisabled: this.downloadDisabled,
    };

    return templateData;
  }

  checkState() {
    if (this.sceneSet && this.compendiumBookSet) {
      this.compendiumDisabled = false;
      $("#compendium-button").prop("disabled", false);
    } else {
      $("#compendium-button").prop("disabled", true);
    }
    if (this.downloadBookSet && this.url !== "" && this.url.startsWith("http")) {
      this.downloadDisabled = false;
      $("#download-button").prop("disabled", false);
    } else {
      $("#download-button").prop("disabled", true);
    }
  }

  activateListeners(html: JQuery<HTMLElement>) {
    super.activateListeners(html);
    $("#ddb-importer-scene-enhancer").css("height", "auto");

    html.find("#compendium-form").submit(async (event: any) => {
      const form = document.querySelector<HTMLFormElement>("#compendium-form");
      if (!form) return;
      const data = Object.fromEntries(new FormData(form).entries());
      this.buttonClick(event, data);
    });

    html.find("#download-form").submit(async (event: any) => {
      const form = document.querySelector<HTMLFormElement>("#download-form");
      if (!form) return;
      const data = Object.fromEntries(new FormData(form).entries());
      this.buttonClick(event, data);
    });

    html.find("#select-compendium").on("change", async () => {
      const compendiumSelection = html.find("#select-compendium");

      // get selected campaign from html selection
      const compendiumCollection = (compendiumSelection[0] as HTMLSelectElement).selectedOptions[0]
        ? (compendiumSelection[0] as HTMLSelectElement).selectedOptions[0].value
        : undefined;

      let sceneList = "";

      if (compendiumCollection && compendiumCollection !== "") {
        const scenes = getCompendiumScenes(compendiumCollection);
        sceneList = `<option value="">Select...</option>`;
        scenes.forEach((scene) => {
          const selected = scene.selected ? " selected" : "";
          sceneList += `<option value="${scene._id}"${selected}>${scene.name}</option>`;
        });
      }
      const sceneSelection = html.find("#select-scene");
      sceneSelection[0].innerHTML = sceneList;
    });

    html.find("#select-scene").on("change", async () => {
      const sceneSelection = html.find("#select-scene");
      const scene = (sceneSelection[0] as HTMLSelectElement).selectedOptions[0]
        ? (sceneSelection[0] as HTMLSelectElement).selectedOptions[0].value
        : undefined;
      this.sceneSet = !!scene && scene !== "";
      this.checkState();
    });

    html.find("#select-book-compendium").on("change", async () => {
      const bookSelection = html.find("#select-book-compendium");
      const book = (bookSelection[0] as HTMLSelectElement).selectedOptions[0]
        ? (bookSelection[0] as HTMLSelectElement).selectedOptions[0].value
        : undefined;
      this.compendiumBookSet = !!book && book !== "";
      this.checkState();
    });

    html.find("#select-book-download").on("change", async () => {
      const bookSelection = html.find("#select-book-download");
      const book = (bookSelection[0] as HTMLSelectElement).selectedOptions[0]
        ? (bookSelection[0] as HTMLSelectElement).selectedOptions[0].value
        : undefined;
      this.downloadBookSet = !!book && book !== "";
      this.checkState();
    });

    html.find("#download-url").on("change", async () => {
      const bookSelection = html.find("#download-url");
      const url = (bookSelection[0] as HTMLInputElement).value;
      if (url && url !== "" && url.startsWith("http")) {
        this.url = url;
      }
      this.checkState();
    });

  }


  async buttonClick(event: any, formData: any) {
    event.preventDefault();

    const sceneFlags = foundry.utils.duplicate(this.scene.flags);

    if (!sceneFlags.ddb) sceneFlags.ddb = {};
    if (!sceneFlags.ddbimporter) sceneFlags.ddbimporter = {};
    if (!sceneFlags.ddbimporter.export) sceneFlags.ddbimporter.export = {};

    sceneFlags.ddb["bookCode"] = formData["select-book"];
    localStorage.setItem("ddb-last-book", formData["select-book"]);
    sceneFlags.ddbimporter.export["description"] = formData["description"];
    sceneFlags.ddbimporter.export["actors"] = formData["export-actors"] == "on";
    sceneFlags.ddbimporter.export["notes"] = formData["export-notes"] == "on";
    sceneFlags.ddbimporter.export["lights"] = formData["export-lights"] == "on";
    sceneFlags.ddbimporter.export["walls"] = formData["export-walls"] == "on";
    sceneFlags.ddbimporter.export["drawings"] = formData["export-drawings"] == "on";
    sceneFlags.ddbimporter.export["config"] = formData["export-config"] == "on";

    if (formData["download-url"]) {
      sceneFlags.ddbimporter.export["url"] = formData["download-url"];
    } else {
      sceneFlags.ddbimporter.export["compendium"] = formData["select-compendium"];
      localStorage.setItem("ddb-last-compendium", formData["select-compendium"]);
      sceneFlags.ddbimporter.export["scene"] = formData["select-scene"];
    }

    await this.scene.update({ flags: sceneFlags });

    const sceneData = collectSceneData(this.scene, formData["select-book"]);

    Object.keys(sceneData.flags).forEach((flag) => {
      if (!allowedFlags.includes(flag) && !ddbFlags.includes(flag)) delete sceneData.flags[flag];
    });

    if (formData["export-actors"] !== "on") delete sceneData.flags.ddb?.tokens;
    if (formData["export-notes"] !== "on") delete sceneData.flags.ddb?.notes;
    if (formData["export-lights"] !== "on") delete sceneData.lights;
    if (formData["export-walls"] !== "on") delete sceneData.walls;
    if (formData["export-drawings"] !== "on") delete sceneData.drawings;
    if (formData["export-config"] !== "on") {
      delete sceneData.navName;
      delete sceneData.width;
      delete sceneData.height;
      delete sceneData.shiftX;
      delete sceneData.shiftY;
      delete sceneData.grid;
      delete sceneData.padding;
      delete sceneData.initial;
      delete sceneData.initialLevel;
      delete sceneData.levels;
      delete sceneData.weather;
      delete sceneData.tokenVision;
      delete sceneData.fog;
      delete sceneData.environment;
      delete sceneData.regions;
      Object.keys(sceneData.flags).forEach((flag) => {
        if (!ddbFlags.includes(flag)) delete sceneData.flags[flag];
      });
    }

    logger.debug(sceneData);
    const name = sceneData.name.replace(/[^a-z0-9_-]/gi, "").toLowerCase();
    const sceneRef = `ddb-enhanced-scene-${name}`;
    FileHelper.download(JSON.stringify(sceneData, null, 4), `${sceneRef}.json`, "application/json");

    this.close();
  }
}

