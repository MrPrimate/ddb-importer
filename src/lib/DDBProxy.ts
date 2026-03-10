import { SETTINGS } from "../config/_module";
import { utils } from "./_module";

const DDBProxy = {

  isCustom: (orDev = false): boolean => {
    if (orDev && CONFIG.DDBI.DEV.enabled) return false;
    return utils.getSetting<boolean>("custom-proxy");
  },

  resetProxy: () => {
    game.settings.set(SETTINGS.MODULE_ID, "api-endpoint", SETTINGS.DEFAULT_SETTINGS.READY.PROXY["api-endpoint"].default);
    game.settings.set(SETTINGS.MODULE_ID, "custom-proxy", false);
  },

  getProxy: (): string => {
    if (DDBProxy.isCustom() || CONFIG.DDBI.DEV.enabled) return utils.getSetting<string>("api-endpoint");
    else return SETTINGS.URLS.PROXY;
  },

  getDynamicProxy: (): string => {
    if (CONFIG.DDBI.DEV.enabled) return utils.getSetting<string>( "dynamic-api-endpoint");
    else return SETTINGS.URLS.DYNAMIC;
  },

  getCORSProxy: (): string => {
    if (DDBProxy.isCustom() || CONFIG.DDBI.DEV.enabled || CONFIG.DDBI.DEV.customCors) return utils.getSetting<string>("cors-endpoint");
    return SETTINGS.URLS.CORS;
  },


};

export default DDBProxy;
