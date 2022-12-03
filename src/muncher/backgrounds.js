// Main module class
import DDBMuncher from "./DDBMuncher.js";
import { getBackgrounds } from "./backgrounds/backgrounds.js";
import { getCobalt } from "../lib/Secrets.js";
import { getCampaignId } from "../lib/Settings.js";
import FileHelper from "../lib/FileHelper.js";
import SETTINGS from "../settings.js";
import DDBProxy from "../lib/DDBProxy.js";

function getBackgroundData() {
  const cobaltCookie = getCobalt();
  const campaignId = getCampaignId();
  const parsingApi = DDBProxy.getProxy();
  const betaKey = game.settings.get(SETTINGS.MODULE_ID, "beta-key");
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey };
  const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/backgrounds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        if (debugJson) {
          FileHelper.download(JSON.stringify(data), `backgrounds-raw.json`, "application/json");
        }
        if (!data.success) {
          DDBMuncher.munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data;
      })
      .then((data) => getBackgrounds(data.data))
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
}

export async function parseBackgrounds() {
  const results = await getBackgroundData();

  return results;
}
