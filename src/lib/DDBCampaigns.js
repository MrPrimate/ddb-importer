import PatreonHelper from "../lib/PatreonHelper.js";
import DDBMuncher from "../apps/DDBMuncher.js";
import { getCobalt } from "./Secrets.js";
import logger from "../logger.js";
import DDBProxy from "./DDBProxy.js";


export default class DDBCampaigns {


  static getCampaignId() {
    const campaignId = game.settings.get("ddb-importer", "campaign-id").split("/").pop();

    if (campaignId && campaignId !== "" && !Number.isInteger(parseInt(campaignId))) {
      DDBMuncher.munchNote(`Campaign Id is invalid! Set to "${campaignId}", using empty string`, true);
      logger.error(`Campaign Id is invalid! Set to "${campaignId}", using empty string`);
      return "";
    } else if (campaignId.includes("join")) {
      DDBMuncher.munchNote(`Campaign URL is a join campaign link, using empty string! Set to "${campaignId}"`, true);
      logger.error(`Campaign URL is a join campaign link, using empty string! Set to "${campaignId}"`);
      return "";
    }
    return campaignId;
  }

  static getDDBCampaigns(cobalt = null) {
    const cobaltCookie = cobalt ? cobalt : getCobalt();
    const parsingApi = DDBProxy.getProxy();
    const betaKey = PatreonHelper.getPatreonKey();
    const body = { cobalt: cobaltCookie, betaKey: betaKey };

    return new Promise((resolve, reject) => {
      fetch(`${parsingApi}/proxy/campaigns`, {
        method: "POST",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body), // body data type must match "Content-Type" header
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            resolve(data.data);
          } else {
            logger.error(`Campaign fetch failed, got the following message: ${data.message}`, data);
            resolve([]);
          }
        })
        .catch((error) => {
          logger.error(`Cobalt cookie check error`);
          logger.error(error);
          logger.error(error.stack);
          reject(error);
        });
    });

  }

  static async refreshCampaigns(cobalt = null) {
    if (cobalt) {
      const results = await DDBCampaigns.getDDBCampaigns(cobalt);
      CONFIG.DDBI.CAMPAIGNS = results;
    }
    return CONFIG.DDBI.CAMPAIGNS;
  }

  static async getAvailableCampaigns() {
    if (CONFIG.DDBI.CAMPAIGNS) return CONFIG.DDBI.CAMPAIGNS;
    // eslint-disable-next-line require-atomic-updates
    CONFIG.DDBI.CAMPAIGNS = [];
    const campaignId = DDBCampaigns.getCampaignId();
    const campaigns = await DDBCampaigns.getDDBCampaigns();

    if (!campaigns || campaigns.length === 0) {
      if (campaignId && campaignId.trim() !== "") {
        // eslint-disable-next-line require-atomic-updates
        CONFIG.DDBI.CAMPAIGNS = [
          {
            id: campaignId,
            name: "Unable to fetch campaigns, showing only selected",
            dmUsername: campaignId,
          }
        ];
      }
    } else if (campaigns && campaigns.length > 0) {
      // eslint-disable-next-line require-atomic-updates
      CONFIG.DDBI.CAMPAIGNS = campaigns;
    }

    CONFIG.DDBI.CAMPAIGNS.forEach((campaign) => {
      const selected = parseInt(campaign.id) === parseInt(campaignId);
      campaign.selected = selected;
    });

    return CONFIG.DDBI.CAMPAIGNS;
  }

}
