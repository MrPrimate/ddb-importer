import PatreonHelper from "../lib/PatreonHelper.js";
import logger from "../logger.js";
import SETTINGS from "../settings.js";

export default class DDBDynamicUpdateSetup extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-settings-dynamic-updates";
    options.template = "modules/ddb-importer/handlebars/dynamic-updates.hbs";
    options.width = 500;
    return options;
  }

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

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Dynamic Update Settings";
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    const tier = PatreonHelper.getPatreonTier();
    const tiers = PatreonHelper.calculateAccessMatrix(tier);
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
    const gmUsers = DDBDynamicUpdateSetup.getGMUsers();

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
