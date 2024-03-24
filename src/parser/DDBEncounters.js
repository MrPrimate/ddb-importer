
import logger from "../logger.js";
import FileHelper from "../lib/FileHelper.js";
import { getCobalt } from "../lib/Secrets.js";
import DDBCampaigns from "../lib/DDBCampaigns.js";
import SETTINGS from "../settings.js";
import DDBProxy from "../lib/DDBProxy.js";
import DDBEncounterMunch from "../apps/DDBEncounterMunch.js";
import PatreonHelper from "../lib/PatreonHelper.js";

export default class DDBEncounters {

  constructor() {
    this.encounters = [];
  }

  static DIFFICULTY_LEVELS = [
    { id: null, name: "No challenge", color: "grey" },
    { id: 1, name: "Easy", color: "green" },
    { id: 2, name: "Medium", color: "brown" },
    { id: 3, name: "Hard", color: "orange" },
    { id: 4, name: "Deadly", color: "red" },
  ];

  static async getEncounterData() {
    const cobaltCookie = getCobalt();
    const betaKey = PatreonHelper.getPatreonKey();
    const parsingApi = DDBProxy.getProxy();
    const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");

    const body = {
      cobalt: cobaltCookie,
      betaKey: betaKey,
    };

    return new Promise((resolve, reject) => {
      fetch(`${parsingApi}/proxy/encounters`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body), // body data type must match "Content-Type" header
      })
        .then((response) => response.json())
        .then((data) => {
          if (!data.success) {
            DDBEncounterMunch.munchNote(`API Failure: ${data.message}`);
            reject(data.message);
          }
          if (debugJson) {
            FileHelper.download(JSON.stringify(data), `encounters-raw.json`, "application/json");
          }
          return data;
        })
        .then((data) => {
          DDBEncounterMunch.munchNote(`Retrieved ${data.data.length} encounters, starting parse...`, true, false);
          logger.info(`Retrieved ${data.data.length} encounters`);
          resolve(data.data);
        })
        .catch((error) => reject(error));
    });
  }

  async parseEncounters() {
    this.encounters = await DDBEncounters.getEncounterData();
    logger.debug("Fetched encounters", this.encounters);
    DDBEncounterMunch.munchNote(`Fetched Available DDB Encounters`);
    DDBEncounterMunch.munchNote("");
    return this.encounters;
  }

  async filterEncounters(campaignId) {
    const campaigns = await DDBCampaigns.getAvailableCampaigns();
    const campaignIds = campaigns.map((c) => c.id);
    const allEncounters = this.encounters.length !== 0 ? this.encounters : await this.parseEncounters();

    logger.debug(`${allEncounters.length} encounters`, allEncounters);
    logger.debug("CampaignIds", campaignIds);
    if (!campaignId || campaignId === "" || !campaignIds.includes(parseInt(campaignId))) return allEncounters;
    logger.debug(`CampaignId to find ${campaignId}`, { allEncounters, campaignId });
    const filteredEncounters = allEncounters.filter((encounter) => encounter.campaign?.id == campaignId);
    logger.debug(`${filteredEncounters.length} filtered encounters`, filteredEncounters);
    return filteredEncounters;
  }
}
