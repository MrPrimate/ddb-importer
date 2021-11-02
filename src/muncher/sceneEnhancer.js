
/**
   * Extracts all notes that have been placed by ddb-importer
   * Creates the expected data structure for the database by
   * getting the real label from the appropriate Journal Entry
   * @param {Scene} scene The scene to extract the notes from
  */
 function getNotes(scene) {
  // get all notes in the Journal related to this scene
  const relatedJournalEntries = game.journal.filter((journal) =>
    journal.data.flags.ddb?.bookCode && scene.data.flags.ddb?.bookCode &&
    journal.data.flags.ddb.bookCode === scene.data.flags.ddb.bookCode
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
      if (flags?.userData) {
        if (flags.userData.status) delete (flags.userData.status);
        if (flags.userData.userId) delete (flags.userData.userId);
        if (flags.userData.twitchUserName) delete (flags.userData.twitchUserName);
        if (flags.userData.AvatarUrl) delete (flags.userData.AvatarUrl);
      }
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
function collectSceneData(scene) {
  const notes = getNotes(scene);

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
  if (data.flags.ddb?.userData) {
    if (data.flags.ddb.userData.status) delete (data.flags.ddb.userData.status);
    if (data.flags.ddb.userData.userId) delete (data.flags.ddb.userData.userId);
    if (data.flags.ddb.userData.twitchUserName) delete (data.flags.ddb.userData.twitchUserName);
    if (data.flags.ddb.userData.AvatarUrl) delete (data.flags.ddb.userData.AvatarUrl);
  }

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


export class SceneEnhancerExport extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-scene-enhancer";
    options.template = "modules/ddb-importer/handlebars/enhance-export.hbs";
    options.width = 500;
    return options;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Scene Enhancer Exporter";
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    let templateData = {
      sceneName: scene.name,
      inCompendium: inCompendium,
      compendiums: [],
      compendium: {
        name: "",
        id: "",
      },
      flagName: "",
      useFlag: false,
      description: "",
      bookCode: "",
    };

    if (scene.data.flags.ddb?.bookCode) {
      templateData.bookCode = scene.data.flags.ddb.bookCode;
    }

    const scenes = game.scenes.filter((scene) => !scene.data.flags.ddb?.ddbId);


    // this won't work! no reliable way to get the compendium
    // maybe need to just search for scene name?
    const flagged = scene.data.flags.core?.sourceId;
    if (flagged && flagged.toLowerCase().startsWith("compendium")) {
      const splitSource = flagged.split(".");
      if (splitSource.length >= 3) {
        const compendiumLabel = splitSource[3];
        let compendiumLabel = "house-of-lament-steves-scenes";
        const compendium = game.packs.find((p) => p.metadata.label === compendiumLabel);
        templateData.compendium.name = game.
      // compendium it belongs to
      // module it belongs to
    }

    // - scene name
    // use a flag not name to match the scene:
    // - bool useFlag
    // - string: flagName
    // - bool: export scenes
    // - bool: export walls
    // - bool: export actors
    // - bool: export config

    // description: e.g. does the user have to manually find the image?

    return templateData;
  }

  activateListeners(html) {
    super.activateListeners(html);
    // html.find("#patreon-button").click(async (event) => {
    //   event.preventDefault();
    //   linkToPatreon();
    // });
    // html.find("#campaign-button").click(async (event) => {
    //   event.preventDefault();
    //   const cookie = html.find("#cobalt-cookie-input");
    //   const campaigns = await refreshCampaigns(cookie[0].value);
    //   let campaignList = `<option value="">Select campaign:</option>`;
    //   campaigns.forEach((campaign) => {
    //     campaignList += `<option value="${campaign.id}">${campaign.name} (${campaign.dmUsername}) - ${campaign.id}</option>\n`;
    //   });
    //   const list = html.find("#campaign-select");
    //   list[0].innerHTML = campaignList;
    // });
    // html.find("#check-cobalt-button").click(async (event) => {
    //   event.preventDefault();
    //   const cookie = html.find("#cobalt-cookie-input");
    //   if (cookie[0].value === undefined) throw new Error("undefined");
    //   const cobaltStatus = await checkCobalt("", cookie[0].value);
    //   const button = html.find("#check-cobalt-button");
    //   if (cobaltStatus.success) {
    //     button[0].innerHTML = "Check Cobalt Cookie - Success!";
    //   } else {
    //     button[0].innerHTML = "Check Cobalt Cookie - Failure!";
    //   }
    });


  }

  /** @override */
  async _updateObject(event, formData) { // eslint-disable-line class-methods-use-this
    event.preventDefault();
    const bookCode = formData['book-code'];
    const campaignSelect = formData['campaign-select'];


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

  }
}
