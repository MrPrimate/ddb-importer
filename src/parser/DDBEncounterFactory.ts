
import { logger, utils, FileHelper, Secrets, DDBCampaigns, DDBProxy, PatreonHelper, postJson } from "../lib/_module";
import DDBEncounter from "./encounters/DDBEncounter";

export default class DDBEncounterFactory {

  notifier: NotifierV1;
  notifierV2: INotifierV2 | null = null;
  encountersData: IDDBEncounter[];
  encounters: Record<string, DDBEncounter>;

  constructor({ notifier = null }: { notifier?: NotifierV1 | null } = {}) {
    this.notifier = notifier ?? ((note, { nameField = false, monsterNote = false, message = false, isError = false } = {}) => {
      logger.info(note, { nameField, monsterNote, message, isError });
    }) satisfies NotifierV1;

    this.encountersData = [];
    this.encounters = {};
  }

  static async getEncountersData(notifier: NotifierV1 | null = null): Promise<IDDBEncounter[]> {
    const cobaltCookie = Secrets.getCobalt();
    const betaKey = PatreonHelper.getPatreonKey();
    const parsingApi = DDBProxy.getProxy();
    const debugJson = utils.getSetting<boolean>("debug-json");

    const body = {
      cobalt: cobaltCookie,
      betaKey: betaKey,
    };

    const data = await postJson(`${parsingApi}/proxy/encounters`, body, { mode: "cors" }) as IDDBEncountersResponse;
    if (debugJson) {
      FileHelper.download(JSON.stringify(data), `encounters-raw.json`, "application/json");
    }
    if (!data.success) {
      if (notifier) notifier(`API Failure: ${data.message}`);
      return Promise.reject(data.message);
    }
    // if (notifier) notifier(`Retrieved ${data.data.length} encounters, starting parse...`, { nameField: true });
    logger.info(`Retrieved ${data.data.length} encounters`);
    return data.data;
  }

  async getEncounters(): Promise<IDDBEncounter[]> {
    this.encountersData = await DDBEncounterFactory.getEncountersData(this.notifier.bind(this));
    logger.debug("Fetched encounters", this.encountersData);
    this.notifier(`Fetched Available DDB Encounters`);
    this.notifier("");
    return this.encountersData;
  }

  async filterEncounters(campaignId: string | null = null): Promise<IDDBEncounter[]> {
    const campaigns = await DDBCampaigns.getAvailableCampaigns();
    const campaignIds = campaigns.map((c) => c.id);
    const allEncounters = this.encountersData.length !== 0 ? this.encountersData : await this.getEncounters();

    logger.debug(`${allEncounters.length} encounters`, allEncounters);
    logger.debug("CampaignIds", campaignIds);
    if (!campaignId || campaignId === "" || !campaignIds.includes(parseInt(campaignId))) return allEncounters;
    logger.debug(`CampaignId to find ${campaignId}`, { allEncounters, campaignId });
    const filteredEncounters = allEncounters.filter((encounter) => String(encounter.campaign?.id) === campaignId);
    logger.debug(`${filteredEncounters.length} filtered encounters`, filteredEncounters);
    return filteredEncounters;
  }

  async parseEncounter(id: string, { img = "", sceneId = "" }: { img?: string; sceneId?: string } = {}): Promise<IEncounterParsedData> {
    logger.debug(`Looking for Encounter "${id}"`);
    if (this.encountersData.length === 0) return {};

    const encounter = new DDBEncounter({
      notifier: this.notifier,
      ddbEncounterData: this.encountersData.find((e) => e.id === id),
      img,
      sceneId,
    });

    // console.warn("Parsing Encounter", {
    //   id,
    //   encounter,
    //   this: this,
    //   encountersData: this.encountersData,
    // });

    await encounter.parseEncounter();
    this.encounters[id] = encounter;
    return foundry.utils.deepClone(encounter.data);
  }

  async importEncounter(id: string, { img = null, sceneId = null }: { img?: string | null; sceneId?: string | null } = {}) {
    const encounter = this.encounters[id];
    await encounter.importEncounter({ img, sceneId });
  }

  resetEncounters() {
    this.encounters = {};
  }
}
