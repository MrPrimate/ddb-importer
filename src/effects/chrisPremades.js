/* eslint-disable no-continue */
/* eslint-disable require-atomic-updates */
import DICTIONARY from "../dictionary.js";
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
  "system.damage",
  "system.target",
  "system.range",
  "system.duration",
  "system.save",
  "system.activation",
  "system.ability",
  "system.critical",
  "system.formula",
  "system.actionType",
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
  if (!game.modules.get("chris-premades")?.active) return document;
  const compendiumName = SETTINGS.CHRIS_PREMADES_COMPENDIUM.find((c) => c.type === type)?.name;
  if (!compendiumName) return document;
  const chrisName = chrisPremades.ddb.getItemName(document.name);
  const folderId = type === "monsterfeatures"
    ? await getFolderId(folderName ?? chrisName, type, compendiumName)
    : undefined;

  const chrisDoc = await chrisPremades.helpers.getItemFromCompendium(compendiumName, chrisName, true, folderId);
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


export async function applyChrisPremadeEffects(documents, compendiumItem = false, force = false) {
  if (!game.modules.get("chris-premades")?.active) return documents;

  const applyChrisEffects = force || compendiumItem
    ? game.settings.get("ddb-importer", "munching-policy-use-chris-premades")
    : game.settings.get("ddb-importer", "character-update-policy-use-chris-premades");
  if (!applyChrisEffects) return documents;

  for (let doc of documents) {
    let type = doc.type;

    if (["class", "subclass", "background"].includes(type)) continue;
    if (DICTIONARY.types.inventory.includes(doc.type)) {
      type = "inventory";
    }

    // eslint-disable-next-line no-await-in-loop
    doc = await applyChrisPremadeEffect(doc, type);
  }

  return documents;
}
