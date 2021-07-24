// Main module class
import { getImagePath } from "./import.js";
import { getMonsterCompendium } from "./importMonster";
import { munchNote, download } from "./utils.js";
import logger from "../logger.js";
import { getCobalt } from "../lib/Secrets.js";
import { loadPacks } from "./dae.js";

async function getEncounterData() {
  const cobaltCookie = getCobalt();
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const debugJson = game.settings.get("ddb-importer", "debug-json");

  const body = {
    cobalt: cobaltCookie,
    betaKey: betaKey,
  };

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/encounters`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // body data type must match "Content-Type" header
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          munchNote(`API Failure: ${data.message}`);
          reject(data.message);
        }
        if (debugJson) {
          download(JSON.stringify(data), `encounters-raw.json`, "application/json");
        }
        return data;
      })
      .then((data) => {
        munchNote(`Retrieved ${data.data.length} encounters, starting parse...`, true, false);
        logger.info(`Retrieved ${data.data.length} encounters`);
        resolve(data.data);
      })
      .catch((error) => reject(error));
  });
}

export async function parseEncounters() {
  const encounters = await getEncounterData();
  logger.debug("Fetched encounters", frames);

  munchNote(`Fetched Available DDB Encounters`);

  console.warn(encounters);
  CONFIG.DDBI.ENCOUNTERS = encounters;

  munchNote("");

  return encounters.length;
}

function parseEncounter(id) {
  if (!CONFIG.DDBI.ENCOUNTERS) return undefined;
  const monsterPack = await getMonsterCompendium();
  await monsterPack.getIndex({ fields: ["name", "flags.ddbimporter.id"] });

  const encounter = CONFIG.DDBI.ENCOUNTERS.find((e) => e.id === id);

  let goodMonsterIds = [];
  let missingMonsterIds = [];
  encounter.monsters.forEach((monster) => {
    const id = monster.id;
    const monsterInPack = monsterPack.index.find((f) => f.flags.ddbimporter.id == id);
    if (monsterInPack) {
      goodMonsterIds.push({ ddbId: id, name: monsterInPack.name, id: monsterInPack.id });
    } else {
      missingMonsterIds.push({ ddbId: id });
    }
  });

  let goodCharacters = [];
  let missingCharacters = [];
  encounter.characters.forEach((character) => {
    const id = character.id;
    const characterInPack = game.actors.find((actor) => actor.data.flags.ddbimporter.characterId == id);
    if (characterInPack) {
      goodCharacters.push({ id: characterInPack.id, name: characterInPack.name, ddbId: id });
    } else {
      missingCharacters.push({ ddbId: id, name: character.name });
    }
  });

  // return
  // monsters that exist in world, name, id and ddbid
  // missing monster ids
  // challenge rating
  // name
  // description
  // characers in world
  // missing characters

}


export default class DDBEncounterMunch extends Application {

}
