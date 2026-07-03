import { logger, FileHelper, DDBProxy, fetchJson } from "../../lib/_module";
import { fallbackDDBConfig } from "./fallbackConfig";
import { SETTINGS } from "../../config/_module";
import addDDBConfig from "./addDDBConfig";
import { RULE_DATA } from "./fallbackRules";

async function directConfig() {
  $.getJSON("https://www.dndbeyond.com/api/config/json")
    .then((config) => {
      if (config && config.sources) {
        foundry.utils.setProperty(CONFIG, "DDB", config);
        logger.info("Loaded DDB live config");
      }
      return config;
    })
    .catch((err) => {
      logger.warn("Failed to load DDB config, caught error using fallback.", err);
      return err;
    })
    .always(() => {
      if (!CONFIG.DDB?.sources) {
        foundry.utils.setProperty(CONFIG, "DDB", fallbackDDBConfig);
        logger.warn("Failed to load DDB config, using fallback.");
      } else {
        logger.info("A DDB config was loaded");
      }
      logger.debug("DDB_CONFIG", CONFIG.DDB);
    });
}

async function proxyConfig() {
  const parsingApi = DDBProxy.getProxy();
  const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");

  const url = `${parsingApi}/proxy/api/config/json`;
  const data = await fetchJson(url, {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (debugJson) {
    FileHelper.download(JSON.stringify(data), `config-raw.json`, "application/json");
  }
  if (!data.success) {
    logger.error(`API Failure: ${data.message}`);
    foundry.utils.setProperty(CONFIG, "DDB", fallbackDDBConfig);
    logger.debug("DDB_CONFIG", CONFIG.DDB);
    return Promise.reject(data.message);
  }
  logger.info(`Retrieved DDB CONFIG DATA via proxy`);
  foundry.utils.setProperty(CONFIG, "DDB", data.data);
  logger.debug("DDB_CONFIG", CONFIG.DDB);
  return data.data;
}

export function loadDDBConfig() {
  if (!foundry.utils.hasProperty(CONFIG, "DDB")) {
    foundry.utils.setProperty(CONFIG, "DDB", fallbackDDBConfig);
    foundry.utils.setProperty(CONFIG, "DDB.RULE_DATA", RULE_DATA);
    if (foundry.utils.getProperty(CONFIG, "DEBUG.DDBI.DIRECT_CONFIG")) {
      if ((/electron/i).test(navigator.userAgent)) {
        logger.info("Electron detected using DDB Config stub");
      } else {
        logger.info("Loaded default DDB config, checking for live config access.");
        directConfig().then(() => {
          addDDBConfig();
        });
      }
    } else {
      proxyConfig().then(() => {
        addDDBConfig();
      });
    }
  }
}
