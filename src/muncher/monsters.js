// Main module class
import { srdFiddling, getCompendiumItems, removeItems } from "./import.js";
import logger from "../logger.js";
import { addNPC } from "./importMonster.js";

// This needs to be expanded to do the phased retreval of paging monsters
function getMonsterData() {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const body = { cobalt: cobaltCookie, betaKey: betaKey };

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/getMonsters`, {
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
          resolve(data);
        } else {
          $('#munching-task-notes').text(`Failure:${data.message}`);
          reject(data.message);
        }
      })
      .catch((error) => reject(error));
  });
}

export async function parseCritters() {
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const srdIcons = game.settings.get("ddb-importer", "munching-policy-use-srd-icons");
  logger.info(`Munching monsters! Updating? ${updateBool} SRD? ${srdIcons}`);

  const results = await getMonsterData();
  let monsters = results.data;

  if (!updateBool) {
    $('#munching-task-notes').text(`Calculating which monsters to update...`);
    logger.debug("Removing existing monsters from import list");
    const existingMonsters = await getCompendiumItems(monsters, "npc");
    logger.debug(`Matched ${existingMonsters.length}`);
    $('#munching-task-notes').text(`Removing ${existingMonsters.length} from update...`);
    monsters = await removeItems(monsters, existingMonsters);
  }
  const finalMonsters = await srdFiddling(monsters, "monsters");

  let currentMonster = 0;
  const monsterCount = finalMonsters.length + 1;
  $('#munching-task-notes').text(`Please be patient importing ${monsterCount} monsters!`);
  for (const monster of finalMonsters) {
    $('#munching-task-name').text(`Importing ${monster.name} (${currentMonster}/${monsterCount})`);
    logger.debug(`Importing ${monster.name}`);
    // eslint-disable-next-line no-await-in-loop
    await addNPC(monster);
    currentMonster += 1;
  }

}


