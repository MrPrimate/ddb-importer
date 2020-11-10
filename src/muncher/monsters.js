// Main module class
import { updateCompendium, srdFiddling } from "./import.js";
import logger from "../logger.js";
import { addNPC } from "./importMonster.js";

// This needs to be expanded to do the phased retreval of paging monsters
function getMonsterData() {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const body = { cobalt: cobaltCookie };

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
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
}

export async function parseCritters() {
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const srdIcons = game.settings.get("ddb-importer", "munching-policy-use-srd-icons");
  logger.info(`Munching monsters! Updating? ${updateBool} SRD? ${srdIcons}`);

  const results = await getMonsterData();
  let monsters = results.data;

  const finalMonsters = await srdFiddling(monsters, "monsters");

  // remaining work: load spells into monster data
  console.log(finalMonsters);

  return new Promise((resolve) => {
    resolve(finalMonsters.forEach((monster) => {
      addNPC(monster);
    }));
    //resolve(updateCompendium("monsters", { monsters: finalMonsters }, updateBool));
  });
}


