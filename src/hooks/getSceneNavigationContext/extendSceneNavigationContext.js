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
  let relatedJournalEntries = game.journal.filter((journal) =>
    journal.data.flags.ddb.ddbId &&
    journal.data.flags.ddb.ddbId === scene.data.flags?.ddbId &&
    journal.data.flags.ddb.cobaltId === scene.data.flags?.cobaltId &&
    journal.data.flags.ddb.parentId === scene.data.flags?.parentId &&
    journal.data.flags.ddb.bookCode === scene.data.flags?.bookCode
  );

  // get all notes placed on the map
  let notes = scene.data.notes
    // the user might have placed a note, unless it is based on an imported Journal Entry, we will not carry
    // that one over
    .filter((note) => {
      const journal = relatedJournalEntries.find((journal) => journal._id === note.entryId);
      if (!journal) return false;
      const result = !!(journal && journal.data.flags.ddb.ddbId);
      return result;
    })
    .map((note) => {
      const journal = relatedJournalEntries.find((journal) => journal._id === note.entryId);
      const index = parseInt(journal.data.name.substring(0, 2));
      return {
        index: index,
        label: journal.data.name.substring(3),
        name: journal.data.flags.ddb.ddbId,
        x: note.x,
        y: note.y,
      };
    })
    .reduce((notes, note) => {
      const idx = notes.find((n) => n.index === note.index);
      if (idx) {
        idx.positions.push({ x: note.x, y: note.y });
      } else {
        notes.push({ label: note.name, index: note.index, positions: [{ x: note.x, y: note.y }] });
      }
      return notes;
    }, [])
    .sort((a, b) => {
      return a.index - b.index;
    })
    .map((note) => ({ label: note.label, positions: note.positions }));

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
    // customization
    backgroundColor: scene.data.backgroundColor,
    // notes
    descriptions: notes,
    walls: scene.data.walls.map((wall) => ({
      c: wall.c,
      door: wall.door,
      ds: wall.ds,
      move: wall.move,
      sense: wall.sense,
    })),
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
    })),
  };
  return data;
};

export default (html, contextOptions) => {
  contextOptions.push({
    name: "ddb-importer.scenes.download",
    callback: (li) => {
      const scene = game.scenes.get(li.data("sceneId"));
      // console.warn(scene);
      const data = collectSceneData(scene);
      const cobaltId = scene.data.flags.ddb.cobaltId ? `-${scene.data.flags.ddb.cobaltId}` : "";
      const parentId = scene.data.flags.ddb.parentId ? `-${scene.data.flags.ddb.parentId}` : "";
      const sceneRef = `${scene.data.flags.ddb.bookCode}-${scene.data.flags.ddb.ddbId}${cobaltId}${parentId}`;
      // console.warn(data);
      return download(JSON.stringify(data), `${sceneRef}-scene.json`, "application/json");
    },
    condition: (li) => {
      const scene = game.scenes.get(li.data("sceneId"));
      return game.user.isGM && !!scene.data.flags.ddb.ddbId;
    },
    icon: '<i class="fas fa-share-alt"></i>',
  });
};
