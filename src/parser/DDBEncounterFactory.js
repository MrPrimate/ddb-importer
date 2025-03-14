
import { logger, FileHelper, Secrets, DDBCampaigns, DDBProxy, PatreonHelper } from "../lib/_module.mjs";
import { SETTINGS } from "../config/_module.mjs";
import DDBEncounter from "./DDBEncounter.mjs";

export default class DDBEncounterFactory {

  constructor({ notifier = null } = {}) {
    this.notifier = notifier;

    if (!notifier) {
      this.notifier = (note, { nameField = false, monsterNote = false, message = false, isError = false } = {}) => {
        logger.info(note, { nameField, monsterNote, message, isError });
      };
    }
    this.encountersData = [];
    this.encounters = {};
  }

  static async getEncountersData(notifier = null) {
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
          // if (notifier) notifier(`Retrieved ${data.data.length} encounters, starting parse...`, { nameField: true });
          logger.info(`Retrieved ${data.data.length} encounters`);
          resolve(data.data);
        })
        .catch((error) => reject(error));
    });
  }

  async getEncounters() {
    this.encountersData = await DDBEncounterFactory.getEncountersData(this.notifier.bind(this));
    logger.debug("Fetched encounters", this.encountersData);
    this.notifier(`Fetched Available DDB Encounters`);
    this.notifier("");
    return this.encountersData;
  }

  async filterEncounters(campaignId) {
    const campaigns = await DDBCampaigns.getAvailableCampaigns();
    const campaignIds = campaigns.map((c) => c.id);
    const allEncounters = this.encountersData.length !== 0 ? this.encountersData : await this.getEncounters();

    logger.debug(`${allEncounters.length} encounters`, allEncounters);
    logger.debug("CampaignIds", campaignIds);
    if (!campaignId || campaignId === "" || !campaignIds.includes(parseInt(campaignId))) return allEncounters;
    logger.debug(`CampaignId to find ${campaignId}`, { allEncounters, campaignId });
    const filteredEncounters = allEncounters.filter((encounter) => encounter.campaign?.id == campaignId);
    logger.debug(`${filteredEncounters.length} filtered encounters`, filteredEncounters);
    return filteredEncounters;
  }

  async parseEncounter(id, { img = "", sceneId = "" } = {}) {
    logger.debug(`Looking for Encounter "${id}"`);
    if (this.encountersData.length === 0) return {};

    const encounter = new DDBEncounter({
      notifier: this.notifier,
      ddbEncounterData: this.encountersData.find((e) => e.id === id),
      img,
      sceneId,
    });

    console.warn("Parsing Encounter", {
      id,
      encounter,
      this: this,
      encountersData: this.encountersData,
    });

    await encounter.parseEncounter();
    this.encounters[id] = encounter;
    return foundry.utils.deepClone(encounter.data);
  }

  async importEncounter(id, { img = null, sceneId = null } = {}) {
    const encounter = this.encounters[id];
    await encounter.importEncounter({ img, sceneId });
  }

  resetEncounters() {
    this.encounters = {};
  }
}
