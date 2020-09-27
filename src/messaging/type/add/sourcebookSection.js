// const SAVE_ALL = 0;
// const SAVE_NEW = 1;
// const SAVE_NONE = 2;

import logger from "../../../logger.js";

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
    label = parts.length === 1 ? parts[0] : parts[1];
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

const addJournalEntries = async (data) => {
  // create the folders for all content before we import
  await getFolder([data.book.name, data.title], "JournalEntry", data.book);

  // add main journal entry
  addJournalEntry([data.book.name, data.title], data.book, "", data.name, data.content);
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

const parseSection = async (data) => {
  var tables;
  if (data.rollTables && data.rollTables.length > 0) {
    tables = await addRollTables(data);
  }
  // add all Journal Entries
  var journals = await addJournalEntries(data);

  return [tables, journals];
};

let addSourcebookSection = (body) => {
  return new Promise((resolve, reject) => {
    const { data } = body;

    parseSection(data)
      .then(() => {
        resolve(true);
      })
      .catch((error) => {
        logger.error(`error parsing section: ${error}`);
        reject(error);
      });
  });
};

export default addSourcebookSection;
