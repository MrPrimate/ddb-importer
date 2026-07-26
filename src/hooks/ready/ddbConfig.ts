import { logger, FileHelper, DDBProxy, fetchJson, utils } from "../../lib/_module";
import addDDBConfig from "./addDDBConfig";

// Loaded from data/fallback-config.json at ready; used when the remote config
// fetch fails. Null until fetchFallbackData resolves, or if that fetch failed.
let fallbackDDBConfig: IDDBConfig | null = null;

async function loadDataJson<T>(fileName: string): Promise<T> {
  const url = await FileHelper.getFileUrl("[data] modules/ddb-importer/data", fileName);
  const data = await foundry.utils.fetchJsonWithTimeout(url);
  return data as T;
}

async function fetchFallbackData(): Promise<{ config: IDDBConfig; rules: IDDBRuleData } | null> {
  try {
    const [config, rules] = await Promise.all([
      loadDataJson<IDDBConfig>("fallback-config.json"),
      loadDataJson<IDDBRuleData>("fallback-rules.json"),
    ]);
    return { config, rules };
  } catch (err) {
    logger.error("Failed to load fallback DDB config/rules JSON assets. The module data folder may be missing or corrupt.", err);
    return null;
  }
}

function applyFallbackConfig() {
  if (fallbackDDBConfig) {
    foundry.utils.setProperty(CONFIG, "DDB", fallbackDDBConfig);
    logger.warn("Failed to load DDB config, using fallback.");
  } else {
    logger.error("Failed to load DDB config and no fallback config is available.");
  }
}

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
        applyFallbackConfig();
      } else {
        logger.info("A DDB config was loaded");
      }
      logger.debug("DDB_CONFIG", CONFIG.DDB);
    });
}

async function proxyConfig() {
  const parsingApi = DDBProxy.getProxy();
  const debugJson = utils.getSetting<boolean>("debug-json");

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
    applyFallbackConfig();
    logger.debug("DDB_CONFIG", CONFIG.DDB);
    return Promise.reject(data.message);
  }
  logger.info(`Retrieved DDB CONFIG DATA via proxy`);
  foundry.utils.setProperty(CONFIG, "DDB", data.data);
  logger.debug("DDB_CONFIG", CONFIG.DDB);
  return data.data;
}

export async function loadDDBConfig() {
  if (!foundry.utils.hasProperty(CONFIG, "DDB")) {
    const fallback = await fetchFallbackData();
    if (fallback) {
      fallbackDDBConfig = fallback.config;
      foundry.utils.setProperty(CONFIG, "DDB", fallback.config);
      foundry.utils.setProperty(CONFIG, "DDB.RULE_DATA", fallback.rules);
    }
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
