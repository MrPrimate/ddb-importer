import DDBSources from "./DDBSources.js";
import logger from "../logger.js";
import FileHelper from "../lib/FileHelper.js";

/**
   * Extracts all notes that have been placed by ddb-importer
   * Creates the expected data structure for the database by
   * getting the real label from the appropriate Journal Entry
   * @param {Scene} scene The scene to extract the notes from
  */
function getNotes(scene, bookCode) {
  // get all notes in the Journal related to this scene
  const relatedJournalEntries = game.journal.filter((journal) =>
    journal.flags.ddb?.bookCode && journal.flags.ddb.bookCode === bookCode
  );

  // get all notes placed on the map
  const journalNotes = scene.notes
    // the user might have placed a note, unless it is based on an imported Journal Entry, we will not carry
    // that one over
    .filter((note) => relatedJournalEntries.some((journal) => journal.id === note.entryId))
    .map((note) => {
      const journal = relatedJournalEntries.find((journal) => journal.id === note.entryId);
      const page = note.pageId
        ? journal.pages.find((page) => page._id === note.pageId)
        : journal;
      const index = parseInt(journal.flags.ddb.ddbId);
      // removed un-needed userdata
      const pageFlags = page.flags.ddb;
      const noteFlags = note.flags.ddb;
      const flags = foundry.utils.duplicate(pageFlags);
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
        iconSize: note.iconSize,
        iconTint: note.iconTint,
        textColor: note.textColor,
        textAnchor: note.textAnchor,
        x: note.x,
        y: note.y,
      };
    })
    .reduce((notes, note) => {
      const idx = notes.find((n) => n.index === note.index && n.pageId === note.pageId && note.label === n.label);
      if (idx) {
        idx.positions.push({ x: note.x, y: note.y });
      } else {
        const n = {
          label: note.label,
          texture: note.texture,
          flags: note.flags,
          index: note.index,
          iconSize: note.iconSize,
          iconTint: note.iconTint,
          textColor: note.textColor,
          textAnchor: note.textAnchor,
          positions: [{ x: note.x, y: note.y }]
        };
        notes.push(n);
      }
      return notes;
    }, [])
    .sort((a, b) => {
      return a.index - b.index;
    });

  const unLinkedNotes = scene.notes
    .filter((note) => !note.entryId)
    .map((note) => ({
      label: note.text,
      texture: note.texture,
      flags: { ddb: {
        noLink: true,
      } },
      iconSize: note.iconSize,
      iconTint: note.iconTint,
      textColor: note.textColor,
      textAnchor: note.textAnchor,
      positions: [{ x: note.x, y: note.y }]
    }));

  const notes = journalNotes.concat(unLinkedNotes)
    .map((note) => ({
      label: note.label,
      flags: note.flags,
      texture: note.texture,
      positions: note.positions,
      iconSize: note.iconSize,
      iconTint: note.iconTint,
      textColor: note.textColor,
      textAnchor: note.textAnchor,
    }));

  return notes;
}

/**
 * Prepares the scene data for download
 * @param {Scene} scene
 */
export function collectSceneData(scene, bookCode) {
  const notes = getNotes(scene, bookCode);

  const data = {
    flags: scene.flags,
    background: foundry.utils.deepClone(scene.background),
    name: scene.name,
    navName: scene.navName,
    // dimensions
    width: scene.width,
    height: scene.height,
    // grid
    grid: scene.grid,
    padding: scene.padding,
    // initial
    initial: scene.initial,
    // customization
    backgroundColor: scene.backgroundColor,
    walls: scene.walls.map((wall) => {
      const w = wall.toObject();
      delete w._id;
      return w;
    }),
    //
    drawings: scene.drawings,
    weather: scene.weather,
    // lights
    darkness: scene.darkness,
    tokenVision: scene.tokenVision,
    globalLight: scene.globalLight,
    globalLightThreshold: scene.globalLightThreshold,
    lights: scene.lights.map((light) => {
      const l = light.toObject();
      delete l._id;
      return l;
    }),
  };

  delete data.background.src;

  if (!data.flags.ddb) data.flags.ddb = {};
  data.flags.ddb.foundryVersion = game.version;

  if (data.flags.ddb.tokens) delete data.flags.ddb.tokens;
  data.flags.ddb.tokens = scene.tokens
    .filter((token) => !token.actorLink)
    .map((token) => {
      let result = {
        _id: token._id,
        name: token.name,
        width: token.width,
        height: token.height,
        scale: token.scale,
        x: token.x,
        y: token.y,
        disposition: token.disposition,
        flags: token.flags,
        actorLink: false,
        bar1: { attribute: "attributes.hp" },
        effects: [],
        elevation: token.elevation,
        hidden: token.hidden,
        tint: token.tint,
        actorData: token.delta.toObject(),
        light: token.light,
      };

      // the token actor flags here help us match up actors using the DDB ID
      if (token.actor) {
        if (token.actor.flags.ddbimporter) {
          result.flags.ddbActorFlags = token.actor.flags.ddbimporter;
          result.flags.ddbActorFlags.name = token.actor.prototypeToken?.name ? token.actor.prototypeToken.name : token.actor.name;
        }
      }
      if (foundry.utils.hasProperty(token, "token.actorData.flags")) delete token.actorData.flags["token-action-hud-core"];
      delete token.flags["token-action-hud-core"];
      delete token.flags["simbuls-cover-calculator"];
      delete token.flags["monks-enhanced-journal"];
      delete token.flags["monks-tokenbar"];
      delete token.flags["tagger"];
      delete token.flags["monks-combat-marker"];
      delete token.flags["image-hover"];
      delete token.flags["elevation-drag-ruler"];

      return result;
    });


  // removed un-needed userdata
  if (data.flags.ddb?.userData) delete data.flags.ddb.userData;

  data.flags.ddb.notes = notes;
  data.flags.ddb.img = `assets/${scene.background.src.split("assets/").pop()}`;

  if (!data.flags.ddbimporter) data.flags.ddbimporter = {};
  data.flags.ddbimporter['version'] = game.modules.get("ddb-importer").version;

  return data;
}

function getCompendiumScenes(compendiumCollection, selectedId = null, selectedName = null) {
  let scenes = [];
  const compendium = game.packs.find((pack) => pack.collection === compendiumCollection);
  if (compendium) {
    compendium.index.forEach((scene) => {
      const option = {
        _id: scene._id,
        name: scene.name,
        selected: (selectedId && selectedId == scene._id) || (selectedName && selectedName.trim().includes(scene.name)),
      };
      scenes.push(option);
    });
  }

  return scenes;
}

const ddbFlags = ["ddb", "ddbimporter"];
const allowedFlags = ["stairways", "perfect-vision", "dynamic-illumination"];

export class SceneEnhancerExport extends Application {

  // eslint-disable-next-line complexity
  constructor(scene) {
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
        if (this.compendium && this.compendium === pack.collection) pack.selected = true;
        else pack.selected = false;
        return pack;
      })
      .sort((a, b) => a.metadata.label.localeCompare(b.metadata.label));

    const selectedBooks = this.bookCode
      ? CONFIG.DDB.sources.filter((s) => s.name.toLowerCase() === this.bookCode).map((s) => s.id)
      : [];
    this.books = DDBSources.getSourcesLookups(selectedBooks).map((b) => {
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
    let templateData = {
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

  activateListeners(html) {
    super.activateListeners(html);
    $("#ddb-importer-scene-enhancer").css("height", "auto");

    html.find('#compendium-form').submit(async (event) => {
      const form = document.querySelector('#compendium-form');
      const data = Object.fromEntries(new FormData(form).entries());
      this.buttonClick(event, data);
    });

    html.find('#download-form').submit(async (event) => {
      const form = document.querySelector('#download-form');
      const data = Object.fromEntries(new FormData(form).entries());
      this.buttonClick(event, data);
    });

    html.find("#select-compendium").on("change", async () => {
      const compendiumSelection = html.find("#select-compendium");

      // get selected campaign from html selection
      const compendiumCollection = compendiumSelection[0].selectedOptions[0]
        ? compendiumSelection[0].selectedOptions[0].value
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
      const scene = sceneSelection[0].selectedOptions[0]
        ? sceneSelection[0].selectedOptions[0].value
        : undefined;
      this.sceneSet = scene && scene !== "";
      this.checkState();
    });

    html.find("#select-book-compendium").on("change", async () => {
      const bookSelection = html.find("#select-book-compendium");
      const book = bookSelection[0].selectedOptions[0]
        ? bookSelection[0].selectedOptions[0].value
        : undefined;
      this.compendiumBookSet = book && book !== "";
      this.checkState();
    });

    html.find("#select-book-download").on("change", async () => {
      const bookSelection = html.find("#select-book-download");
      const book = bookSelection[0].selectedOptions[0]
        ? bookSelection[0].selectedOptions[0].value
        : undefined;
      this.downloadBookSet = book && book !== "";
      this.checkState();
    });

    html.find("#download-url").on("change", async () => {
      const bookSelection = html.find("#download-url");
      const url = bookSelection[0].value;
      if (url && url !== "" && url.startsWith("http")) {
        this.url = url;
      }
      this.checkState();
    });

  }


  async buttonClick(event, formData) { // eslint-disable-line class-methods-use-this
    event.preventDefault();

    let sceneFlags = foundry.utils.duplicate(this.scene.flags);

    if (!sceneFlags.ddb) sceneFlags.ddb = {};
    if (!sceneFlags.ddbimporter) sceneFlags.ddbimporter = {};
    if (!sceneFlags.ddbimporter.export) sceneFlags.ddbimporter.export = {};

    sceneFlags.ddb["bookCode"] = formData["select-book"];
    localStorage.setItem("ddb-last-book", formData["select-book"]);
    sceneFlags.ddbimporter.export['description'] = formData["description"];
    sceneFlags.ddbimporter.export['actors'] = formData["export-actors"] == "on";
    sceneFlags.ddbimporter.export['notes'] = formData["export-notes"] == "on";
    sceneFlags.ddbimporter.export['lights'] = formData["export-lights"] == "on";
    sceneFlags.ddbimporter.export['walls'] = formData["export-walls"] == "on";
    sceneFlags.ddbimporter.export['drawings'] = formData["export-drawings"] == "on";
    sceneFlags.ddbimporter.export['config'] = formData["export-config"] == "on";

    if (formData["download-url"]) {
      sceneFlags.ddbimporter.export['url'] = formData["download-url"];
    } else {
      sceneFlags.ddbimporter.export['compendium'] = formData["select-compendium"];
      localStorage.setItem("ddb-last-compendium", formData["select-compendium"]);
      sceneFlags.ddbimporter.export['scene'] = formData["select-scene"];
    }

    await this.scene.update({ flags: sceneFlags });

    let sceneData = collectSceneData(this.scene, formData["select-book"]);

    Object.keys(sceneData.flags).forEach((flag) => {
      if (!allowedFlags.includes(flag) && !ddbFlags.includes(flag)) delete sceneData.flags[flag];
    });

    if (formData["export-actors"] !== "on") delete sceneData.flags.ddb.tokens;
    if (formData["export-notes"] !== "on") delete sceneData.flags.ddb.notes;
    if (formData["export-lights"] !== "on") delete sceneData.lights;
    if (formData["export-walls"] !== "on") delete sceneData.walls;
    if (formData["export-drawings"] !== "on") delete sceneData.drawings;
    if (formData["export-config"] !== "on") {
      delete sceneData.navName;
      delete sceneData.width;
      delete sceneData.height;
      delete sceneData.grid;
      delete sceneData.gridDistance;
      delete sceneData.gridType;
      delete sceneData.gridUnits;
      delete sceneData.shiftX;
      delete sceneData.shiftY;
      delete sceneData.padding;
      delete sceneData.weather;
      delete sceneData.darkness;
      delete sceneData.tokenVision;
      delete sceneData.globalLight;
      delete sceneData.globalLightThreshold;
      delete sceneData.backgroundColor;
      delete sceneData.initial;
      Object.keys(sceneData.flags).forEach((flag) => {
        if (!ddbFlags.includes(flag)) delete sceneData.flags[flag];
      });
    }

    logger.debug(sceneData);
    const name = sceneData.name.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
    const sceneRef = `ddb-enhanced-scene-${name}`;
    FileHelper.download(JSON.stringify(sceneData, null, 4), `${sceneRef}.json`, "application/json");

    this.close();
  }
}

