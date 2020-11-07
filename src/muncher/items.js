// Main module class
import { updateCompendium, srdFiddling, addMagicItemSpells } from "./import.js";
import logger from "../logger.js";


function getItemData() {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const body = { cobalt: cobaltCookie };
  // const body = {};
  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/getItems`, {
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

export async function parseItems() {
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const srdIcons = game.settings.get("ddb-importer", "munching-policy-use-srd-icons");
  const magicItemsInstalled = !!game.modules.get("magicitems");
  logger.info(`Munching items! Updating? ${updateBool} SRD? ${srdIcons}`);

  const results = await getItemData();
  let items = results.data.items;
  // let itemSpells = results.value.data.itemSpells;
  let itemSpells = null;

  // now we need to loads spells from compendium via list match

  // store all spells in the folder specific for Dynamic Items
  if (magicItemsInstalled && itemSpells && Array.isArray(itemSpells)) {
    await addMagicItemSpells(itemSpells);
  }

  const finalItems = await srdFiddling(items, "inventory");

  return new Promise((resolve) => {
    resolve(updateCompendium("inventory", { inventory: finalItems }, updateBool));
  });
}


