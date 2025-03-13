
import { logger, FileHelper, Secrets, DDBCampaigns, DDBProxy, PatreonHelper } from "../lib/_module.mjs";
import { SETTINGS } from "../config/_module.mjs";

export default class DDBEncounters {

  constructor({ notifier = null } = {}) {
    this.notifier = notifier;

    if (!notifier) {
      this.notifier = (note, { nameField = false, monsterNote = false, message = false, isError = false } = {}) => {
        logger.info(note, { nameField, monsterNote, message, isError });
      };
    }
    this.encounters = [];
  }

  static DIFFICULTY_LEVELS = [
    { id: null, name: "No challenge", color: "grey" },
    { id: 1, name: "Easy", color: "green" },
    { id: 2, name: "Medium", color: "brown" },
    { id: 3, name: "Hard", color: "orange" },
    { id: 4, name: "Deadly", color: "red" },
  ];

  static async getEncounterData(notifier = null) {
    const cobaltCookie = Secrets.getCobalt();
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
            if (notifier) notifier(`API Failure: ${data.message}`);
            reject(data.message);
          }
          if (debugJson) {
            FileHelper.download(JSON.stringify(data), `encounters-raw.json`, "application/json");
          }
          return data;
        })
        .then((data) => {
          if (notifier) notifier(`Retrieved ${data.data.length} encounters, starting parse...`, { nameField: true });
          logger.info(`Retrieved ${data.data.length} encounters`);
          resolve(data.data);
        })
        .catch((error) => reject(error));
    });
  }

  async parseEncounters() {
    this.encounters = await DDBEncounters.getEncounterData(this.notifier.bind(this));
    logger.debug("Fetched encounters", this.encounters);
    this.notifier(`Fetched Available DDB Encounters`);
    this.notifier("");
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
