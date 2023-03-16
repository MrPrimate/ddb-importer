import SETTINGS from "../settings.js";
import DDBProxy from "../lib/DDBProxy.js";


export class DDBProxySetup extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-proxy";
    options.template = "modules/ddb-importer/handlebars/ddbProxySetup.hbs";
    options.width = 500;
    return options;
  }

  get title() { // eslint-disable-line class-methods-use-this
    return game.i18n.localize(`${SETTINGS.MODULE_ID}.Dialogs.DDBProxy.AppTitle`);
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    const useCustomProxy = DDBProxy.isCustom();
    const defaultAddress = SETTINGS.URLS.PROXY;
    const proxyAddress = game.settings.get(SETTINGS.MODULE_ID, "api-endpoint");

    return {
      useCustomProxy,
      proxyAddress,
      defaultAddress,
    };
  }

  /** @override */
  async _updateObject(event, formData) { // eslint-disable-line class-methods-use-this
    event.preventDefault();

    const useCustomProxy = formData['custom-proxy'];
    const proxyAddress = formData['api-endpoint'];

    await game.settings.set(SETTINGS.MODULE_ID, "custom-proxy", useCustomProxy);
    await game.settings.set(SETTINGS.MODULE_ID, "api-endpoint", proxyAddress);
  }
}
