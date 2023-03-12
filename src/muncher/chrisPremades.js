/* eslint-disable require-atomic-updates */
import CompendiumHelper from "../lib/CompendiumHelper.js";
import SETTINGS from "../settings.js";

const DDB_FLAGS_TO_REMOVE = [
  "midi-qol",
  "midiProperties",
  "ActiveAuras",
  "dae",
  "itemacro",
];

const CP_FLAGS_TO_REMOVE = [
  "cf",
  "ddbimporter",
  "monsterMunch",
  "core",
];

const CP_FIELDS_TO_COPY = [
  "effects",
];

export async function getChrisCompendium(type) {
  const compendiumName = SETTINGS.CHRIS_PREMADES_COMPENDIUM.find((c) => c.type === type);
  const cpPack = CompendiumHelper.getCompendium(compendiumName);
  const indices = ["name", "type", "flags.cf"];
  const index = await cpPack.getIndex({ fields: indices });
  return index;
}


async function getFolderId(name, type, compendiumName) {
  const folderAPI = game.CF.FICFolderAPI;
  const allFolders = await folderAPI.loadFolders(compendiumName);
  return allFolders.find((f) => f.name === name)?.id;
}


export async function applyChrisPremadeEffect(document, type, folderName = null) {
  const compendiumName = SETTINGS.CHRIS_PREMADES_COMPENDIUM.find((c) => c.type === type)?.name;
  if (!compendiumName) return document;
  const folderId = type === "monsterfeatures"
    ? await getFolderId(folderName ?? document.name, type, compendiumName)
    : undefined;

  const chrisDoc = await chrisPremades.helpers.getItemFromCompendium(compendiumName, document.name, true, folderId);
  if (!chrisDoc) return document;

  DDB_FLAGS_TO_REMOVE.forEach((flagName) => {
    delete document.flags[flagName];
  });

  document.effects = [];

  CP_FLAGS_TO_REMOVE.forEach((flagName) => {
    delete chrisDoc.flags[flagName];
  });

  document.flags = mergeObject(document.flags, chrisDoc.flags);

  CP_FIELDS_TO_COPY.forEach((field) => {
    setProperty(document, field, getProperty(chrisDoc, field));
  });

  setProperty(document, "flags.ddbimporter.effectsApplied", true);
  setProperty(document, "flags.ddbimporter.chrisEffectsApplied", true);

  return document;
}
