// Main module class
import { updateCompendium, srdFiddling, addMagicItemSpells, munchNote, getCampaignId, download } from "./import.js";
import logger from "../logger.js";
import { getRaces } from "./races/races.js";
import utils from "../utils.js";

function getRaceData() {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const campaignId = getCampaignId();
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey };
  const debugJson = game.settings.get("ddb-importer", "debug-json");

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/races`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        if (debugJson) {
          download(JSON.stringify(data), `races-raw.json`, "application/json");
        }
        if (!data.success) {
          munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        console.log(data);
        return data;
      })
      .then((data) => getRaces(data.data))
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
}

export async function parseRaces() {
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const srdIcons = game.settings.get("ddb-importer", "munching-policy-use-srd-icons");

  const results = await getRaceData();
  // let items = results.items;

  // const finalItems = await srdFiddling(items, "inventory");
  // const finalCount = finalItems.length;
  // munchNote(`Please be patient importing ${finalCount} items!`, true);

  // return new Promise((resolve) => {
  //   resolve(updateCompendium("inventory", { inventory: finalItems }, updateBool));
  // });

  return true;
}


