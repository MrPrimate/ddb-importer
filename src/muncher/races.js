// Main module class
import DDBMuncher from "../apps/DDBMuncher.js";
import { getRaces } from "./races/races.js";
import { getCobalt } from "../lib/Secrets.js";
import DDBCampaigns from "../lib/DDBCampaigns.js";
import FileHelper from "../lib/FileHelper.js";
import SETTINGS from "../settings.js";
import DDBProxy from "../lib/DDBProxy.js";
import PatreonHelper from "../lib/PatreonHelper.js";
import { createDDBCompendium } from "../hooks/ready/checkCompendiums.js";

function getRaceData() {
  const cobaltCookie = getCobalt();
  const campaignId = DDBCampaigns.getCampaignId(DDBMuncher.munchNote);
  const parsingApi = DDBProxy.getProxy();
  const betaKey = PatreonHelper.getPatreonKey();
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
          DDBMuncher.munchNote(`Failure: ${data.message}`);
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

  const racesCompData = SETTINGS.COMPENDIUMS.find((c) => c.title === "Races");
  await createDDBCompendium(racesCompData);

  const traitCompData = SETTINGS.COMPENDIUMS.find((c) => c.title === "Racial Traits");
  await createDDBCompendium(traitCompData);

  const results = await getRaceData();

  // FileHelper.download(JSON.stringify(results), `races-icon.json`, "application/json");

  return results;
}


