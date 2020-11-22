// Main module class
import { srdFiddling, getCompendiumItems, removeItems, munchNote } from "./import.js";
import logger from "../logger.js";
import { addNPC } from "./importMonster.js";

// This needs to be expanded to do the phased retreval of paging monsters
function getMonsterData() {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const body = { cobalt: cobaltCookie, betaKey: betaKey };
  const searchTerm = $('#monster-munch-filter')[0].value;

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/getMonster/${searchTerm}`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // body data type must match "Content-Type" header
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          if (data.failed && data.failed.length !== 0) logger.error(`Failed to parse ${data.failed}`);
          resolve(data);
        } else {
          munchNote(`API Failure:${data.message}`);
          reject(data.message);
        }
      })
      .catch((error) => reject(error));
  });
}

export async function parseCritters() {
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const srdIcons = game.settings.get("ddb-importer", "munching-policy-use-srd-icons");
  logger.debug(`Munching monsters! Updating? ${updateBool} SRD? ${srdIcons}`);

  const results = await getMonsterData();
  let monsters = results.data;

  if (!updateBool) {
    munchNote(`Calculating which monsters to update...`);
    logger.debug("Removing existing monsters from import list");
    const existingMonsters = await getCompendiumItems(monsters, "npc");
    logger.debug(`Matched ${existingMonsters.length}`);
    munchNote(`Removing ${existingMonsters.length} from update...`);
    monsters = await removeItems(monsters, existingMonsters);
  }
  const finalMonsters = await srdFiddling(monsters, "monsters");

  let currentMonster = 0;
  const monsterCount = finalMonsters.length + 1;
  munchNote(`Please be patient importing ${monsterCount} monsters!`);
  for (const monster of finalMonsters) {
    munchNote(`Importing ${monster.name} (${currentMonster}/${monsterCount})`, true);
    logger.debug(`Importing ${monster.name}`);
    // eslint-disable-next-line no-await-in-loop
    await addNPC(monster);
    currentMonster += 1;
  }

}


