// Main module class
import { munchNote } from "./ddb.js";
import { getRaces } from "./races/races.js";
import { getCobalt } from "../lib/Secrets.js";
import { getCampaignId } from "../lib/Settings.js";
import FileHelper from "../lib/FileHelper.js";
import SETTINGS from "../settings.js";
import DDBProxy from "../lib/DDBProxy.js";

function getRaceData() {
  const cobaltCookie = getCobalt();
  const campaignId = getCampaignId();
  const parsingApi = DDBProxy.getProxy();
  const betaKey = game.settings.get(SETTINGS.MODULE_ID, "beta-key");
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey };
  const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");

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
          FileHelper.download(JSON.stringify(data), `races-raw.json`, "application/json");
        }
        if (!data.success) {
          munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data;
      })
      .then((data) => getRaces(data.data))
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
}

export async function parseRaces() {
  const results = await getRaceData();

  // FileHelper.download(JSON.stringify(results), `races-icon.json`, "application/json");

  return results;
}


