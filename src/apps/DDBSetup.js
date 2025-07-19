import DDBMuncher from "./DDBMuncher.js";
import {
  logger,
  FileHelper,
  PatreonHelper,
  DDBCampaigns,
  Secrets,
} from "../lib/_module.mjs";
import { SETTINGS } from "../config/_module.mjs";
import DDBAppV2 from "./DDBAppV2.js";


export default class DDBSetup extends DDBAppV2 {
  constructor({
    actor = null, callMuncher = false, sheetTab = "info", coreTab = "cobalt", infoTab = "intro",
    showDiscouraged = false,
  } = {}) {
    super();
    this.callMuncher = callMuncher;
    this.actor = actor;
    this.sheetTab = sheetTab;
    this.coreTab = coreTab;
    this.infoTab = infoTab;
    this.tabGroups["sheet"] = this.sheetTab;
    this.tabGroups["info"] = this.infoTab;
    this.tabGroups["core"] = this.coreTab;
    this.showDiscouraged = showDiscouraged;
  }

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    id: "ddb-importer-settings",
    classes: ["standard-form", "dnd5e2"],
    actions: {
      connectToPatreonButton: DDBSetup.connectToPatreonButton,
      fetchCampaignsButton: DDBSetup.fetchCampaignsButton,
      checkCobaltButton: DDBSetup.checkCobaltButton,
      goToCobaltTab: DDBSetup.goToCobaltTab,
      goToCampaignTab: DDBSetup.goToCampaignTab,
      goToPatreonTab: DDBSetup.goToPatreonTab,
    },
    position: {
      width: "900",
      height: "auto",
    },
    tag: "form",
    form: {
      handler: DDBSetup.formHandler,
      submitOnChange: false,
      closeOnSubmit: false,
    },
    window: {
      icon: 'fab fa-d-and-d-beyond',
      resizable: true,
      minimizable: true,
      subtitle: "",
    },
  };

  static isSetupComplete(needsCobalt = true) {
    const uploadDir = game.settings.get(SETTINGS.MODULE_ID, "image-upload-directory");
    const dataDirSet = !FileHelper.BAD_DIRS.includes(uploadDir);
    const cobalt = Secrets.getCobalt() != "";
    const setupComplete = dataDirSet && (cobalt || !needsCobalt);
    return setupComplete;
  }

  get id() {
    return `ddb-importer-settings-${this.actor?.id ?? "core"}`;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Settings";
  }

  static PARTS = {
    header: { template: "modules/ddb-importer/handlebars/settings/header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },

    info: {
      template: "modules/ddb-importer/handlebars/settings/info.hbs",
      templates: [
        "modules/ddb-importer/handlebars/settings/info/intro.hbs",
        "modules/ddb-importer/handlebars/settings/info/help.hbs",
      ],
    },
    core: {
      template: "modules/ddb-importer/handlebars/settings/core.hbs",
      templates: [
        "modules/ddb-importer/handlebars/settings/core/cobalt.hbs",
        "modules/ddb-importer/handlebars/settings/core/campaign.hbs",
        "modules/ddb-importer/handlebars/settings/core/patreon.hbs",
      ],
    },

    footer: { template: "modules/ddb-importer/handlebars/settings/footer.hbs" },
  };

  tabGroups = {
    sheet: this.sheetTab ?? "info",
    info: this.infoTab ?? "intro",
    core: this.coreTab ?? "cobalt",
  };

  _getTabs() {
    const tabs = this._markTabs({
      info: {
        id: "info", group: "sheet", label: "Info", icon: "fas fa-info",
        tabs: {
          intro: {
            id: "intro", group: "info", label: "Introduction", icon: "fas fa-info",
          },
          help: {
            id: "help", group: "info", label: "Help", icon: "fas fa-question",
          },
        },
      },
      core: {
        id: "core", group: "sheet", label: "Core Settings", icon: "fas fa-dungeon",
        tabs: {
          cobalt: {
            id: "cobalt", group: "core", label: "Cobalt Cookie", icon: "fas fa-cookie-bite",
          },
          campaign: {
            id: "campaign", group: "core", label: "Campaign", icon: "fas fa-users",
          },
          patreon: {
            id: "patreon", group: "core", label: "Patreon", icon: "fa-brands fa-patreon",
          },
        },
      },
    });
    return tabs;
  }

  /* -------------------------------------------- */
  /*  Life-Cycle Handlers                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  _onRender(context, options) {
    super._onRender(context, options);
  }

  async _prepareContext(options) {

    let context = {
      isCobalt: false,
      cobaltLocal: false,
      setupConfig: {
        "cobalt-cookie": "",
        "available-campaigns": [],
        "campaign-id": "",
        "patreon-key": "",
      },
      setupComplete: false,
      tier: "",
      patreonLinked: false,
      patreonUser: "",
      validKey: false,
      validCobalt: false,
      failure: false,
      version: game.modules.get(SETTINGS.MODULE_ID)?.version ?? "unknown",
    };

    const timeout = setTimeout(async() => {
      context = foundry.utils.mergeObject(await super._prepareContext(options), context, { inplace: false });
      logger.debug("Fallback Settings: _prepareContext", context);
      context.failure = true;
      return context;
    }, 10000);

    context.setupConfig["cobalt-cookie"] = Secrets.getCobalt();
    context.isCobalt = context.setupConfig["cobalt-cookie"] !== "";
    context.cobaltLocal = game.settings.get(SETTINGS.MODULE_ID, "cobalt-cookie-local");

    const key = PatreonHelper.getPatreonKey();
    context.setupConfig["patreon-key"] = key;
    const hasKey = key !== "";
    const campaignId = DDBCampaigns.getCampaignId();
    context.setupConfig["campaign-id"] = campaignId;
    context.tier = PatreonHelper.getPatreonTier();
    const patreonUser = game.settings.get(SETTINGS.MODULE_ID, "patreon-user");
    context.patreonUser = patreonUser;
    context.patreonLinked = patreonUser && patreonUser != "";
    const validKeyObject = hasKey ? (await PatreonHelper.getPatreonValidity(key)) : false;
    // eslint-disable-next-line require-atomic-updates
    context.validKey = validKeyObject && validKeyObject.success && validKeyObject.data;

    const cobaltStatus = await Secrets.checkCobalt("", context.setupConfig["cobalt-cookie"]);
    // eslint-disable-next-line require-atomic-updates
    context.validCobalt = cobaltStatus.success;
    const availableCampaigns = context.isCobalt && cobaltStatus.success
      ? await DDBCampaigns.getAvailableCampaigns()
      : [];

    this.campaignFallback = false;

    availableCampaigns.forEach((campaign) => {
      const selected = campaign.id == campaignId;
      campaign.selected = selected;
    });

    // eslint-disable-next-line require-atomic-updates
    context.setupConfig["available-campaigns"] = availableCampaigns;
    // eslint-disable-next-line require-atomic-updates
    context.setupComplete = context.isCobalt;
    clearTimeout(timeout);

    context = foundry.utils.mergeObject(await super._prepareContext(options), context, { inplace: false });

    logger.debug("Settings: _prepareContext", context);
    return context;
  }

  /** @override */
  // eslint-disable-next-line class-methods-use-this
  async _preparePartContext(partId, context) {
    switch (partId) {
      case "info":
      case "core": {
        context.tab = context.tabs[partId];
        break;
      }
      // no default
    };
    return context;
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

  /**
   * Process form submission for the sheet
   * @this {DDBLocationSetup}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async formHandler(event, form, formData) {
    event.preventDefault();
    const campaignSelect = formData.object['campaign-select'];
    const fallbackCampaign = formData.object['campaign-fallback'];
    const campaignId = this.campaignFallback && fallbackCampaign && fallbackCampaign !== ""
      ? (fallbackCampaign ?? "")
      : campaignSelect == 0
        ? ""
        : campaignSelect;
    const cobaltCookie = formData.object['cobalt-cookie'];
    const cobaltCookieLocal = formData.object['cobalt-cookie-local'];
    const currentKey = PatreonHelper.getPatreonKey();

    if (currentKey !== formData.object['patreon-key']) {
      await PatreonHelper.setPatreonKey(formData.object['patreon-key']);
      await PatreonHelper.setPatreonTier();
    }

    try {
      await DDBSetup.setCobaltCookie(cobaltCookie, cobaltCookieLocal);
    } catch (error) {
      if (cobaltCookie !== "") {
        ui.notifications.error("Error validating your cobalt cookie!");
      }
    }
    await game.settings.set(SETTINGS.MODULE_ID, "campaign-id", campaignId);
    await DDBSetup.setCobaltCookie(cobaltCookie, cobaltCookieLocal);

    if (this.callMuncher && cobaltCookie === "") {
      ui.notifications.error("To use DDB Muncher you need to set a Cobalt Cookie value!");
      // throw new Error(`To use Muncher you need to set a Cobalt Cookie value!`);
    } else if (this.callMuncher) {
      new DDBMuncher().render(true);
      this.close();
    } else {
      this.close();
    }
  }

  static connectToPatreonButton(event) {
    event.preventDefault();
    PatreonHelper.linkToPatreon(this.element);
  }

  static async fetchCampaignsButton(event) {
    event.preventDefault();
    const cookie = this.element.querySelector("#cobalt-cookie-input");
    const cookieStatus = await DDBSetup.checkCobaltCookie(cookie.value);
    if (!cookieStatus.success) return;
    const campaigns = await DDBCampaigns.refreshCampaigns(cookie.value);
    const list = this.element.querySelector("#campaign-select");
    let campaignList = `<option value="">Select campaign:</option>`;
    if (!campaigns || (Array.isArray(campaigns) && campaigns.length === 0)) {
      this.campaignFallback = true;
      const fallback = this.element.querySelector("#ddb-campaign-fallback");
      list.classList.add("ddbimporter-none");
      fallback.classList.remove("ddbimporter-none");
      logger.warn("Unable to fetch campaigns", campaigns);
    } else {
      if (Array.isArray(campaigns) && campaigns.length > 0) {
        campaigns.forEach((campaign) => {
          campaignList += `<option value="${campaign.id}">${campaign.name} (${campaign.dmUsername}) - ${campaign.id}</option>\n`;
        });
      }

      list.innerHTML = campaignList;
    }
  }

  static async checkCobaltButton(event) {
    event.preventDefault();
    const cookie = this.element.querySelector("#cobalt-cookie-input");
    if (cookie.value === undefined) throw new Error("undefined");
    const cobaltStatus = await Secrets.checkCobalt("", cookie.value);
    const button = this.element.querySelector("#check-cobalt-button");
    if (cobaltStatus.success) {
      button.innerHTML = "Check Cobalt Cookie - Success!";
    } else {
      button.innerHTML = "Check Cobalt Cookie - Failure!";
    }
  }

  static goToCobaltTab(event) {
    event.preventDefault();
    this.changeTab("cobalt", "core", {});
  }

  static goToCampaignTab(event) {
    event.preventDefault();
    this.changeTab("campaign", "core", {});
  }

  static goToPatreonTab(event) {
    event.preventDefault();
    this.changeTab("patreon", "core", {});
  }

}
