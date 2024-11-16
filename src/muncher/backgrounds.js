// Main module class
import {
  DDBCampaigns,
  Secrets,
  FileHelper,
  PatreonHelper,
  DDBProxy,
  utils,
} from "../lib/_module.mjs";
import { getBackgrounds } from "./backgrounds/backgrounds.js";
import { SETTINGS } from "../config/_module.mjs";
import { createDDBCompendium } from "../hooks/ready/checkCompendiums.js";

function getBackgroundData() {
  const cobaltCookie = Secrets.getCobalt();
  const campaignId = DDBCampaigns.getCampaignId(utils.munchNote);
  const parsingApi = DDBProxy.getProxy();
  const betaKey = PatreonHelper.getPatreonKey();
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
          utils.munchNote(`Failure: ${data.message}`);
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

  const backgroundsCompData = SETTINGS.COMPENDIUMS.find((c) => c.title === "Backgrounds");
  await createDDBCompendium(backgroundsCompData);

  const results = await getBackgroundData();

  return results;
}
