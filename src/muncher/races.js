// Main module class
import {
  DDBCampaigns,
  Secrets,
  FileHelper,
  PatreonHelper,
  DDBProxy,
} from "../lib/_module.mjs";
import DDBMuncher from "../apps/DDBMuncher.js";
import { getRaces } from "./races/races.js";
import { SETTINGS } from "../config/_module.mjs";
import { createDDBCompendium } from "../hooks/ready/checkCompendiums.js";

function getRaceData() {
  const cobaltCookie = Secrets.getCobalt();
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


