import PatreonHelper from "../lib/PatreonHelper.js";
import DDBMuncher from "./DDBMuncher.js";
import SETTINGS from "../settings.js";

export class DDBKeyChange extends FormApplication {

  constructor({ local = false, success = null } = {}, options = {}) {
    options.template = local
      ? "modules/ddb-importer/handlebars/local-key.hbs"
      : "modules/ddb-importer/handlebars/key-change.hbs";
    super({}, options);
    this.local = local;
    this.success = success;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ddb-importer-key-change",
      // template: "modules/ddb-importer/handlebars/key-change.hbs",
      width: 500,
    });
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return this.local ? "DDB Importer Local Key" : "DDB Importer Key Change";
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("#patreon-button").click(async (event) => {
      event.preventDefault();
      PatreonHelper.linkToPatreon();
    });
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    const key = PatreonHelper.getPatreonKey(this.local);
    const setupConfig = {
      "beta-key": key ?? "",
    };
    const patreonUser = key && key !== ""
      ? PatreonHelper.getPatreonUser(this.local)
      : "";

    const newKey = key === null || !key || key === "";
    const check = newKey
      ? { success: true, message: "" }
      : await PatreonHelper.getPatreonValidity(key);

    return {
      success: (check && check.success) ? check.success : false,
      message: (check && check.message) ? check.message : "Unable to check patreon key status",
      setupConfig: setupConfig,
      patreonLinked: patreonUser && patreonUser != "",
      patreonUser: patreonUser ?? "",
      local: this.local,
    };
  }

  /** @override */
  // eslint-disable-next-line no-unused-vars
  async _updateObject(event, formData) { // eslint-disable-line class-methods-use-this
    event.preventDefault();
    const currentKey = PatreonHelper.getPatreonKey(this.local);
    if (currentKey !== formData['beta-key']) {
      await PatreonHelper.setPatreonKey(formData['beta-key'], this.local);
      await PatreonHelper.setPatreonTier(this.local);
      if (this.success) {
        this.success();
      }
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

  const key = PatreonHelper.getPatreonKey();
  if (key === "") {
    validKey = true;
  } else {
    const check = await PatreonHelper.getPatreonValidity(key);
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
