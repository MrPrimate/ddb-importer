import DDBMuncher from "./DDBMuncher.js";
import {
  logger,
  FileHelper,
  PatreonHelper,
  DDBCampaigns,
  Secrets,
} from "../lib/_module.mjs";
import { SETTINGS } from "../config/_module.mjs";


export default class DDBSetup extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-settings";
    options.template = "modules/ddb-importer/handlebars/settings.hbs";
    options.width = 500;
    return options;
  }

  static isSetupComplete(needsCobalt = true) {
    const uploadDir = game.settings.get(SETTINGS.MODULE_ID, "image-upload-directory");
    const dataDirSet = !FileHelper.BAD_DIRS.includes(uploadDir);
    const cobalt = Secrets.getCobalt() != "";
    const setupComplete = dataDirSet && (cobalt || !needsCobalt);
    return setupComplete;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Settings";
  }

  constructor({ callMuncher = false } = {}) {
    super();
    this.callMuncher = callMuncher;
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    const cobalt = Secrets.getCobalt();
    const isCobalt = cobalt !== "";
    const cobaltStatus = await Secrets.checkCobalt("", cobalt);
    const cobaltLocal = game.settings.get(SETTINGS.MODULE_ID, "cobalt-cookie-local");
    const key = PatreonHelper.getPatreonKey();
    const hasKey = key !== "";
    const campaignId = DDBCampaigns.getCampaignId();
    const tier = PatreonHelper.getPatreonTier();
    const patreonUser = game.settings.get(SETTINGS.MODULE_ID, "patreon-user");
    const validKeyObject = hasKey ? (await PatreonHelper.getPatreonValidity(key)) : false;
    const validKey = validKeyObject && validKeyObject.success && validKeyObject.data;
    const availableCampaigns = isCobalt && cobaltStatus.success ? await DDBCampaigns.getAvailableCampaigns() : [];

    this.campaignFallback = false;

    availableCampaigns.forEach((campaign) => {
      const selected = campaign.id == campaignId;
      campaign.selected = selected;
    });

    const setupConfig = {
      "cobalt-cookie": cobalt,
      "available-campaigns": availableCampaigns,
      "campaign-id": campaignId,
      "beta-key": key,
    };

    const setupComplete = isCobalt;

    return {
      campaignId,
      cobalt: isCobalt,
      cobaltLocal,
      setupConfig,
      setupComplete,
      tier,
      patreonLinked: patreonUser && patreonUser != "",
      patreonUser,
      validKey,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("#patreon-button").click(async (event) => {
      event.preventDefault();
      PatreonHelper.linkToPatreon();
    });
    html.find("#campaign-button").click(async (event) => {
      event.preventDefault();
      const cookie = html.find("#cobalt-cookie-input");
      const cookieStatus = await DDBSetup.checkCobaltCookie(cookie[0].value);
      if (!cookieStatus.success) return;
      const campaigns = await DDBCampaigns.refreshCampaigns(cookie[0].value);
      const list = html.find("#campaign-select");
      let campaignList = `<option value="">Select campaign:</option>`;
      if (!campaigns || (Array.isArray(campaigns) && campaigns.length === 0)) {
        this.campaignFallback = true;
        const fallback = html.find("#ddb-campaign-fallback");
        list[0].classList.add("ddbimporter-none");
        fallback[0].classList.remove("ddbimporter-none");
        logger.warn("Unable to fetch campaigns", campaigns);
      } else {
        if (Array.isArray(campaigns) && campaigns.length > 0) {
          campaigns.forEach((campaign) => {
            campaignList += `<option value="${campaign.id}">${campaign.name} (${campaign.dmUsername}) - ${campaign.id}</option>\n`;
          });
        }

        list[0].innerHTML = campaignList;
      }

    });
    html.find("#check-cobalt-button").click(async (event) => {
      event.preventDefault();
      const cookie = html.find("#cobalt-cookie-input");
      if (cookie[0].value === undefined) throw new Error("undefined");
      const cobaltStatus = await Secrets.checkCobalt("", cookie[0].value);
      const button = html.find("#check-cobalt-button");
      if (cobaltStatus.success) {
        button[0].innerHTML = "Check Cobalt Cookie - Success!";
      } else {
        button[0].innerHTML = "Check Cobalt Cookie - Failure!";
      }
    });


  }

  // eslint-disable-next-line class-methods-use-this
  static async checkCobaltCookie(value) {
    const cookieStatus = await Secrets.checkCobalt("", value);
    if (value !== "" && !cookieStatus.success) {
      $('#munching-task-setup').text(`Your Cobalt Cookie is invalid, please check that you pasted the right information.`);
      $('#ddb-importer-settings').css("height", "auto");
      throw new Error(`Your Cobalt Cookie is invalid, please check that you pasted the right information.`);
    }
    return cookieStatus;
  }

  static async setCobaltCookie(value, local) {
    await DDBSetup.checkCobaltCookie(value);
    await Secrets.setCobalt(value);
    await game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie-local", local);
    const runCookieMigrate = local != game.settings.get(SETTINGS.MODULE_ID, "cobalt-cookie-local");
    if (runCookieMigrate && local) {
      Secrets.moveCobaltToLocal();
    } else if (runCookieMigrate && !local) {
      Secrets.moveCobaltToSettings();
    }
  }

  /** @override */
  async _updateObject(event, formData) { // eslint-disable-line class-methods-use-this
    event.preventDefault();
    const campaignSelect = formData['campaign-select'];
    const fallbackCampaign = formData['campaign-fallback'];
    const campaignId = this.campaignFallback && fallbackCampaign && fallbackCampaign !== ""
      ? (fallbackCampaign ?? "")
      : campaignSelect == 0
        ? ""
        : campaignSelect;
    const cobaltCookie = formData['cobalt-cookie'];
    const cobaltCookieLocal = formData['cobalt-cookie-local'];
    const currentKey = PatreonHelper.getPatreonKey();

    if (currentKey !== formData['beta-key']) {
      await PatreonHelper.setPatreonKey(formData['beta-key']);
      await PatreonHelper.setPatreonTier();
    }

    await game.settings.set(SETTINGS.MODULE_ID, "campaign-id", campaignId);
    await DDBSetup.setCobaltCookie(cobaltCookie, cobaltCookieLocal);

    if (this.callMuncher && cobaltCookie === "") {
      $('#munching-task-setup').text(`To use Muncher you need to set a Cobalt Cookie value!`);
      $('#ddb-importer-settings').css("height", "auto");
      throw new Error(`To use Muncher you need to set a Cobalt Cookie value!`);
    } else if (this.callMuncher) {
      new DDBMuncher().render(true);
    }
  }
}
