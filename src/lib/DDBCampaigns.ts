import logger from "./Logger";
import DDBProxy from "./DDBProxy";
import { postJson } from "./FetchHelper";
import PatreonHelper from "./PatreonHelper";
import * as Secrets from "./Secrets";
import utils from "./Utils";

export default class DDBCampaigns {

  static getCampaignId(notifier = null as ((msg: string, opts?: NotifierV1Props) => void) | null): string {
    const campaignId = utils.getSetting<string>("campaign-id").split("/").pop() ?? "";

    if (campaignId && campaignId !== "" && !Number.isInteger(parseInt(campaignId))) {
      if (notifier) notifier(`Campaign Id is invalid! Set to "${campaignId}", using empty string`, { nameField: true });
      logger.error(`Campaign Id is invalid! Set to "${campaignId}", using empty string`);
      return "";
    } else if (campaignId.includes("join")) {
      if (notifier) notifier(`Campaign URL is a join campaign link, using empty string! Set to "${campaignId}"`, { nameField: true });
      logger.error(`Campaign URL is a join campaign link, using empty string! Set to "${campaignId}"`);
      return "";
    }
    return campaignId;
  }

  static async getDDBCampaigns(cobalt: string | null = null): Promise<IDDBListCampaign[]> {
    const cobaltCookie = cobalt ? cobalt : Secrets.getCobalt();
    const parsingApi = DDBProxy.getProxy();
    const betaKey = PatreonHelper.getPatreonKey();
    const body = { cobalt: cobaltCookie, betaKey: betaKey };

    try {
      const data = await postJson(`${parsingApi}/proxy/campaigns`, body);
      if (data.success) {
        return data.data as IDDBListCampaign[];
      }
      logger.error(`Campaign fetch failed, got the following message: ${data.message}`, data);
      throw new Error(`Campaign fetch failed: ${data.message}`);
    } catch (error) {
      logger.error(`Campaign fetch error`, error);
      throw error;
    }
  }

  static async refreshCampaigns(cobalt = null as string | null) {
    if (cobalt) {
      const results = await DDBCampaigns.getDDBCampaigns(cobalt);
      CONFIG.DDBI.CAMPAIGNS = results;
    }
    return CONFIG.DDBI.CAMPAIGNS;
  }

  static async getAvailableCampaigns({ notifier = null, cobalt = null, campaignId = null }: {
    notifier?: ((msg: string, opts?: NotifierV1Props) => void) | null;
    cobalt?: string | null;
    campaignId?: string | null;
  } = {}) {
    if (CONFIG.DDBI.CAMPAIGNS) return CONFIG.DDBI.CAMPAIGNS;
    CONFIG.DDBI.CAMPAIGNS = [];
    if (!campaignId) campaignId = DDBCampaigns.getCampaignId(notifier);
    let campaigns: IDDBListCampaign[] = [];
    try {
      campaigns = await DDBCampaigns.getDDBCampaigns(cobalt);
    } catch (error) {
      logger.warn("Unable to fetch campaigns, falling back to selected campaign only", error);
    }

    if (!campaigns || campaigns.length === 0) {
      if (campaignId && campaignId.trim() !== "") {
        CONFIG.DDBI.CAMPAIGNS = [
          {
            id: parseInt(campaignId),
            name: "Unable to fetch campaigns, showing only selected",
            dmUsername: campaignId,
            dateCreated: null,
            playerCount: null,
            dmId: null,
          },
        ];
      }
    } else if (campaigns && campaigns.length > 0) {
      CONFIG.DDBI.CAMPAIGNS = campaigns;
    }

    const availableCampaigns = CONFIG.DDBI.CAMPAIGNS ?? [];
    availableCampaigns.forEach((campaign) => {
      const selected = parseInt(String(campaign.id)) === parseInt(campaignId);
      campaign.selected = selected;
    });

    return availableCampaigns;
  }

}
