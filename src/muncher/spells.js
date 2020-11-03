// Main module class
import { updateCompendium, srdFiddling } from "./import.js";
import logger from "../logger.js";

function getSpellData(className) {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const body = { cobalt: cobaltCookie };
  // const body = {};
  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/getClassSpells/${className}`, {
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

export async function parseSpells() {
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const srdIcons = game.settings.get("ddb-importer", "munching-policy-use-srd-icons");
  logger.info(`Munching spells! Updating? ${updateBool} SRD? ${srdIcons}`);

  const results = await Promise.allSettled([
    getSpellData("Cleric"),
    getSpellData("Druid"),
    getSpellData("Sorcerer"),
    getSpellData("Warlock"),
    getSpellData("Wizard"),
    getSpellData("Paladin"),
    getSpellData("Ranger"),
    getSpellData("Bard"),
  ]);

  const spells = results.map((r) => r.value.data).flat().flat();
  let uniqueSpells = spells.filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i);

  // if (useSrdSpells) {
  //   logger.debug("Removing compendium items");
  //   const srdSpells = await getSRDCompendiumItems(uniqueSpells, "spells");
  //   // removed existing items from those to be imported
  //   uniqueSpells = await removeItems(uniqueSpells, srdSpells);
  // }
  const finalSpells = await srdFiddling(uniqueSpells, "spells");

  // if (srdIcons) uniqueSpells = await copySRDIcons(srdSpells);

  return new Promise((resolve) => {
    resolve(updateCompendium("spells", { spells: finalSpells }, updateBool));
  });
}


