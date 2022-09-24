import { DirectoryPicker } from "./DirectoryPicker.js";
import { setPatreonTier, getPatreonTiers, getPatreonValidity } from "../muncher/utils.js";
import { DDBMuncher, munchNote } from "../muncher/ddb.js";
import { getCobalt, setCobalt, moveCobaltToLocal, moveCobaltToSettings, checkCobalt } from "./Secrets.js";
import logger from "../logger.js";
import SETTINGS from "../settings.js";
import FileHelper from "../utils/files.js";

const POPUPS = {
  json: null,
  web: null,
};

export function getCampaignId() {
  const campaignId = game.settings.get("ddb-importer", "campaign-id").split("/").pop();

  if (campaignId && campaignId !== "" && !Number.isInteger(parseInt(campaignId))) {
    munchNote(`Campaign Id is invalid! Set to "${campaignId}", using empty string`, true);
    logger.error(`Campaign Id is invalid! Set to "${campaignId}", using empty string`);
    return "";
  } else if (campaignId.includes("join")) {
    munchNote(`Campaign URL is a join campaign link, using empty string! Set to "${campaignId}"`, true);
    logger.error(`Campaign URL is a join campaign link, using empty string! Set to "${campaignId}"`);
    return "";
  }
  return campaignId;
}


function renderPopup(type, url) {
  if (POPUPS[type] && !POPUPS[type].close) {
    POPUPS[type].focus();
    POPUPS[type].location.href = url;
  } else {
    const ratio = window.innerWidth / window.innerHeight;
    const width = Math.round(window.innerWidth * 0.5);
    const height = Math.round(window.innerWidth * 0.5 * ratio);
    POPUPS[type] = window.open(
      url,
      "ddb_sheet_popup",
      `resizeable,scrollbars,location=no,width=${width},height=${height},toolbar=1`
    );
  }
  return true;
}

export function isSetupComplete(needsCobalt = true) {
  const uploadDir = game.settings.get(SETTINGS.MODULE_ID, "image-upload-directory");
  const dataDirSet = !FileHelper.BAD_DIRS.includes(uploadDir);
  const cobalt = getCobalt() != "";
  const setupComplete = dataDirSet && (cobalt || !needsCobalt);
  return setupComplete;
}

async function linkToPatreon() {

  const proxy = game.settings.get(SETTINGS.MODULE_ID, "api-endpoint");
  const patreonId = "oXQUxnRAbV6mq2DXlsXY2uDYQpU-Ea2ds0G_5hIdi0Bou33ZRJgvV8Ub3zsEQcHp";
  const patreonAuthUrl = `${proxy}/patreon/auth`;
  const patreonScopes = encodeURI("identity identity[email]");

  const socketOptions = {
    transports: ['websocket', 'polling', 'flashsocket'],
    // reconnection: false,
    // reconnectionAttempts: 10,
  };
  const socket = io(`${proxy}/`, socketOptions);

  socket.on("connect", () => {
    logger.debug("DDB Muncher socketID", socket.id);
    const serverDetails = {
      id: socket.id,
      world: game.world.title,
      userId: game.userId,
    };
    socket.emit("register", serverDetails);

  });

  socket.on('registered', (data) => {
    logger.info(`Foundry instance registered with DDB Muncher Proxy`);
    logger.debug(data);
    renderPopup("web", `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${patreonId}&redirect_uri=${patreonAuthUrl}&state=${data.userHash}&scope=${patreonScopes}`);
  });

  socket.on('auth', (data) => {
    logger.debug(`Response from auth socket!`, data);

    POPUPS["web"].close();

    game.settings.set(SETTINGS.MODULE_ID, "beta-key", data.key);
    game.settings.set(SETTINGS.MODULE_ID, "patreon-user", data.email);
    game.settings.set(SETTINGS.MODULE_ID, "patreon-tier", data.tier);

    $('#ddb-patreon-user').text(data.email);
    $('#ddb-patreon-tier').text(data.tier);
    $('#ddb-patreon-valid').text("True");
    $('#ddb-beta-key').val(data.key);

    socket.disconnect();
  });

  socket.on('error', (data) => {
    logger.error(`Error Response from socket!`, data);
    socket.disconnect();
  });
}

function getDDBCampaigns(cobalt = null) {
  const cobaltCookie = cobalt ? cobalt : getCobalt();
  const parsingApi = game.settings.get(SETTINGS.MODULE_ID, "api-endpoint");
  const betaKey = game.settings.get(SETTINGS.MODULE_ID, "beta-key");
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
      .then((data) => resolve(data.data))
      .catch((error) => {
        logger.error(`Cobalt cookie check error`);
        logger.error(error);
        logger.error(error.stack);
        reject(error);
      });
  });

}

async function checkCobaltCookie(value) {
  const cookieStatus = await checkCobalt("", value);
  if (value !== "" && !cookieStatus.success) {
    $('#munching-task-setup').text(`Your Cobalt Cookie is invalid, please check that you pasted the right information.`);
    $('#ddb-importer-settings').css("height", "auto");
    throw new Error(`Your Cobalt Cookie is invalid, please check that you pasted the right information.`);
  }
  return cookieStatus;
}

async function refreshCampaigns(cobalt = null) {
  await checkCobaltCookie(cobalt);
  CONFIG.DDBI.CAMPAIGNS = await getDDBCampaigns(cobalt);
  return CONFIG.DDBI.CAMPAIGNS;
}

export async function getAvailableCampaigns() {
  if (CONFIG.DDBI.CAMPAIGNS) return CONFIG.DDBI.CAMPAIGNS;
  const campaignId = getCampaignId();
  // eslint-disable-next-line require-atomic-updates
  CONFIG.DDBI.CAMPAIGNS = await getDDBCampaigns();

  if (!CONFIG.DDBI.CAMPAIGNS) return [];

  CONFIG.DDBI.CAMPAIGNS.forEach((campaign) => {
    const selected = campaign.id == campaignId;
    campaign.selected = selected;
  });
  return CONFIG.DDBI.CAMPAIGNS;
}

async function setCobaltCookie(value, local) {
  await checkCobaltCookie(value);
  await setCobalt(value);
  await game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie-local", local);
  const runCookieMigrate = local != game.settings.get(SETTINGS.MODULE_ID, "cobalt-cookie-local");
  if (runCookieMigrate && local) {
    moveCobaltToLocal();
  } else if (runCookieMigrate && !local) {
    moveCobaltToSettings();
  }

}

export class DDBKeyChange extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-key-change";
    options.template = "modules/ddb-importer/handlebars/key-change.hbs";
    options.width = 500;
    return options;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Key Expiry";
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("#patreon-button").click(async (event) => {
      event.preventDefault();
      linkToPatreon();
    });
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    const key = game.settings.get(SETTINGS.MODULE_ID, "beta-key");
    const setupConfig = {
      "beta-key": key,
    };
    const patreonUser = game.settings.get(SETTINGS.MODULE_ID, "patreon-user");
    const check = await getPatreonValidity(key);

    return {
      success: (check && check.success) ? check.success : false,
      message: (check && check.message) ? check.message : "Unable to check patreon key status",
      setupConfig: setupConfig,
      patreonLinked: patreonUser && patreonUser != "",
      patreonUser: patreonUser,
    };
  }

  /** @override */
  // eslint-disable-next-line no-unused-vars
  async _updateObject(event, formData) { // eslint-disable-line class-methods-use-this
    event.preventDefault();
    const currentKey = game.settings.get(SETTINGS.MODULE_ID, "beta-key");
    if (currentKey !== formData['beta-key']) {
      await game.settings.set(SETTINGS.MODULE_ID, "beta-key", formData['beta-key']);
      await setPatreonTier();
    }

    const callMuncher = game.settings.get(SETTINGS.MODULE_ID, "settings-call-muncher");

    if (callMuncher) {
      game.settings.set(SETTINGS.MODULE_ID, "settings-call-muncher", false);
      new DDBMuncher().render(true);
    }

  }
}

export async function isValidKey() {
  let validKey = false;

  const key = game.settings.get(SETTINGS.MODULE_ID, "beta-key");
  if (key === "") {
    validKey = true;
  } else {
    const check = await getPatreonValidity(key);
    if (check.success && check.data) {
      validKey = true;
    } else {
      validKey = false;
      game.settings.set(SETTINGS.MODULE_ID, "settings-call-muncher", true);
      new DDBKeyChange().render(true);
    }
  }
  return validKey;
}

export class DDBCookie extends FormApplication {

  constructor(options, actor = null, localCobalt = false) {
    super(options);
    this.localCobalt = localCobalt;
    this.actor = actor;
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-cobalt-change";
    options.template = "modules/ddb-importer/handlebars/cobalt.hbs";
    options.width = 500;
    return options;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Cobalt Cookie";
  }

  /** @override */
  async getData() {
    const keyPostFix = this.localCobalt && this.actor ? this.actor.id : null;
    const cobalt = getCobalt(keyPostFix);
    const cobaltStatus = cobalt == "" ? { success: true } : await checkCobalt();
    const expired = !cobaltStatus.success;

    return {
      expired: expired,
      cobaltCookie: cobalt,
      localCobalt: this.localCobalt && this.actor,
      actor: this.actor,
    };
  }

  /** @override */
  async _updateObject(event, formData) {
    event.preventDefault();
    const keyPostFix = this.localCobalt && this.actor ? this.actor.id : null;
    await setCobalt(formData['cobalt-cookie'], keyPostFix);

    const cobaltStatus = await checkCobalt();
    if (!cobaltStatus.success) {
      new DDBCookie().render(true);
    } else {
      const callMuncher = game.settings.get(SETTINGS.MODULE_ID, "settings-call-muncher");

      if (callMuncher) {
        game.settings.set(SETTINGS.MODULE_ID, "settings-call-muncher", false);
        new DDBMuncher().render(true);
      }
    }
  }
}


// eslint-disable-next-line no-unused-vars
Hooks.on("renderma", (app, html, user) => {
  DirectoryPicker.processHtml(html);
});

export class DDBSetup extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-settings";
    options.template = "modules/ddb-importer/handlebars/settings.hbs";
    options.width = 500;
    return options;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Settings";
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    const cobalt = getCobalt();
    const isCobalt = cobalt != "";
    const cobaltStatus = await checkCobalt("", cobalt);
    const cobaltLocal = game.settings.get(SETTINGS.MODULE_ID, "cobalt-cookie-local");
    const hasKey = game.settings.get(SETTINGS.MODULE_ID, "beta-key") != "";
    const key = game.settings.get(SETTINGS.MODULE_ID, "beta-key");
    const campaignId = getCampaignId();
    const tier = game.settings.get(SETTINGS.MODULE_ID, "patreon-tier");
    const patreonUser = game.settings.get(SETTINGS.MODULE_ID, "patreon-user");
    const validKeyObject = hasKey ? await getPatreonValidity(key) : false;
    const validKey = validKeyObject && validKeyObject.success && validKeyObject.data;
    const availableCampaigns = isCobalt && cobaltStatus.success ? await getAvailableCampaigns() : [];

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
      linkToPatreon();
    });
    html.find("#campaign-button").click(async (event) => {
      event.preventDefault();
      const cookie = html.find("#cobalt-cookie-input");
      const campaigns = await refreshCampaigns(cookie[0].value);
      let campaignList = `<option value="">Select campaign:</option>`;
      campaigns.forEach((campaign) => {
        campaignList += `<option value="${campaign.id}">${campaign.name} (${campaign.dmUsername}) - ${campaign.id}</option>\n`;
      });
      const list = html.find("#campaign-select");
      list[0].innerHTML = campaignList;
    });
    html.find("#check-cobalt-button").click(async (event) => {
      event.preventDefault();
      const cookie = html.find("#cobalt-cookie-input");
      if (cookie[0].value === undefined) throw new Error("undefined");
      const cobaltStatus = await checkCobalt("", cookie[0].value);
      const button = html.find("#check-cobalt-button");
      if (cobaltStatus.success) {
        button[0].innerHTML = "Check Cobalt Cookie - Success!";
      } else {
        button[0].innerHTML = "Check Cobalt Cookie - Failure!";
      }
    });


  }

  /** @override */
  async _updateObject(event, formData) { // eslint-disable-line class-methods-use-this
    event.preventDefault();
    const campaignSelect = formData['campaign-select'];
    const campaignId = campaignSelect == 0 ? "" : campaignSelect;
    const cobaltCookie = formData['cobalt-cookie'];
    const cobaltCookieLocal = formData['cobalt-cookie-local'];
    const currentKey = game.settings.get(SETTINGS.MODULE_ID, "beta-key");

    if (currentKey !== formData['beta-key']) {
      await game.settings.set(SETTINGS.MODULE_ID, "beta-key", formData['beta-key']);
      await setPatreonTier();
    }

    await game.settings.set(SETTINGS.MODULE_ID, "campaign-id", campaignId);
    await setCobaltCookie(cobaltCookie, cobaltCookieLocal);

    const callMuncher = game.settings.get(SETTINGS.MODULE_ID, "settings-call-muncher");

    if (callMuncher && cobaltCookie === "") {
      $('#munching-task-setup').text(`To use Muncher you need to set a Cobalt Cookie value!`);
      $('#ddb-importer-settings').css("height", "auto");
      throw new Error(`To use Muncher you need to set a Cobalt Cookie value!`);
    } else if (callMuncher) {
      game.settings.set(SETTINGS.MODULE_ID, "settings-call-muncher", false);
      new DDBMuncher().render(true);
    }
  }
}

function getCompendiumLookups(type, selected) {
  const excludedCompendiumPackages = [
    "dnd5e", "dae", "midiqol", "magicitems", "midi-srd", "dae-srd", "midi-qol",
  ];

  const selections = game.packs
    .filter((pack) =>
      pack.documentName === type &&
    !excludedCompendiumPackages.includes(pack.metadata.packageName)
    )
    .reduce((choices, pack) => {
      choices[pack.collection] = {
        label: `[${pack.metadata.packageName}] ${pack.metadata.label}`,
        selected: pack.collection === selected,
      };
      return choices;
    }, {});

  return selections;
}


export class DDBCompendiumSetup extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-settings-compendium";
    options.template = "modules/ddb-importer/handlebars/compendium.hbs";
    options.width = 500;
    return options;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Compendium Settings";
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    const settings = [
      {
        name: "auto-create-compendium",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "auto-create-compendium"),
        description: "Create default compendiums if missing?",
        enabled: true,
      },
    ];

    const compendiums = SETTINGS.COMPENDIUMS.map((comp) => ({
      setting: comp.setting,
      name: comp.title,
      current: game.settings.get(SETTINGS.MODULE_ID, comp.setting),
      compendiums: getCompendiumLookups(comp.type, game.settings.get(SETTINGS.MODULE_ID, comp.setting)),
    }));

    return {
      settings,
      compendiums,
    };
  }

  /** @override */
  // eslint-disable-next-line no-unused-vars
  async _updateObject(event, formData) { // eslint-disable-line class-methods-use-this
    event.preventDefault();
    for (const [key, value] of Object.entries(formData)) {
      game.settings.set(SETTINGS.MODULE_ID, key, value);
    }
  }
}


function getGMUsers() {
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


export class DDBDynamicUpdateSetup extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-settings-dynamic-updates";
    options.template = "modules/ddb-importer/handlebars/dynamic-updates.hbs";
    options.width = 500;
    return options;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Dynamic Update Settings";
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    const tier = game.settings.get(SETTINGS.MODULE_ID, "patreon-tier");
    const tiers = getPatreonTiers(tier);
    const enabled = tiers.experimentalMid;

    const policySettings = Object.keys(SETTINGS.DEFAULT_SETTINGS.READY.CHARACTER.DYNAMIC_SYNC)
      .map((key) => {
        return {
          name: key,
          isChecked: enabled && game.settings.get(SETTINGS.MODULE_ID, key),
          description: game.i18n.localize(`${SETTINGS.MODULE_ID}.settings.dynamic-sync.${key}`),
          enabled,
        };
      });
    const settings = [
      {
        name: "dynamic-sync",
        isChecked: enabled && game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync"),
        description: game.i18n.localize(`${SETTINGS.MODULE_ID}.settings.dynamic-sync.dynamic-sync`),
        enabled,
      },
    ].concat(policySettings);
    const gmUsers = getGMUsers();

    return {
      settings,
      gmUsers,
    };
  }

  /** @override */
  // eslint-disable-next-line class-methods-use-this
  async _updateObject(event, formData) {
    event.preventDefault();
    const initial = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync");
    for (const [key, value] of Object.entries(formData)) {
      // eslint-disable-next-line no-await-in-loop
      await game.settings.set(SETTINGS.MODULE_ID, key, value);
    }
    const post = game.settings.get(SETTINGS.MODULE_ID, "dynamic-sync");

    if (initial != post) {
      logger.warn("RELOADING!");
      foundry.utils.debounce(window.location.reload(), 100);
    }
  }
}

export class DDBLocationSetup extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-folders";
    options.template = "modules/ddb-importer/handlebars/filePaths.hbs";
    options.width = 500;
    return options;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Location Settings";
  }

  // in foundry v10 we no longer get read only form elements back
  /** @override */
  _getSubmitData(updateData = {}) {
    let data = super._getSubmitData(updateData);

    for (const element of this.form.elements) {
      if (element.readOnly) {
        const name = element.name;
        const field = this.form.elements[name];
        setProperty(data, name, field.value);
      }
    }

    return data;
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    const useWebP = game.settings.get(SETTINGS.MODULE_ID, "use-webp");
    const directories = [];

    for (const [key, value] of Object.entries(SETTINGS.DEFAULT_SETTINGS.READY.DIRECTORIES)) {
      directories.push({
        key,
        value: game.settings.get(SETTINGS.MODULE_ID, key),
        name: game.i18n.localize(value.name),
        description: game.i18n.localize(value.hint),
      });
    }

    return {
      directories,
      useWebP,
    };
  }

  /** @override */
  async _updateObject(event, formData) { // eslint-disable-line class-methods-use-this
    event.preventDefault();

    const useWebP = formData['image-use-webp'];

    await game.settings.set(SETTINGS.MODULE_ID, "use-webp", useWebP);

    const directoryStatus = [];

    for (const key of Object.keys(SETTINGS.DEFAULT_SETTINGS.READY.DIRECTORIES)) {
      const value = formData[key];
      // eslint-disable-next-line no-await-in-loop
      await game.settings.set(SETTINGS.MODULE_ID, key, value);
      directoryStatus.push({
        key,
        value,
        isBad: FileHelper.BAD_DIRS.includes(value),
        // eslint-disable-next-line no-await-in-loop
        isValid: await DirectoryPicker.verifyPath(DirectoryPicker.parse(value)),
      });
    }

    if (directoryStatus.some((dir) => dir.isBad)) {
      $('#munching-folder-setup').text(`Please set the image upload directory(s) to something other than the root.`);
      $('#ddb-importer-folders').css("height", "auto");
      logger.error("Error setting Image directory", {
        directoryStatus,
      });
      throw new Error(`Please set the image upload directory to something other than the root.`);
    } else if (directoryStatus.some((dir) => !dir.isValid)) {
      $('#munching-folder-setup').text(`Directory Validation Failed.`);
      $('#ddb-importer-folders').css("height", "auto");
      logger.error("Error validating Image directory", {
        directoryStatus,
      });
      throw new Error(`Directory Validation Failed.`);
    }
  }
}

// eslint-disable-next-line no-unused-vars
Hooks.on("renderDDBLocationSetup", (app, html, user) => {
  DirectoryPicker.processHtml(html);
});
