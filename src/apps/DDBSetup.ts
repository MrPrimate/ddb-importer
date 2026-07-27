import DDBMuncher from "./DDBMuncher";
import {
  logger,
  FileHelper,
  PatreonHelper,
  DDBCampaigns,
  Secrets,
  CompendiumHelper,
  DDBProxy,
  MuncherSettings,
  utils,
} from "../lib/_module";
import { SETTINGS } from "../config/_module";
import DDBAppV2 from "./DDBAppV2";
import DDBCharacterManager from "./DDBCharacterManager";
import DDBDebugger from "./DDBDebugger";
import { IPatreonLinkResponse } from "../lib/PatreonHelper";

interface IContextCompendiums {
  setting: string;
  name: string;
  current: string;
  compendiums: object;
  auto: boolean;
  hasCompendium: boolean;
}

interface IContextSettingFormat {
  name: string;
  isChecked: boolean;
  description: string;
  enabled: boolean;
}

interface IGMUser { userId: string; userName: string; selected: boolean }

interface IDDBSetupContext extends DDBAppV2Context {
  // core
  isCobalt: boolean;
  cobaltLocal: boolean;
  setupConfig: {
    "cobalt-cookie": string;
    "available-campaigns": IDDBListCampaign[];
    "campaign-id": string;
    "patreon-key": string;
  };
  cobaltCheckMessage: string;
  setupComplete: boolean;
  tier: string;
  patreonLinked: boolean;
  patreonUser: string;
  validKey: boolean;
  validCobalt: boolean;
  patreonCheckMessage: string;
  failure: boolean;
  version: string;
  "use-webp": boolean;
  "use-deep-file-paths": boolean;
  directories: { key: string; value: string; name: string; description: string }[];
  compendiums: IContextCompendiums[];
  compendiumSettings: IContextSettingFormat[];
  dynamicEnabledSettings: IContextSettingFormat[];
  dynamicPolicySettings: IContextSettingFormat[];
  gmUsers: IGMUser[];
  dynamicEnabled: boolean;
  useCustomProxy: boolean;
  defaultAddress: string;
  proxyAddress: string;
  selectedWeaponPropertiesEnhancementsSources?: IIdLabelAcronymLookup[];
  enhancementConfig?: ISettingsPolicyExpandedItem[];
}

export default class DDBSetup extends DDBAppV2 {
  static patreonKey: string;
  static patreonTier: string;
  callMuncher: boolean;
  sheetTab: string;
  coreTab: string;
  infoTab: string;
  showDiscouraged: boolean;
  cobaltCheckMessage: string;
  cobalt: string;
  closeOnSave: boolean;
  useWebP: boolean;
  useDeepFilePaths: boolean;
  dynamicEnabled: boolean;
  actor: TImporterActor | null;
  campaignId: string;
  reloadApplication: boolean;
  isLocalCobalt: boolean;
  patreonCheckMessage: string;
  patreonKey: string;
  patreonTier: string;
  patreonUser: string;
  useCustomProxy: boolean;
  defaultAddress: string;
  proxyAddress: string;
  allowedWeaponPropertySources: string[];
  campaignFallback = false;
  // assigned via _refreshCompendiumData() in the constructor
  compendiums!: { setting: string; name: string; current: string; compendiums: object; auto: boolean; hasCompendium: boolean }[];
  directories: { key: string; value: string; name: string; description: string }[];
  compendiumSettings: { name: string; isChecked: boolean; description: string; enabled: boolean }[];
  dynamicEnabledSettings: { name: string; isChecked: boolean; description: string; enabled: boolean }[];
  dynamicPolicySettings: { name: string; isChecked: boolean; description: string; enabled: boolean }[];
  gmUsers: { userId: string; userName: string; selected: boolean }[];
  enhancementConfig: ReturnType<typeof MuncherSettings.getEnhancementSettings>;

  constructor({
    actor = null, callMuncher = false, sheetTab = "info", coreTab = "cobalt", infoTab = "intro",
    showDiscouraged = false,
  }: {
    actor?: TImporterActor | null;
    callMuncher?: boolean;
    sheetTab?: string;
    coreTab?: string;
    infoTab?: string;
    showDiscouraged?: boolean;
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
    this.isLocalCobalt = utils.getSetting<boolean>("cobalt-cookie-local");
    this.patreonCheckMessage = "";
    this.patreonKey = PatreonHelper.getPatreonKey();
    this.patreonTier = PatreonHelper.getPatreonTier();
    this.patreonUser = PatreonHelper.getPatreonUser();

    // LOCATIONS
    this.useWebP = utils.getSetting<boolean>("use-webp");
    this.useDeepFilePaths = utils.getSetting<boolean>("use-deep-file-paths");
    this.directories = [];
    for (const [key, value] of Object.entries(SETTINGS.DEFAULT_SETTINGS.READY.DIRECTORIES)) {
      this.directories.push({
        key,
        value: utils.getSetting<string>(key),
        name: game.i18n.localize(value.name),
        description: game.i18n.localize(value.hint),
      });
    }

    // COMPENDIUMS
    this._refreshCompendiumData();
    this.compendiumSettings = [
      {
        name: "auto-create-compendium",
        isChecked: utils.getSetting<boolean>("auto-create-compendium"),
        description: "Create default compendiums if missing?",
        enabled: true,
      },
    ];

    // DYNAMIC SYNC
    this.dynamicEnabledSettings = [
      {
        name: "dynamic-sync",
        isChecked: utils.getSetting<boolean>("dynamic-sync"),
        description: game.i18n.localize(`${SETTINGS.MODULE_ID}.settings.dynamic-sync.dynamic-sync`),
        enabled: true,
      },
    ];
    this.dynamicPolicySettings = Object.keys(SETTINGS.DEFAULT_SETTINGS.READY.CHARACTER.DYNAMIC_SYNC)
      .map((key) => {
        return {
          name: key,
          isChecked: utils.getSetting<boolean>(key),
          description: game.i18n.localize(`${SETTINGS.MODULE_ID}.settings.dynamic-sync.${key}`),
          enabled: true,
        };
      });
    this.gmUsers = DDBSetup.getGMUsers();
    this.dynamicEnabled = false;

    // PROXY
    this.useCustomProxy = DDBProxy.isCustom();
    this.defaultAddress = SETTINGS.URLS.PROXY;
    this.proxyAddress = utils.getSetting<string>("api-endpoint");

    // enhancements
    this.allowedWeaponPropertySources = utils.getSetting<string[]>("allowed-weapon-property-sources");
    this.enhancementConfig = MuncherSettings.getEnhancementSettings();
  }

  static openDebug(_event: Event, _target: any) {
    new DDBDebugger().render({ force: true });
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
      emptyCompendium: DDBSetup.emptyCompendiumAction,
      deleteAndRecreateCompendiums: DDBSetup.deleteAndRecreateCompendiumsDialog,
      recreateMissingCompendiums: DDBSetup.recreateMissingCompendiumsAction,
    },
    position: {
      width: 962,
      height: "auto" as const,
    },
    tag: "form",
    form: {
      handler: DDBSetup.formHandler,
      submitOnChange: false,
      closeOnSubmit: false,
    },
    window: {
      icon: "fab fa-d-and-d-beyond",
      resizable: true,
      minimizable: true,
      subtitle: "",
    },
  };

  static getGMUsers(): IGMUser[] {
    const updateUser = utils.getSetting<string>("dynamic-sync-user");

    const gmUsers: IGMUser[] = game.users
      .filter((user) => user.isGM)
      .reduce((choices, user) => {
        choices.push({
          userId: user.id,
          userName: user.name,
          selected: user.id === updateUser,
        });
        return choices;
      }, [] as IGMUser[]);

    return gmUsers;
  }

  static isSetupComplete(needsCobalt = true) {
    const uploadDir = utils.getSetting<string>("image-upload-directory");
    const dataDirSet = !FileHelper.BAD_DIRS.includes(uploadDir);
    const cobalt = Secrets.getCobalt() != "";
    const setupComplete = dataDirSet && (cobalt || !needsCobalt);
    return setupComplete;
  }

  _refreshCompendiumData() {
    this.compendiums = SETTINGS.COMPENDIUMS.map((comp) => {
      const current = utils.getSetting<string>(comp.setting);
      const pack = current ? game.packs.get(current) : null;
      return {
        setting: comp.setting,
        name: comp.title,
        current,
        compendiums: CompendiumHelper.getCompendiumLookups(comp.type, current),
        auto: comp.auto,
        hasCompendium: !!pack,
      };
    });
  }

  get id() {
    return `ddb-importer-settings-${this.actor?.id ?? "core"}`;
  }

  get title() {
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

  tabGroups: Record<string, string> = {
    sheet: "info",
    info: "intro",
    core: "cobalt",
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
  async _onRender(context: any, options: any): Promise<void> {
    await super._onRender(context, options);
  }

  async _prepareContext(options: any): Promise<IDDBSetupContext> {

    let context: IDDBSetupContext = {
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

  async _prepareCoreContext(context: IDDBSetupContext): Promise<IDDBSetupContext> {
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
    context.patreonLinked = !!this.patreonUser && this.patreonUser != "";
    const validKeyObject = hasKey ? (await PatreonHelper.getPatreonValidity(this.patreonKey)) : false;
    context.validKey = validKeyObject && validKeyObject.success && validKeyObject.data;

    try {
      const cobaltStatus = await Secrets.checkCobalt("", context.setupConfig["cobalt-cookie"]);
      context.validCobalt = cobaltStatus.success;
    } catch (error) {
      logger.error("Failed to validate cobalt cookie", { error });
      if (error instanceof Error) logger.error(error.stack);
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
      const selected = `${campaign.id}` === `${this.campaignId}`;
      campaign.selected = selected;
    });

    context.setupConfig["available-campaigns"] = availableCampaigns;
    context.setupComplete = context.isCobalt;
    clearTimeout(timeout);

    logger.debug("Settings: _prepareCoreContext", context);
    return context;
  }


  async _prepareDynamicContext(context: IDDBSetupContext): Promise<IDDBSetupContext> {
    const tier = PatreonHelper.getPatreonTier();
    const tiers = PatreonHelper.calculateAccessMatrix(tier);
    this.dynamicEnabled = tiers.experimentalMid;
    context.dynamicEnabled = this.dynamicEnabled;

    logger.debug("Settings: _prepareDynamicContext", context);
    return context;
  }


  async _prepareEnhancementsContext(context: IDDBSetupContext): Promise<IDDBSetupContext> {
    const allowedSourceIds = this.allowedWeaponPropertySources;
    const selectedSources: IIdLabelAcronymLookup[] = MuncherSettings.getSourcesLookups(allowedSourceIds).map((source) => {
      const data: IIdLabelAcronymLookup = foundry.utils.deepClone(source) as unknown as IIdLabelAcronymLookup;
      if (source.selected) {
        data.selected = "selected";
      } else {
        data.selected = "";
      }
      return data;
    }) as IIdLabelAcronymLookup[];
    context.selectedWeaponPropertiesEnhancementsSources = selectedSources;
    context.enhancementConfig = this.enhancementConfig;

    logger.debug("Settings: _prepareEnhancementsContext", context);
    return context;
  }

  /** @override */

  async _preparePartContext(partId: string, context: IDDBSetupContext): Promise<IDDBSetupContext> {
    switch (partId) {
      case "core": {
        context = await this._prepareCoreContext(context);
        break;
      }
      case "dynamic": {
        context = await this._prepareDynamicContext(context);
        break;
      }
      case "enhancements": {
        context = await this._prepareEnhancementsContext(context);
        break;
      }
      // no default
    };
    context.tab = context.tabs?.[partId];
    return context;
  }


  static async checkCobaltCookie(value: string) {
    const cookieStatus = await Secrets.checkCobalt("", value);
    if (value !== "" && !cookieStatus.success) {
      $("#munching-task-setup").text(`Your Cobalt Cookie is invalid, please check that you pasted the right information.`);
      $("#ddb-importer-settings").css("height", "auto");
      throw new Error(`Your Cobalt Cookie is invalid, please check that you pasted the right information.`);
    }
    return cookieStatus;
  }

  static async setCobaltCookie(value: string, local: boolean) {
    await DDBSetup.checkCobaltCookie(value);
    await Secrets.setCobalt(value);
    await game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie-local", local);
    const runCookieMigrate = local != utils.getSetting<boolean>("cobalt-cookie-local");
    if (runCookieMigrate && local) {
      Secrets.moveCobaltToLocal();
    } else if (runCookieMigrate && !local) {
      Secrets.moveCobaltToSettings();
    }
  }

  async patreonRefresh() {
    const tierData = await PatreonHelper.fetchPatreonTier(false, this.patreonKey);
    this.patreonTier = tierData.data;
    this.patreonUser = tierData.email ?? "";
  }

  static async connectToPatreonButton(this: DDBSetup, event: Event) {
    event.preventDefault();
    await PatreonHelper.linkToPatreon(async (data: IPatreonLinkResponse) => {
      // Callback after linking to Patreon
      this.patreonKey = data.key;
      this.patreonTier = data.tier;
      this.patreonUser = data.email;
      this.render();
    });
  }

  static async fetchCampaignsButton(this: DDBSetup, event: Event) {
    event.preventDefault();
    const cookie = this.element.querySelector<HTMLInputElement>("#cobalt-cookie-input");
    if (!cookie) {
      logger.warn("Cobalt cookie input not found in setup form");
      return;
    }
    const cookieStatus = await DDBSetup.checkCobaltCookie(cookie.value);
    if (!cookieStatus.success) return;
    let campaigns = null;
    try {
      campaigns = await DDBCampaigns.refreshCampaigns(cookie.value);
    } catch (error) {
      logger.warn("Campaign fetch failed, showing fallback input", error);
    }
    const list = this.element.querySelector("#campaign-select");
    if (!list) {
      logger.warn("Campaign select element not found in setup form");
      return;
    }
    let campaignList = `<option value="">Select campaign:</option>`;
    if (!campaigns || (Array.isArray(campaigns) && campaigns.length === 0)) {
      this.campaignFallback = true;
      const fallback = this.element.querySelector("#ddb-campaign-fallback");
      list.classList.add("ddbimporter-none");
      fallback?.classList.remove("ddbimporter-none");
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

  static async checkCobaltButton(this: DDBSetup, event: Event) {
    event.preventDefault();
    const cookie = this.element.querySelector<HTMLInputElement>("#cobalt-cookie-input");
    if (!cookie || cookie.value === undefined) throw new Error("undefined");
    const cobaltStatus = await Secrets.checkCobalt("", cookie.value);
    if (cobaltStatus.success) {
      this.cobaltCheckMessage = " - Success!";
      this.cobalt = cookie.value;
      await this.render();
    } else {
      this.cobaltCheckMessage = " - Failure!";
    }
  }

  static async checkPatreonButton(this: DDBSetup, event: Event) {
    event.preventDefault();
    const keyInput = this.element.querySelector<HTMLInputElement>("#ddb-patreon-key");
    if (!keyInput) {
      logger.warn("Patreon key input not found in setup form");
      return;
    }
    const key = keyInput.value;
    this.patreonKey = key;
    const success = await PatreonHelper.isValidKey(false, false, key);
    this.patreonCheckMessage = success ? " - Success!" : " - Failure!";
    await this.patreonRefresh();
    await this.render();
  }

  static goToCobaltTab(this: DDBSetup, event: Event) {
    event.preventDefault();
    this.changeTab("core", "sheet", {});
    this.changeTab("cobalt", "core", {});
  }

  static goToCampaignTab(this: DDBSetup, event: Event) {
    event.preventDefault();
    this.changeTab("core", "sheet", {});
    this.changeTab("campaign", "core", {});
  }

  static goToPatreonTab(this: DDBSetup, event: Event) {
    event.preventDefault();
    this.changeTab("core", "sheet", {});
    this.changeTab("patreon", "core", {});
  }

  static async resetSettingsDialog(this: DDBSetup, event: Event) {
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
        await utils.setSetting(name, data.default);
      }
      for (const [name, data] of Object.entries(SETTINGS.GET_DEFAULT_SETTINGS(true))) {
        await utils.setSetting(name, data.default);
      }
      window.location.reload();
    }

  }

  static async emptyCompendiumAction(this: DDBSetup, _event: Event, target: HTMLElement) {
    const setting = target.dataset.setting;
    if (!setting) return;

    const compendiumName = utils.getSetting<string>(setting);
    const pack = compendiumName ? game.packs.get(compendiumName) : null;
    if (!pack) {
      ui.notifications.warn("No compendium selected or available.");
      return;
    }

    await pack.getIndex();
    const count = pack.index.size;
    if (count === 0) {
      ui.notifications.info(`${pack.metadata.label} is already empty.`);
      return;
    }

    const dialog = await foundry.applications.api.DialogV2.confirm<foundry.applications.api.DialogV2.ConfirmConfig>({
      rejectClose: false,
      window: { title: `Empty ${pack.metadata.label}` },
      content: `<p>Are you sure you want to delete all <strong>${count}</strong> entries from <strong>${pack.metadata.label}</strong>?</p>`,
    });

    if (dialog) {
      await CompendiumHelper.emptyCompendiums([setting]);
      ui.notifications.info(`Emptied ${pack.metadata.label} (${count} entries removed).`);
    }
  }

  static async deleteAndRecreateCompendiumsDialog(this: DDBSetup, event: Event) {
    event.preventDefault();
    const info = CompendiumHelper.getDeleteRecreateInfo();

    if (info.worldCompendiums.length === 0) {
      ui.notifications.warn("No world-level DDB compendiums found to delete and recreate.");
      return;
    }

    let content = "<p>The following compendiums will be deleted and recreated:</p><ul>";
    for (const entry of info.worldCompendiums) {
      const warning = entry.isDefault ? "" : " <strong>(non-default compendium!)</strong>";
      content += `<li>${entry.pack.metadata.label} (${entry.type})${warning}</li>`;
    }
    content += "</ul>";

    if (info.skippedCompendiums.length > 0) {
      content += "<p>The following will be skipped:</p><ul>";
      for (const entry of info.skippedCompendiums) {
        content += `<li>${entry.title} - ${entry.reason}</li>`;
      }
      content += "</ul>";
    }

    if (info.nonDefaultCompendiums.length > 0) {
      content += `<p class="${SETTINGS.MODULE_ID}-dialog-important">Warning: Some compendiums are not set to the default DDB compendium. They will be deleted and recreated with default settings.</p>`;
    }

    const dialog = await foundry.applications.api.DialogV2.confirm({
      rejectClose: false,
      window: { title: "Delete and Recreate DDB Compendiums" },
      content,
    });

    if (dialog) {
      const count = await CompendiumHelper.deleteAndRecreateCompendiums(info.worldCompendiums);
      ui.notifications.info(`Deleted and recreated ${count} compendium(s).`);
      this._refreshCompendiumData();
      this.render();
    }
  }

  static async recreateMissingCompendiumsAction(this: DDBSetup, event: Event) {
    event.preventDefault();
    const recreated = await CompendiumHelper.recreateMissingCompendiums();
    if (recreated.length === 0) {
      ui.notifications.info("All compendiums already exist. Nothing to recreate.");
    } else {
      ui.notifications.info(`Recreated ${recreated.length} missing compendium(s): ${recreated.join(", ")}`);
      this._refreshCompendiumData();
      this.render();
    }
  }

  static async selectDirectory(this: DDBSetup, _event: Event, target: any) {
    const targetDirSetting = target.dataset.target;
    const currentDir = utils.getSetting<string>(targetDirSetting);
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
          current: path,
          fullPath: path,
        });

        const dirInput = this.element.querySelector<HTMLInputElement>(`input[name='${targetDirSetting}']`);
        if (dirInput) dirInput.value = formattedPath;
      },
    });
    filePicker.render();

  }


  async _saveCore(formData: any) {
    const currentKey = PatreonHelper.getPatreonKey();

    if (currentKey !== formData.object["patreon-key"]) {
      await PatreonHelper.setPatreonKey(formData.object["patreon-key"]);
      await PatreonHelper.setPatreonTier();
    }

    const cobaltCookie = formData.object["cobalt-cookie"];
    const cobaltCookieLocal = formData.object["cobalt-cookie-local"] ?? true;
    const currentCobalt = Secrets.getCobalt();

    if (currentCobalt !== cobaltCookie) {
      try {
        await DDBSetup.setCobaltCookie(cobaltCookie, cobaltCookieLocal);
      } catch (error) {
        if (cobaltCookie !== "") {
          ui.notifications.error("Error validating your cobalt cookie!");
          logger.error("Error validating cobalt cookie", { error });
        }
      }
    }

    const currentLocalCobalt = utils.getSetting<boolean>("cobalt-cookie-local");
    if (currentLocalCobalt !== cobaltCookieLocal) {
      await game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie-local", cobaltCookieLocal);
    }

    const campaignSelect = formData.object["campaign-select"];
    const fallbackCampaign = formData.object["campaign-fallback"];
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
      new DDBMuncher().render({ force: true });
    } else if (this.actor) {
      const characterImport = new DDBCharacterManager(this.actor);
      characterImport.render({ force: true });
    }
  }

  async _saveLocations(formData: FormDataExtended) {
    const directoryStatus = [];

    for (const [key, data] of Object.entries(SETTINGS.DEFAULT_SETTINGS.READY.DIRECTORIES)) {
      const newValue = formData.object[key] as string;
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
        await utils.setSetting(data.key, data.value);
      }
      const useWebP = formData.object["use-webp"] as boolean;
      const useDeepFilePaths = formData.object["use-deep-file-paths"] as boolean;

      if (this.useWebP !== useWebP) await game.settings.set(SETTINGS.MODULE_ID, "use-webp", useWebP);
      if (this.useDeepFilePaths !== useDeepFilePaths) {
        await game.settings.set(SETTINGS.MODULE_ID, "use-deep-file-paths", useDeepFilePaths);
      }
    }

  }

  async _saveCompendiums(formData: FormDataExtended) {
    for (const setting of this.compendiumSettings) {
      logger.debug(`Saving setting ${setting.name} with value ${formData.object[setting.name]}`);
      await utils.setSetting(setting.name, formData.object[setting.name]);
    }

    for (const compendium of this.compendiums) {
      logger.debug(`Saving compendium setting ${compendium.setting} with value ${formData.object[compendium.setting]}`);
      await utils.setSetting(compendium.setting, formData.object[compendium.setting]);
    }
  }

  async _saveDynamic(formData: FormDataExtended) {
    if (!this.dynamicEnabled) {
      game.settings.set(SETTINGS.MODULE_ID, "dynamic-sync", false);
      return;
    }

    game.settings.set(SETTINGS.MODULE_ID, "dynamic-sync-user", formData.object["dynamic-sync-user"] as string);

    for (const setting of this.dynamicEnabledSettings) {
      if (setting.name === "dynamic-sync"
        && utils.getSetting<boolean>("dynamic-sync") !== formData.object[setting.name]
      ) {
        this.reloadApplication = true; // reload the application after saving
        logger.warn("Dynamic Sync setting changed, reloading application!");
      }
      logger.debug(`Saving setting ${setting.name} with value ${formData.object[setting.name]}`);
      await utils.setSetting(setting.name, formData.object[setting.name] as any);
    }
    for (const setting of this.dynamicPolicySettings) {
      logger.debug(`Saving setting ${setting.name} with value ${formData.object[setting.name]}`);
      await utils.setSetting(setting.name, formData.object[setting.name] as any);
    }

  }


  async _saveProxy(formData: FormDataExtended) {
    if (this.proxyAddress !== formData.object["api-endpoint"] as string
      || this.useCustomProxy !== formData.object["custom-proxy"] as boolean
    ) {
      await game.settings.set(SETTINGS.MODULE_ID, "custom-proxy", formData.object["custom-proxy"] as boolean);
      await game.settings.set(SETTINGS.MODULE_ID, "api-endpoint", formData.object["api-endpoint"] as string);
    }
  }

  async _saveEnhancements(formData: FormDataExtended) {
    const allowed = (formData.object["allowed-weapon-property-sources"] as string[]).map((id) => parseInt(id));
    await game.settings.set(SETTINGS.MODULE_ID, "allowed-weapon-property-sources", allowed);
    for (const setting of this.enhancementConfig) {
      await utils.setSetting(setting.name, formData.object[setting.name] as any);
    }
  }

  /**
   * Process form submission for the sheet
   * @this {DDBLocationSetup}                      The handler is called with the application as its bound scope
   * @param {Event|SubmitEvent} event             The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async formHandler(this: DDBSetup, event: Event | SubmitEvent, _form: HTMLFormElement, formData: FormDataExtended) {
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
      setTimeout(() => window.location.reload(), 100);
    }
  }

}
