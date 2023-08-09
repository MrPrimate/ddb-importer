import PatreonHelper from "../lib/PatreonHelper.js";
import DDBMuncher from "./DDBMuncher.js";
import SETTINGS from "../settings.js";

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
    return "DDB Importer Key Change";
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
    const key = PatreonHelper.getPatreonKey();
    const setupConfig = {
      "beta-key": key,
    };
    const patreonUser = game.settings.get(SETTINGS.MODULE_ID, "patreon-user");
    const check = await PatreonHelper.getPatreonValidity(key);

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
    const currentKey = PatreonHelper.getPatreonKey();
    if (currentKey !== formData['beta-key']) {
      await game.settings.set(SETTINGS.MODULE_ID, "beta-key", formData['beta-key']);
      await PatreonHelper.setPatreonTier();
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
