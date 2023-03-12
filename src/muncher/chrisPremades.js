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

async function getChrisCompendium(type) {
  const compendiumName = SETTINGS.CHRIS_PREMADES_COMPENDIUM.find((c) => c.type === type);
  const cpPack = CompendiumHelper.getCompendium(compendiumName);
  const indices = ["name", "type", "flags.cf"];
  const index = await cpPack.getIndex({ fields: indices });
  return index;
}



export async function applyChrisPremadeEffect(document, type) {

  const index = getChrisCompendium(type);
  if (!index) return document;


  let folderAPI = game.CF.FICFolderAPI;
  let allFolders = await folderAPI.loadFolders('chris-premades.CPR Monster Features');
  let monsterFolder = allFolders.find(f => f.name === itemDocument.actor.name);
  if (!monsterFolder) {
      ui.notifications.info('No available automation for this monster! (Or monster has a different name)');
      return;
  }

  compendiumItem = await chris.getItemFromCompendium('chris-premades.CPR Monster Features', itemName, true, monsterFolder.id)

  const chrisDoc = await chrisPremades.helpers.getItemFromCompendium('chris-premades.CPR Monster Features', "Heated Body", true, "temp_v2owqxhmb282")

  return document;

}
