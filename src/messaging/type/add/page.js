import utils from "../../../utils.js";
import logger from "../../../logger.js";

// const SAVE_ALL = 0;
// const SAVE_NEW = 1;
// const SAVE_NONE = 2;

const FOLDER_BASE_COLOR = "#98020a"; // DDB red

/**
 * Creates a folder
 * @param {*} rootId
 * @param {*} folderName
 * @param {*} sourcebook
 * @param {*} entityName
 */
const createFolder = async (rootId, folderName, sourcebook, entityName) => {
  const folder = await Folder.create({
    name: folderName,
    type: entityName,
    color: FOLDER_BASE_COLOR,
    parent: rootId,
    flags: {
      ddbimporter: {
        dndbeyond: {
          sourcebook: sourcebook.abbrev.toLowerCase(),
        },
      },
    },
  });

  return folder;
};

/**
 * Finds a folder
 * @param {*} rootId
 * @param {*} folderName
 * @param {*} sourcebook
 * @param {*} entityName
 */
const findFolder = async (rootId, folderName, sourcebook, entityName) => {
  // try and get the folder
  const folder = await game.folders.entities.find(
    (f) =>
      f.data.type === entityName &&
      f.data.name === folderName &&
      f.data.parent === rootId &&
      f.data.flags.ddbimporter &&
      f.data.flags.ddbimporter.dndbeyond &&
      f.data.flags.ddbimporter.dndbeyond.sourcebook &&
      f.data.flags.ddbimporter.dndbeyond.sourcebook === sourcebook.abbrev.toLowerCase()
  );
  return folder;
};

/**
 * Checks to see if folder exists or creates it
 * @param {*} rootId
 * @param {*} folderName
 * @param {*} sourcebook
 * @param {*} entityName
 */
const getOrCreateFolder = async (rootId, folderName, sourcebook, entityName) => {
  // try and get the folder
  const folder = await findFolder(rootId, folderName, sourcebook, entityName);

  if (folder) {
    return folder._id;
  } else {
    const newFolder = await createFolder(rootId, folderName, sourcebook, entityName);
    return newFolder._id;
  }
};

/**
 * Returns the folder object for the provided details
 * It will create any required folder structures
 * @param {*} structure
 * @param {*} entityName
 * @param {*} sourcebook
 */
const getFolder = async (structure, entityName, sourcebook) => {
  // use reduce to loop over folder structure to create and retrieve the correct
  // parentId to use to lookup the folder
  const parentId = await structure.reduce(async (acc, current) => {
    const accum = await acc;
    return getOrCreateFolder(accum, current, sourcebook, entityName);
  }, Promise.resolve(null));

  const folder = await game.folders.entities.find((folder) => folder._id === parentId);
  return folder;
};

const insertRollTables = (content) => {
  let orig = $("<div>" + content + "</div>");
  let processed = [];
  $(orig)
    .find('div[data-type="rolltable"]')
    .html(
      /* @this HTMLElement */ function () {
        let rollTableId = $(this).attr("data-id");
        if (rollTableId) {
          if (processed.includes(rollTableId)) {
            $(this).remove();
          } else {
            processed.push(rollTableId);
            let rollTable = game.tables.entities.find(
              (t) =>
                t.data.flags &&
                t.data.flags.ddbimporter &&
                t.data.flags.ddbimporter.dndbeyond &&
                t.data.flags.ddbimporter.dndbeyond.rollTableId === rollTableId
            );
            const replacement = `<div class="rolltable"><span class="rolltable-head">Roll Table: </span><span class="rolltable-link">@RollTable[${rollTable._id}]{${rollTable.name}}</span></div>`;
            return replacement;
          }
        }
        return undefined;
      }
    );
  return $(orig).html();
};

const addJournalEntry = async (structure, sourcebook, namePrefix, name, content, sceneId = null) => {
  const cleanLabel = (label) => {
    // remove all dots from the end of the string
    while (label.length && label.trim().search(/\.$/) !== -1) {
      label = label.trim();
      label = label.substr(0, label.length - 1);
    }

    // remove the prefix
    const parts = label.split(".");
    const [first, ...rest] = parts;
    label = parts.length === 1 ? first : rest.join(".");
    parts.splice();
    return label.trim();
  };

  const folder = await getFolder(structure, "JournalEntry", sourcebook);
  let entry = game.journal.find(
    (entry) => entry.data.folder === folder.data._id && entry.name === namePrefix + " " + cleanLabel(name)
  );
  if (entry) {
    await JournalEntry.update({
      _id: entry._id,
      content: insertRollTables(content),
      flags: {
        ddbimporter: {
          name: name,
          sceneId: sceneId,
        },
      },
    });
    // not sure if returning the entry here is okay. perhaps fetchting the updated one is better
    return entry;
  } else {
    entry = await JournalEntry.create({
      folder: folder._id,
      name: namePrefix + " " + cleanLabel(name),
      content: insertRollTables(content),
      img: null,
      flags: {
        ddbimporter: {
          name: name,
          sceneId: sceneId,
        },
      },
    });
  }
  return entry;
};

const addJournalEntries = async (data, scenes) => {
  // create the folders for all content before we import
  await getFolder([data.book.name, data.title], "JournalEntry", data.book);
  await Promise.all(
    data.scenes.map(async (scene) => {
      const structure = [data.book.name, data.title, scene.name];
      return getFolder(structure, "JournalEntry", data.book);
    })
  );

  // add main journal entry
  addJournalEntry([data.book.name, data.title], data.book, "", data.title, data.content);

  // create sub-entries for all scenes
  for (let s of data.scenes) {
    // filter malformed entries out (note: should not be the case anymore)
    const entries = s.entries.filter((entry) => entry !== null);
    // get the created scene based on internal scene id
    const ddbimporterID = s.sceneId;
    // find the corresponding created scene
    const scene = scenes.find(
      (myScene) =>
        myScene.data.flags.ddbimporter && myScene.data.flags.ddbimporter.sceneId && myScene.data.flags.ddbimporter.sceneId === ddbimporterID // s.id is the ddbimporter id
    );
    // delete all ddbimporter created notes
    scene.deleteEmbeddedEntity(
      "Note",
      scene
        .getEmbeddedCollection("Note")
        .filter((note) => note.flags && note.flags.ddbimporter)
        .map((note) => note._id)
    );

    // create the entities and place them on the scene, if possible
    const notes = [];
    for (let [index, entry] of entries.entries()) {
      const prefix = ("" + (index + 1)).padStart(2, "0");
      // eslint-disable-next-line
      let je = await addJournalEntry(
        [data.book.name, data.title, scene.name],
        data.book,
        prefix,
        entry.name,
        entry.content,
        ddbimporterID
      );

      if (entry.positions) {
        entry.positions.forEach((position) => {
          notes.push({
            entryId: je.data._id,
            flags: { ddbimporter: { sceneId: ddbimporterID } },
            icon: "modules/ddb-importer/icons/" + prefix + ".svg",
            x: position.x,
            y: position.y,
            iconSize: Math.round(scene.data.grid * 0.75),
          });
        });
      }
    }

    if (notes.length > 0) scene.createEmbeddedEntity("Note", notes);
  }
};

const updateScene = async (scene, folder) => {
  utils.log("Scene " + scene.name + " does exist already, updating...");
  let existing = await game.scenes.entities.find((s) => s.name === scene.name && s.data.folder === folder.data._id);

  let update = {
    flags: {
      ddbimporter: {
        sceneId: scene.sceneId,
        width: scene.width,
        height: scene.height,
        thumb: scene.thumb,
      },
    },
  };
  let autoKeys = [
    "width",
    "height",
    "backgroundColor",
    "shiftX",
    "shiftY",
    "grid",
    "gridDistance",
    "gridType",
    "globalLight",
  ];
  for (let prop of Object.keys(scene).filter((prop) => autoKeys.includes(prop))) {
    if (scene[prop]) {
      update[prop] = scene[prop];
    }
  }

  // remove existing walls, add from import
  if (scene.walls && scene.walls.length > 0) {
    update.walls = scene.walls;
    // await existing.deleteEmbeddedEntity(
    //   "Wall",
    //   existing.getEmbeddedCollection("Wall").map((wall) => wall._id)
    // );
    // await existing.createEmbeddedEntity("Wall", scene.walls);
  }

  // remove existing lights, add from import
  if (scene.lights && scene.lights.length > 0) {
    update.lights = scene.lights;
    // await existing.deleteEmbeddedEntity(
    //   "AmbientLight",
    //   existing.getEmbeddedCollection("AmbientLight").map((light) => light._id)
    // );
    // await existing.createEmbeddedEntity("AmbientLight", scene.lights);
  }

  await existing.update(update);

  return existing;
};

const createScene = async (scene, folder) => {
  // this flag can be set to true if all GM maps are having the same dimensions as the player maps
  // and if Foundry stops resetting the scene dimensions to the original file dimensions if we stretched
  // the image on purpose to get the grids right
  const UNLOCK_GM_MAPS = false;
  const SCENE_FORMAT_WEBP = 0;
  const SCENE_FORMAT_ORIG = 1; // BOO!

  const uploadDirectory = game.settings.get("ddb-importer", "scene-upload-directory");
  const uploadFileFormat = parseInt(game.settings.get("ddb-importer", "scene-format"));

  let playerSrc = null,
    gmSrc = null;

  // upload player map
  let targetFilename = scene.playerLocal.replace(/\//g, "-").replace(".webp", "");
  if (uploadFileFormat === SCENE_FORMAT_ORIG) {
    // replace webp with the desired file extension
    // &targetFilename.replace(".webp", ""); //"." + scene.playerSrc.split(".").pop());
    playerSrc = await utils.uploadImage(scene.playerSrc, uploadDirectory, targetFilename);
  } else {
    playerSrc = await utils.uploadImage(
      "https://cdn.vttassets.com/scenes/" + scene.playerLocal,
      uploadDirectory,
      targetFilename,
      false
    );
  }

  // upload GM map
  if (UNLOCK_GM_MAPS && scene.gmSrc && scene.gmLocal) {
    let targetFilename = scene.gmLocal.replace(/\//g, "-").replace(".webp", "");
    switch (uploadDirectory) {
      case SCENE_FORMAT_ORIG:
        gmSrc = await utils.uploadImage(scene.gmSrc, uploadDirectory, targetFilename);
        break;
      case SCENE_FORMAT_WEBP:
        gmSrc = await utils.uploadImage(
          "https://cdn.vttassets.com/scenes/" + scene.gmLocal,
          uploadDirectory,
          targetFilename,
          false
        );
        break;
      default:
        gmSrc = await utils.uploadImage(
          "https://cdn.vttassets.com/scenes/" + scene.gmLocal,
          uploadDirectory,
          targetFilename,
          false
        );
    }
  }

  // upload Thumbnail
  const thumb = await utils.uploadImage(
    "https://cdn.vttassets.com/scenes/" + scene.thumb,
    uploadDirectory,
    scene.thumb.replace(/\//g, "-").replace(".webp", ""),
    false
  );

  let create = {
    img: playerSrc,
    thumb: thumb,
    folder: folder._id,
    navigation: false,
    flags: {
      ddbimporter: {
        sceneId: scene.sceneId,
        width: scene.width,
        height: scene.height,
        thumb: scene.thumb,
      },
    },
  };

  // enable map switching
  if (playerSrc && gmSrc) {
    create.flags.ddbimporter.alt = {
      GM: gmSrc,
      Player: playerSrc,
    };
  }

  let autoKeys = [
    "name",
    "width",
    "height",
    "backgroundColor",
    "shiftX",
    "shiftY",
    "grid",
    "gridDistance",
    "gridType",
    "globalLight",
  ];
  for (let prop of Object.keys(scene).filter((prop) => autoKeys.includes(prop))) {
    if (scene[prop]) {
      create[prop] = scene[prop];
    }
  }

  let existing = await Scene.create(create);

  if (scene.walls && scene.walls.length > 0) {
    await existing.createEmbeddedEntity("Wall", scene.walls);
  }
  if (scene.lights && scene.lights.length > 0) {
    await existing.createEmbeddedEntity("AmbientLight", scene.lights);
  }

  return existing;
};

const addScenes = async (data) => {
  const folder = await getFolder([data.book.name, data.title], "Scene", data.book);

  const existingScenes = await Promise.all(
    data.scenes
      .filter((scene) =>
        game.scenes.entities.some((s) => {
          return s.name === scene.name && s.data.folder === folder.data._id;
        })
      )
      .map((scene) => {
        return scene.name;
      })
  );

  // check if the scene already exists
  const scenes = [];
  for (let scene of data.scenes) {
    if (existingScenes && existingScenes.includes(scene.name)) {
      scenes.push(updateScene(scene, folder));
    } else {
      scenes.push(createScene(scene, folder));
    }
  }
  return Promise.all(scenes);
};

const addRollTable = async (table, folder) => {
  // find an existing rolltable
  const data = {
    name: table.name,
    formula: `1d${table.max}`,
    folder: folder._id,
    flags: {
      ddbimporter: {
        dndbeyond: {
          rollTableId: table.id,
        },
      },
    },
  };
  let existing = game.tables.find(
    (t) =>
      // we are not comparing the name so users can rename the tables
      t.data.folder === folder._id &&
      t.data.flags &&
      t.data.flags.ddbimporter &&
      t.data.flags.ddbimporter.dndbeyond &&
      t.data.flags.ddbimporter.dndbeyond.rollTableId === table.id
  );
  if (existing) {
    await existing.update({ data: data });
    await existing.deleteEmbeddedEntity(
      "TableResult",
      existing.getEmbeddedCollection("TableResult").map((tr) => tr._id)
    );
    await existing.createEmbeddedEntity("TableResult", table.results);
    return existing;
  } else {
    let rollTable = await RollTable.create(data);
    await rollTable.createEmbeddedEntity("TableResult", table.results);
    return rollTable;
  }
};

const addRollTables = async (data) => {
  // folderName, rollTables, sourcebook) => {
  const folderName = data.title;
  const rollTables = data.rollTables;

  let folder = await getFolder([data.book.name, folderName], "RollTable", data.book);

  const tables = await Promise.all(
    rollTables.map(async (table) => {
      return addRollTable(table, folder);
    })
  );
  return tables;
};

const parsePage = async (data) => {
  var tables;
  if (data.rollTables && data.rollTables.length > 0) {
    tables = await addRollTables(data);
  }

  const scenes = await addScenes(data);

  // add all Journal Entries
  var journals = await addJournalEntries(data, scenes);

  return [tables, journals, scenes];
};

let addPage = (body) => {
  return new Promise((resolve, reject) => {
    const { data } = body;

    parsePage(data)
      .then(() => {
        resolve(true);
      })
      .catch((error) => {
        logger.error(`error parsing page: ${error}`);
        reject(error);
      });
  });
};

export default addPage;
