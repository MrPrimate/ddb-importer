import SETTINGS from "../settings.js";

const DDBProxy = {

  isCustom: () => {
    return game.settings.get(SETTINGS.MODULE_ID, "custom-proxy");
  },

  resetProxy: () => {
    game.settings.set(SETTINGS.MODULE_ID, "api-endpoint", SETTINGS.DEFAULT_SETTINGS.READY.PROXY["api-endpoint"].default);
    game.settings.set(SETTINGS.MODULE_ID, "custom-proxy", false);
  },

  getProxy: () => {
    if (DDBProxy.isCustom() || CONFIG.DDBI.DEV.enabled) return game.settings.get(SETTINGS.MODULE_ID, "api-endpoint");
    else return SETTINGS.URLS.PROXY;
  },

  getDynamicProxy: () => {
    if (CONFIG.DDBI.DEV.enabled) return game.settings.get(SETTINGS.MODULE_ID, "dynamic-api-endpoint");
    else return SETTINGS.URLS.DYNAMIC;
  },

  getCORSProxy: () => {
    if (DDBProxy.isCustom() || CONFIG.DDBI.DEV.enabled || CONFIG.DDBI.DEV.customCors) return game.settings.get(SETTINGS.MODULE_ID, "cors-endpoint");
    return SETTINGS.URLS.CORS;
  },


};

export default DDBProxy;
