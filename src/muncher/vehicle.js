import { munchNote, getCampaignId, download, getCompendium, getCompendiumLabel } from "./utils.js";
import { getCobalt } from "../lib/Secrets.js";

export function getVehicleData() {
  const cobaltCookie = getCobalt();
  const campaignId = getCampaignId();
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey };
  const debugJson = game.settings.get("ddb-importer", "debug-json");

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/vehicles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        if (debugJson) {
          download(JSON.stringify(data), `vehicles-raw.json`, "application/json");
        }
        if (!data.success) {
          munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data;
      })
      .then((data) => resolve(data.data))
      .catch((error) => reject(error));
  });
}


window.DDBTest = getVehicleData;
