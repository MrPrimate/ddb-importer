import { download } from "./utils.js";

/**
   * Extracts all notes that have been placed by ddb-importer
   * Creates the expected data structure for the database by
   * getting the real label from the appropriate Journal Entry
   * @param {Scene} scene The scene to extract the notes from
  */
function getNotes(scene, bookCode) {
  // get all notes in the Journal related to this scene
  const relatedJournalEntries = game.journal.filter((journal) =>
    journal.data.flags.ddb?.bookCode &&
    journal.data.flags.ddb.bookCode === bookCode
  );

  // get all notes placed on the map
  const notes = scene.data.notes
    // the user might have placed a note, unless it is based on an imported Journal Entry, we will not carry
    // that one over
    .filter((note) => relatedJournalEntries.some((journal) => journal.id === note.data.entryId))
    .map((note) => {
      const journal = relatedJournalEntries.find((journal) => journal.id === note.data.entryId);
      const idx = parseInt(journal.data.flags.ddb.ddbId);
        // removed un-needed userdata
      const flags = journal.data.flags.ddb;
      if (flags?.userData) delete flags.userData;
      return {
        index: idx,
        label: journal.data.name,
        flags: {
          ddb: flags,
        },
        iconSize: note.data.iconSize,
        iconTint: note.data.iconTint,
        textColor: note.data.textColor,
        textAnchor: note.data.textAnchor,
        x: note.data.x,
        y: note.data.y,
      };
    })
    .reduce((notes, note) => {
      const idx = notes.find((n) => n.index === note.index);
      if (idx) {
        idx.positions.push({ x: note.x, y: note.y });
      } else {
        const n = {
          label: note.label,
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
    })
    .map((note) => ({
      label: note.label,
      flags: note.flags,
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
    flags: scene.data.flags,
    name: scene.data.name,
    navName: scene.data.navName,
    // dimensions
    width: scene.data.width,
    height: scene.data.height,
    // grid
    grid: scene.data.grid,
    gridDistance: scene.data.gridDistance,
    gridType: scene.data.gridType,
    gridUnits: scene.data.gridUnits,
    shiftX: scene.data.shiftX,
    shiftY: scene.data.shiftY,
    padding: scene.data.padding,
    // initial
    initial: scene.data.initial,
    // customization
    backgroundColor: scene.data.backgroundColor,
    walls: scene.data.walls.map((wall) => {
      const w = wall.toObject();
      delete w._id;
      return w;
    }),
    //
    drawings: scene.data.drawings,
    weather: scene.data.weather,
    // lights
    darkness: scene.data.darkness,
    tokenVision: scene.data.tokenVision,
    globalLight: scene.data.globalLight,
    globalLightThreshold: scene.data.globalLightThreshold,
    lights: scene.data.lights.map((light) => {
      const l = light.toObject();
      delete l._id;
      return l;
    }),
  };

  if (!data.flags.ddb) data.flags.ddb = {};

  if (data.flags.ddb.tokens) delete data.flags.ddb.tokens;
  data.flags.ddb.tokens = scene.data.tokens
  .filter((token) => !token.actorLink)
  .map((token) => {
    let result = {
      _id: token.data._id,
      name: token.data.name,
      width: token.data.width,
      height: token.data.height,
      scale: token.data.scale,
      x: token.data.x,
      y: token.data.y,
      disposition: token.data.disposition,
      flags: token.data.flags,
      actorLink: false,
      bar1: { attribute: "attributes.hp" },
      effects: [],
      elevation: token.data.elevation,
      hidden: token.data.hidden,
      lightAlpha: token.data.lightAlpha,
      lightAngle: token.data.lightAngle,
      lightAnimation: token.data.lightAnimation,
      tint: token.data.tint,
      actorData: token.data.actorData,
    };

    // the token actor flags here help us match up actors using the DDB ID
    if (token.actor) {
      if (token.actor.data.flags.ddbimporter) {
        result.flags.ddbActorFlags = token.actor.data.flags.ddbimporter;
        result.flags.ddbActorFlags.name = token.actor.data.token?.name ? token.actor.data.token.name : token.actor.data.name;
      }
    }

    return result;
  });


  // removed un-needed userdata
  if (data.flags.ddb?.userData) delete data.flags.ddb.userData;

  data.flags.ddb.notes = notes;
  data.flags.ddbimporter = {
    version: game.modules.get("ddb-importer").data.version,
  };

  return data;
}

// TODO: this will handle the scene enhancement/import
export function sceneEnhancer() {

}


// scene.data.flags.ddb.bookCode


// window.DDBScene = {
//   exportScene: exportScene,
// };


export class SceneEnhancerExport extends Application {
  constructor(scene) {
    super();
    this.scene = scene;
    this.compendiums = game.packs
      .filter((pack) => pack.metadata?.entity === "Scene")
      .sort((a, b) => a.metadata.label.localeCompare(b.metadata.label));
    this.bookCode = "";
    if (scene.data.flags.ddb?.bookCode) {
      this.bookCode = scene.data.flags.ddb.bookCode;
    }

  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-scene-enhancer";
    options.template = "modules/ddb-importer/handlebars/enhance-export.hbs";
    options.width = 500;
    options.classes = ["ddb-muncher", "sheet"];
    options.tabs = [{ navSelector: ".tabs", contentSelector: "div", initial: "compendium" }];
    return options;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return `DDB Importer Scene Enhancer Exporter: ${this.scene.name}`;
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    let templateData = {
      sceneName: this.scene.name,
      compendiums: this.compendiums,
      compendium: {
        name: "",
        id: "",
      },
      flagName: "",
      useFlag: false,
      description: "",
      bookCode: this.bookCode,
    };

    return templateData;
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
      const sceneSelection = html.find("#select-scene");
      // get selected campaign from html selection
      console.warn(compendiumSelection[0]);
      const compendiumCollection = compendiumSelection[0].selectedOptions[0]
        ? compendiumSelection[0].selectedOptions[0].value
        : undefined;
      const compendium = game.packs.find((pack) => pack.collection === compendiumCollection);
      if (compendium) {
        let sceneList = `<option value="">Select...</option>`;
        compendium.index.forEach((scene) => {
          sceneList += `<option value="${scene._id}">${scene.name}</option>`;
        });
        sceneSelection.list[0].innerHTML = sceneList;
      }
    });

  }


  async buttonClick(event, formData) { // eslint-disable-line class-methods-use-this
    event.preventDefault();
    const bookCode = formData['book-code'];
    const campaignSelect = formData['campaign-select'];

    console.warn(formData);


    // flagname
    // description
    // comepndium/id and
    // update bookcode on scene
    // scene.data.flags.ddb.bookCode -
    //

    // download image link?

        // - scene name
    // use a flag not name to match the scene:
    // - bool useFlag
    // - string: flagName
    // - bool: export scenes
    // - bool: export walls
    // - bool: export actors
    // - bool: export config

    // description: e.g. does the user have to manually find the image?

    // compendium

    // console.warn(scene);
    const data = collectSceneData(this.scene, bookCode);
    const name = this.scene.data.name.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
    const sceneRef = `ddb-enhanced-scene-${name}`;
    // console.warn(data);
    // download(JSON.stringify(data, null, 4), `${sceneRef}.json`, "application/json");

  }
}
