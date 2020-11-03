// Main module class
import { updateCompendium, srdFiddling } from "./import.js";
import logger from "../logger.js";


// This needs to be expanded to do the phased retreval of paging monsters
function getMonsterData() {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const body = { cobalt: cobaltCookie };
  // const body = {};
  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/getMonsters`, {
      method: "POST",
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
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
  let monsters = results.map((r) => r.value.data).flat().flat();

  const finalMonsters = await srdFiddling(monsters, "monsters");

  return new Promise((resolve) => {
    resolve(updateCompendium("monsters", { monsters: finalMonsters }, updateBool));
  });
}


