import { PatreonHelper } from "../lib/_module.mjs";
import DDBMuncher from "./DDBMuncher.js";

export class DDBKeyChange extends FormApplication {

  constructor({ local = false, callback = null, callMuncher = false } = {}, options = {}) {
    options.template = local
      ? "modules/ddb-importer/handlebars/local-key.hbs"
      : "modules/ddb-importer/handlebars/key-change.hbs";
    super({}, options);
    this.local = local;
    this.callback = callback;
    this.callMuncher = callMuncher;
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
    }

    if (this.callback) {
      await this.callback();
    }

    if (this.callMuncher) {
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
      new DDBKeyChange({ callMuncher: true }).render(true);
    }
  }
  return validKey;
}
