// import utils from "../../utils.js";
import { download } from "../../muncher/utils.js";

/**
   * Extracts all notes that have been placed by ddb-importer
   * Creates the expected data structure for the database by
   * getting the real label from the appropriate Journal Entry
   * @param {Scene} scene The scene to extract the notes from
  */
const getNotes = (scene) => {
  // get all notes in the Journal related to this scene
  const relatedJournalEntries = game.journal.filter((journal) =>
    journal.data.flags.ddb?.slug && scene.data.flags.ddb?.slug &&
    journal.data.flags.ddb.slug === scene.data.flags.ddb.slug
  );

  // get all notes placed on the map
  const notes = scene.data.notes
    // the user might have placed a note, unless it is based on an imported Journal Entry, we will not carry
    // that one over
    .filter((note) => relatedJournalEntries.some((journal) => journal._id === note.entryId))
    .map((note) => {
      const journal = relatedJournalEntries.find((journal) => journal._id === note.entryId);
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
        flags: flags,
        iconSize: note.iconSize,
        iconTint: note.iconTint,
        textColor: note.textColor,
        textAnchor: note.textAnchor,
        x: note.x,
        y: note.y,
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
};

/**
 * Prepares the scene data for download
 * @param {Scene} scene
 */
const collectSceneData = (scene) => {
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
    // initial
    initial: scene.data.initial,
    // customization
    backgroundColor: scene.data.backgroundColor,
    walls: scene.data.walls.map((wall) => ({
      c: wall.c,
      door: wall.door,
      ds: wall.ds,
      move: wall.move,
      sense: wall.sense,
    })),
    //
    drawings: scene.data.drawings,
    weather: scene.data.weather,
    // lights
    darkness: scene.data.darkness,
    tokenVision: scene.data.tokenVision,
    globalLight: scene.data.globalLight,
    globalLightThreshold: scene.data.globalLightThreshold,
    lights: scene.data.lights.map((light) => ({
      angle: light.angle,
      bright: light.bright,
      darknessThreshold: light.darknessThreshold,
      dim: light.dim,
      rotation: light.rotation,
      t: light.t,
      tintAlpha: light.tintAlpha,
      x: light.x,
      y: light.y,
      lightAnimation: light.lightAnimation,
      hidden: light.hidden,
    })),
    // tokens
    tokens: scene.data.tokens.filter((token) => !token.actorLink).map((token) => {
      return {
        _id: token._id,
        name: token.name,
        width: token.width,
        height: token.height,
        scale: token.scale,
        x: token.x,
        y: token.y,
        disposition: token.disposition,
        flags: token.flags,
      };
    }),
  };
  // removed un-needed userdata
  if (data.flags.ddb?.userData) {
    if (data.flags.ddb.userData.status) delete (data.flags.ddb.userData.status);
    if (data.flags.ddb.userData.userId) delete (data.flags.ddb.userData.userId);
    if (data.flags.ddb.userData.twitchUserName) delete (data.flags.ddb.userData.twitchUserName);
    if (data.flags.ddb.userData.AvatarUrl) delete (data.flags.ddb.userData.AvatarUrl);
  }

  if (data.flags.vtta && !data.flags.vtta.code) {
    data.flags.vtta.code = scene.data.flags.vtta.thumb.split("/")[0].toLowerCase();
  }

  data.flags.ddb.notes = notes;
  data.flags.ddbimporter = {
    version: game.modules.get("ddb-importer").data.version,
  };

  return data;
};

export default (html, contextOptions) => {
  contextOptions.push({
    name: "ddb-importer.scenes.download",
    callback: (li) => {
      const sceneId = $(li).attr("data-scene-id") ? $(li).attr("data-scene-id") : $(li).attr("data-entity-id");
      const scene = game.scenes.get(sceneId);
      // console.warn(scene);
      const data = collectSceneData(scene);
      const bookCode = scene.data.flags.ddb?.bookCode
        ? `${scene.data.flags.ddb.bookCode}-${scene.data.flags.ddb.ddbId}`
        : (scene.data.flags.vtta?.id)
          ? scene.data.flags.vtta.id.replace("/", "-")
          : scene.data.flags.vtta.thumb.split("/")[0].toLowerCase();
      const cobaltId = scene.data.flags.ddb?.cobaltId ? `-${scene.data.flags.ddb.cobaltId}` : "";
      const parentId = scene.data.flags.ddb?.parentId ? `-${scene.data.flags.ddb.parentId}` : "";
      const vttaId = scene.data.flags.vtta?.sceneId ? `-${scene.data.flags.vtta.sceneId}` : "";
      const sceneRef = `${bookCode}${cobaltId}${parentId}${vttaId}`;
      // console.warn(data);
      return download(JSON.stringify(data), `${sceneRef}-scene.json`, "application/json");
    },
    condition: (li) => {
      const sceneId = $(li).attr("data-scene-id") ? $(li).attr("data-scene-id") : $(li).attr("data-entity-id");
      const scene = game.scenes.get(sceneId);
      const sceneDownload = game.settings.get("ddb-importer", "allow-scene-download");
      const allowDownload = game.user.isGM && sceneDownload && (scene.data.flags.ddb?.ddbId || scene.data.flags.vtta?.code || scene.data.flags.vtta?.thumb);
      return allowDownload;
    },
    icon: '<i class="fas fa-share-alt"></i>',
  });
};
