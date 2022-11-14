import SETTINGS from "../settings.js";

const DDBProxy = {

  resetProxy: () => {
    game.settings.set(SETTINGS.MODULE_ID, "api-endpoint", SETTINGS.DEFAULTS.PROXY);
    game.settings.set(SETTINGS.MODULE_ID, "custom-proxy", false);
  },

  getProxy: () => {
    const custom = game.settings.get(SETTINGS.MODULE_ID, "custom-proxy");
    if (custom || CONFIG.DDBI.DEV.enabled) return game.settings.get(SETTINGS.MODULE_ID, "api-endpoint");
    else return SETTINGS.DEFAULTS.PROXY;
  },

  getDynamicProxy: () => {
    if (CONFIG.DDBI.DEV.enabled) return game.settings.get(SETTINGS.MODULE_ID, "dynamic-api-endpoint");
    else return SETTINGS.DEFAULTS.DYNAMIC;
  },

  getCORSProxy: () => {
    const custom = game.settings.get(SETTINGS.MODULE_ID, "custom-proxy");
    if (custom || CONFIG.DDBI.DEV.enabled) return game.settings.get(SETTINGS.MODULE_ID, "cors-endpoint");
    return SETTINGS.DEFAULTS.CORS;
  },


};

export default DDBProxy;
