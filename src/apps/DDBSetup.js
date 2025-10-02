import DDBMuncher from "./DDBMuncher.js";
import {
  logger,
  FileHelper,
  PatreonHelper,
  DDBCampaigns,
  Secrets,
  CompendiumHelper,
  DDBProxy,
  MuncherSettings,
} from "../lib/_module.mjs";
import { SETTINGS } from "../config/_module.mjs";
import DDBAppV2 from "./DDBAppV2.js";
import DDBCharacterManager from "./DDBCharacterManager.js";
import DDBDebugger from "./DDBDebugger.mjs";


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

    // CORE SETTINGS
    this.cobalt = Secrets.getCobalt();
    this.cobaltCheckMessage = "";
    this.campaignId = DDBCampaigns.getCampaignId();
    this.closeOnSave = true; // close on save by default
    this.reloadApplication = false; // reload the application after saving
    this.isLocalCobalt = game.settings.get(SETTINGS.MODULE_ID, "cobalt-cookie-local");
    this.patreonCheckMessage = "";
    this.patreonKey = PatreonHelper.getPatreonKey();
    this.patreonTier = PatreonHelper.getPatreonTier();
    this.patreonUser = PatreonHelper.getPatreonUser();

    // LOCATIONS
    this.useWebP = game.settings.get(SETTINGS.MODULE_ID, "use-webp");
    this.useDeepFilePaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");
    this.directories = [];
    for (const [key, value] of Object.entries(SETTINGS.DEFAULT_SETTINGS.READY.DIRECTORIES)) {
      this.directories.push({
        key,
        value: game.settings.get(SETTINGS.MODULE_ID, key),
        name: game.i18n.localize(value.name),
        description: game.i18n.localize(value.hint),
      });
    }

    // COMPENDIUMS
    this.compendiums = SETTINGS.COMPENDIUMS.map((comp) => ({
      setting: comp.setting,
      name: comp.title,
      current: game.settings.get(SETTINGS.MODULE_ID, comp.setting),
      compendiums: CompendiumHelper.getCompendiumLookups(comp.type, game.settings.get(SETTINGS.MODULE_ID, comp.setting)),
      auto: comp.auto,
    }));
    this.compendiumSettings = [
      {
        name: "auto-create-compendium",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "auto-create-compendium"),
        description: "Create default compendiums if missing?",
        enabled: true,
      },
    ];

    // DYNAMIC SYNC
    this.dynamicEnabledSettings = [
      {
        name: "dynamic-sync",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync"),
        description: game.i18n.localize(`${SETTINGS.MODULE_ID}.settings.dynamic-sync.dynamic-sync`),
        enabled: true,
      },
    ];
    this.dynamicPolicySettings = Object.keys(SETTINGS.DEFAULT_SETTINGS.READY.CHARACTER.DYNAMIC_SYNC)
      .map((key) => {
        return {
          name: key,
          isChecked: game.settings.get(SETTINGS.MODULE_ID, key),
          description: game.i18n.localize(`${SETTINGS.MODULE_ID}.settings.dynamic-sync.${key}`),
          enabled: true,
        };
      });
    this.gmUsers = DDBSetup.getGMUsers();
    this.dynamicEnabled = false;

    // PROXY
    this.useCustomProxy = DDBProxy.isCustom();
    this.defaultAddress = SETTINGS.URLS.PROXY;
    this.proxyAddress = game.settings.get(SETTINGS.MODULE_ID, "api-endpoint");

    // enhancements
    this.allowedWeaponPropertySources = game.settings.get(SETTINGS.MODULE_ID, "allowed-weapon-property-sources");
    this.enhancementConfig = MuncherSettings.getEnhancementSettings();
  }

  static openDebug(_event, _target) {
    new DDBDebugger().render(true);
  }

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    id: "ddb-importer-settings",
    classes: ["standard-form", "dnd5e2"],
    actions: {
      connectToPatreonButton: DDBSetup.connectToPatreonButton,
      fetchCampaignsButton: DDBSetup.fetchCampaignsButton,
      checkCobaltButton: DDBSetup.checkCobaltButton,
      checkPatreonButton: DDBSetup.checkPatreonButton,
      goToCobaltTab: DDBSetup.goToCobaltTab,
      goToCampaignTab: DDBSetup.goToCampaignTab,
      goToPatreonTab: DDBSetup.goToPatreonTab,
      resetSettings: DDBSetup.resetSettingsDialog,
      selectDirectory: DDBSetup.selectDirectory,
      openDebug: DDBSetup.openDebug,
    },
    position: {
      width: "962",
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

  static getGMUsers() {
    const updateUser = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync-user");

    const gmUsers = game.users
      .filter((user) => user.isGM)
      .reduce((choices, user) => {
        choices.push({
          userId: user.id,
          userName: user.name,
          selected: user.id === updateUser,
        });
        return choices;
      }, []);

    return gmUsers;
  }

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
    locations: {
      template: "modules/ddb-importer/handlebars/settings/locations.hbs",
    },
    compendiums: {
      template: "modules/ddb-importer/handlebars/settings/compendiums.hbs",
    },
    dynamic: {
      template: "modules/ddb-importer/handlebars/settings/dynamic.hbs",
    },
    proxy: {
      template: "modules/ddb-importer/handlebars/settings/proxy.hbs",
    },
    enhancements: {
      template: "modules/ddb-importer/handlebars/settings/enhancements.hbs",
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
      locations: {
        id: "locations", group: "sheet", label: "Locations", icon: "fas fa-map-marker-alt",
      },
      compendiums: {
        id: "compendiums", group: "sheet", label: "Compendiums", icon: "fas fa-book",
      },
      dynamic: {
        id: "dynamic", group: "sheet", label: "Dynamic Sync", icon: "fas fa-sync",
      },
      proxy: {
        id: "proxy", group: "sheet", label: "Proxy", icon: "fas fa-ethernet",
      },
      enhancements: {
        id: "enhancements", group: "sheet", label: "Enhancements", icon: "fas fa-magic",
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
      // core
      isCobalt: this.cobalt !== "",
      cobaltLocal: this.isLocalCobalt,
      setupConfig: {
        "cobalt-cookie": this.cobalt,
        "available-campaigns": [],
        "campaign-id": "",
        "patreon-key": "",
      },
      cobaltCheckMessage: this.cobaltCheckMessage,
      setupComplete: false,
      tier: "",
      patreonLinked: false,
      patreonUser: "",
      validKey: false,
      validCobalt: false,
      patreonCheckMessage: this.patreonCheckMessage,
      failure: false,
      version: game.modules.get(SETTINGS.MODULE_ID)?.version ?? "unknown",
      // locations
      "use-webp": this.useWebP,
      "use-deep-file-paths": this.useDeepFilePaths,
      directories: this.directories,
      // compendiums
      compendiums: this.compendiums,
      compendiumSettings: this.compendiumSettings,
      // dynamic
      dynamicEnabledSettings: this.dynamicEnabledSettings,
      dynamicPolicySettings: this.dynamicPolicySettings,
      gmUsers: this.gmUsers,
      dynamicEnabled: this.dynamicEnabled,
      // proxy
      useCustomProxy: this.useCustomProxy,
      defaultAddress: this.defaultAddress,
      proxyAddress: this.proxyAddress,
    };

    options.noCacheLoad = true;
    context = foundry.utils.mergeObject(await super._prepareContext(options), context, { inplace: false });

    logger.debug("Settings: _prepareContext", context);
    return context;
  }

  async _prepareCoreContext(context) {
    const timeout = setTimeout(async() => {
      logger.debug("Fallback Settings: _prepareCoreContext", context);
      context.failure = true;
      return context;
    }, 10000);

    context.setupConfig["patreon-key"] = this.patreonKey;
    const hasKey = this.patreonKey !== "";
    context.setupConfig["campaign-id"] = this.campaignId;
    context.tier = this.patreonTier;
    context.patreonUser = this.patreonUser;
    context.patreonLinked = this.patreonUser && this.patreonUser != "";
    const validKeyObject = hasKey ? (await PatreonHelper.getPatreonValidity(this.patreonKey)) : false;
    // eslint-disable-next-line require-atomic-updates
    context.validKey = validKeyObject && validKeyObject.success && validKeyObject.data;

    try {
      const cobaltStatus = await Secrets.checkCobalt("", context.setupConfig["cobalt-cookie"]);
      // eslint-disable-next-line require-atomic-updates
      context.validCobalt = cobaltStatus.success;
    } catch (error) {
      logger.error("Failed to validate cobalt cookie", { error });
      logger.error(error.stack);
      // eslint-disable-next-line require-atomic-updates
      context.validCobalt = false;
    }

    const availableCampaigns = context.isCobalt && context.validCobalt
      ? await DDBCampaigns.getAvailableCampaigns({
        campaignId: this.campaignId === "" ? null : this.campaignId,
        cobalt: this.cobalt,
      })
      : [];

    this.campaignFallback = false;

    availableCampaigns.forEach((campaign) => {
      const selected = campaign.id == this.campaignId;
      campaign.selected = selected;
    });

    // eslint-disable-next-line require-atomic-updates
    context.setupConfig["available-campaigns"] = availableCampaigns;
    // eslint-disable-next-line require-atomic-updates
    context.setupComplete = context.isCobalt;
    clearTimeout(timeout);

    logger.debug("Settings: _prepareCoreContext", context);
    return context;
  }

  // eslint-disable-next-line class-methods-use-this
  async _prepareDynamicContext(context) {
    const tier = PatreonHelper.getPatreonTier();
    const tiers = PatreonHelper.calculateAccessMatrix(tier);
    this.dynamicEnabled = tiers.experimentalMid;
    context.dynamicEnabled = this.dynamicEnabled;

    logger.debug("Settings: _prepareDynamicContext", context);
    return context;
  }

  // eslint-disable-next-line class-methods-use-this
  async _prepareEnhancementsContext(context) {
    const allowedSourceIds = this.allowedWeaponPropertySources;
    const selectedSources = MuncherSettings.getSourcesLookups(allowedSourceIds).map((source) => {
      const data = foundry.utils.deepClone(source);
      if (source.selected) {
        data.selected = "selected";
      } else {
        data.selected = "";
      }
      return data;
    });
    context.selectedWeaponPropertiesEnhancementsSources = selectedSources;
    context.enhancementConfig = this.enhancementConfig;

    logger.debug("Settings: _prepareEnhancementsContext", context);
    return context;
  }

  /** @override */
  // eslint-disable-next-line class-methods-use-this
  async _preparePartContext(partId, context) {
    switch (partId) {
      case "core": {
        context = await this._prepareCoreContext(context);
        break;
      }
      case "dynamic": {
        await this._prepareDynamicContext(context);
        break;
      }
      case "enhancements": {
        await this._prepareEnhancementsContext(context);
        break;
      }
      // no default
    };
    context.tab = context.tabs[partId];
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

  async patreonRefresh() {
    const tierData = await PatreonHelper.fetchPatreonTier(false, this.patreonKey);
    this.patreonTier = tierData.data;
    this.patreonUser = tierData.email;
  }

  static async connectToPatreonButton(event) {
    event.preventDefault();
    await PatreonHelper.linkToPatreon(async (data) => {
      // Callback after linking to Patreon
      this.patreonKey = data.key;
      this.patreonTier = data.tier;
      this.patreonUser = data.email;
      this.render();
    });
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
    if (cobaltStatus.success) {
      this.cobaltCheckMessage = " - Success!";
      this.cobalt = cookie.value;
      await this.render();
    } else {
      this.cobaltCheckMessage = " - Failure!";
    }
  }

  static async checkPatreonButton(event) {
    event.preventDefault();
    const key = this.element.querySelector("#ddb-patreon-key").value;
    this.patreonKey = key;
    const success = await PatreonHelper.isValidKey(false, false, key);
    this.patreonCheckMessage = success ? " - Success!" : " - Failure!";
    await this.patreonRefresh();
    await this.render();
  }

  static goToCobaltTab(event) {
    event.preventDefault();
    this.changeTab("core", "sheet", {});
    this.changeTab("cobalt", "core", {});
  }

  static goToCampaignTab(event) {
    event.preventDefault();
    this.changeTab("core", "sheet", {});
    this.changeTab("campaign", "core", {});
  }

  static goToPatreonTab(event) {
    event.preventDefault();
    this.changeTab("core", "sheet", {});
    this.changeTab("patreon", "core", {});
  }

  static async resetSettingsDialog(event) {
    event.preventDefault();

    const dialog = await foundry.applications.api.DialogV2.confirm({
      rejectClose: false,
      window: {
        title: game.i18n.localize(`${SETTINGS.MODULE_ID}.Dialogs.ResetSettings.Title`),
      },
      content: `<p class="${SETTINGS.MODULE_ID}-dialog-important">${game.i18n.localize(
        `${SETTINGS.MODULE_ID}.Dialogs.ResetSettings.Content`,
      )}</p>`,
    });

    logger.warn("Resetting settings to defaults", dialog);

    if (dialog) {
      for (const [name, data] of Object.entries(SETTINGS.GET_DEFAULT_SETTINGS())) {
        await game.settings.set(SETTINGS.MODULE_ID, name, data.default);
      }
      for (const [name, data] of Object.entries(SETTINGS.GET_DEFAULT_SETTINGS(true))) {
        await game.settings.set(SETTINGS.MODULE_ID, name, data.default);
      }
      window.location.reload();
    }

  }

  static async selectDirectory(event, target) {
    const targetDirSetting = target.dataset.target;
    const currentDir = game.settings.get(SETTINGS.MODULE_ID, targetDirSetting);
    // const parsedDir = FileHelper.parseDirectory(currentDir);
    const current = await FileHelper.getFileUrl(currentDir, "");

    const filePicker = new foundry.applications.apps.FilePicker.implementation({
      type: "folder",
      current: current,
      // source: parsedDir.activeSource,
      // activeSource: parsedDir.activeSource,
      // bucket: parsedDir.bucket,
      callback: async (path, picker) => {
        const activeSource = picker.activeSource;
        const bucket = activeSource === "s3" && picker.sources.s3?.bucket && picker.sources.s3.bucket !== ""
          ? picker.sources.s3.bucket
          : null;

        const formattedPath = FileHelper.formatDirectoryPath({
          activeSource,
          bucket,
          path,
        });

        this.element.querySelector(`input[name='${targetDirSetting}']`).value = formattedPath;
      },
    });
    filePicker.render();

  }


  async _saveCore(formData) {
    const currentKey = PatreonHelper.getPatreonKey();

    if (currentKey !== formData.object['patreon-key']) {
      await PatreonHelper.setPatreonKey(formData.object['patreon-key']);
      await PatreonHelper.setPatreonTier();
    }

    const cobaltCookie = formData.object['cobalt-cookie'];
    const cobaltCookieLocal = formData.object['cobalt-cookie-local'] ?? true;
    const currentCobalt = Secrets.getCobalt();

    if (currentCobalt !== cobaltCookie) {
      try {
        await DDBSetup.setCobaltCookie(cobaltCookie, cobaltCookieLocal);
      } catch (error) {
        if (cobaltCookie !== "") {
          ui.notifications.error("Error validating your cobalt cookie!");
        }
      }
    }

    const currentLocalCobalt = game.settings.get(SETTINGS.MODULE_ID, "cobalt-cookie-local");
    if (currentLocalCobalt !== cobaltCookieLocal) {
      await game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie-local", cobaltCookieLocal);
    }

    const campaignSelect = formData.object['campaign-select'];
    const fallbackCampaign = formData.object['campaign-fallback'];
    const campaignId = this.campaignFallback && fallbackCampaign && fallbackCampaign !== ""
      ? (fallbackCampaign ?? "")
      : campaignSelect == 0
        ? ""
        : campaignSelect;

    await game.settings.set(SETTINGS.MODULE_ID, "campaign-id", campaignId);

    if (cobaltCookie === "") {
      ui.notifications.error("To use DDB Importer you need to set a Cobalt Cookie value!");
      // throw new Error(`To use Muncher you need to set a Cobalt Cookie value!`);
    } else if (this.callMuncher) {
      new DDBMuncher().render(true);
    } else if (this.actor) {
      const characterImport = new DDBCharacterManager(DDBCharacterManager.defaultOptions, this.actor);
      characterImport.render(true);
    }
  }

  async _saveLocations(formData) {
    const directoryStatus = [];

    for (const [key, data] of Object.entries(SETTINGS.DEFAULT_SETTINGS.READY.DIRECTORIES)) {
      const newValue = formData.object[key];
      directoryStatus.push({
        key,
        value: newValue,
        isBad: FileHelper.BAD_DIRS.includes(newValue),
        isValid: await FileHelper.verifyPath(FileHelper.parseDirectory(newValue)),
        name: game.i18n.localize(data.name),
      });
    }

    if (directoryStatus.some((dir) => dir.isBad)) {
      for (const data of directoryStatus.filter((dir) => dir.isBad)) {
        ui.notifications.error(
          `Please set the image upload directory for ${data.name} to something other than the root.`,
          { permanent: true },
        );
        logger.error("Error setting Image directory", {
          directoryStatus,
          data,
        });
        this.closeOnSave = false; // don't close if there is an error
      }
    } else if (directoryStatus.some((dir) => !dir.isValid)) {
      for (const data of directoryStatus.filter((dir) => !dir.isValid)) {
        ui.notifications.error(
          `Directory Validation Failed for ${data.name} please check it exists and can be written to.`,
          { permanent: true },
        );
        logger.error("Error validating Image directory", {
          directoryStatus,
          data,
        });
        this.closeOnSave = false; // don't close if there is an error
      }
    } else {
      // save changes
      for (const data of directoryStatus.filter((dir) => !dir.isBad)) {
        await game.settings.set(SETTINGS.MODULE_ID, data.key, data.value);
      }
      const useWebP = formData.object['use-webp'];
      const useDeepFilePaths = formData.object['use-deep-file-paths'];

      if (this.useWebP !== useWebP) await game.settings.set(SETTINGS.MODULE_ID, "use-webp", useWebP);
      if (this.useDeepFilePaths !== useDeepFilePaths) {
        await game.settings.set(SETTINGS.MODULE_ID, "use-deep-file-paths", useDeepFilePaths);
      }
    }

  }

  async _saveCompendiums(formData) {
    for (const setting of this.compendiumSettings) {
      logger.debug(`Saving setting ${setting.name} with value ${formData.object[setting.name]}`);
      await game.settings.set(SETTINGS.MODULE_ID, setting.name, formData.object[setting.name]);
    }

    for (const compendium of this.compendiums) {
      logger.debug(`Saving compendium setting ${compendium.setting} with value ${formData.object[compendium.setting]}`);
      await game.settings.set(SETTINGS.MODULE_ID, compendium.setting, formData.object[compendium.setting]);
    }
  }

  async _saveDynamic(formData) {
    if (this.dynamicEnabled !== formData.object["dynamic-sync"]) {
      this.reloadApplication = true; // reload the application after saving
      logger.warn("Dynamic Sync setting changed, reloading application!");
    }

    if (!this.dynamicEnabled) {
      game.settings.set(SETTINGS.MODULE_ID, "dynamic-sync", false);
      return;
    }
    for (const setting of this.dynamicEnabledSettings) {
      logger.debug(`Saving setting ${setting.name} with value ${formData.object[setting.name]}`);
      await game.settings.set(SETTINGS.MODULE_ID, setting.name, formData.object[setting.name]);
    }
    for (const setting of this.dynamicPolicySettings) {
      logger.debug(`Saving setting ${setting.name} with value ${formData.object[setting.name]}`);
      await game.settings.set(SETTINGS.MODULE_ID, setting.name, formData.object[setting.name]);
    }

  }

  // eslint-disable-next-line class-methods-use-this
  async _saveProxy(formData) {
    if (this.proxyAddress !== formData.object['api-endpoint']
      || this.useCustomProxy !== formData.object['custom-proxy']
    ) {
      await game.settings.set(SETTINGS.MODULE_ID, "custom-proxy", formData.object['custom-proxy']);
      await game.settings.set(SETTINGS.MODULE_ID, "api-endpoint", formData.object['api-endpoint']);
    }
  }

  async _saveEnhancements(formData) {
    const allowed = formData.object['allowed-weapon-property-sources'].map((id) => parseInt(id));
    await game.settings.set(SETTINGS.MODULE_ID, "allowed-weapon-property-sources", allowed);
    for (const setting of this.enhancementConfig) {
      await game.settings.set(SETTINGS.MODULE_ID, setting.name, formData.object[setting.name]);
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

    await this._saveProxy(formData);
    await this._saveCore(formData);
    await this._saveLocations(formData);
    await this._saveCompendiums(formData);
    await this._saveEnhancements(formData);
    if (this.dynamicEnabled) await this._saveDynamic(formData);

    if (this.closeOnSave) {
      this.close();
    }

    if (this.reloadApplication) {
      logger.warn("RELOADING!");
      foundry.utils.debounce(window.location.reload(), 100);
    }
  }

}
