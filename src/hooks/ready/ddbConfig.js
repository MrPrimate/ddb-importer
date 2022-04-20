import logger from "../../logger.js";
import { fallbackDDBConfig } from "./fallbackConfig.js";
import { download } from "../../muncher/utils.js";

function directConfig() {
  $.getJSON("https://www.dndbeyond.com/api/config/json")
    .then((config) => {
      if (config && config.sources) {
        setProperty(CONFIG, "DDB", config);
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
        setProperty(CONFIG, "DDB", fallbackDDBConfig);
        logger.warn("Failed to load DDB config, using fallback.");
      } else {
        logger.info("A DDB config was loaded");
      }
      logger.debug("DDB_CONFIG", CONFIG.DDB);
    });
}

function proxyConfig() {
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const debugJson = game.settings.get("ddb-importer", "debug-json");

  const url = `${parsingApi}/proxy/api/config/json`;
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          logger.error(`API Failure: ${data.message}`);
          reject(data.message);
        }
        if (debugJson) {
          download(JSON.stringify(data), `config-raw.json`, "application/json");
        }
        return data;
      })
      .then((data) => {
        logger.info(`Retrieved DDB CONFIG DATA via proxy`);
        setProperty(CONFIG, "DDB", data.data);
        logger.debug("DDB_CONFIG", CONFIG.DDB);
        resolve(data.data);
      })
      .catch((error) => reject(error));
  });
}

export function loadDDBConfig() {
  if (!hasProperty(CONFIG, "DDB")) {
    setProperty(CONFIG, "DDB", fallbackDDBConfig);
    if (getProperty(CONFIG, "DEBUG.DDBI.DIRECT_CONFIG")) {
      if ((/electron/i).test(navigator.userAgent)) {
        logger.info("Electron detected using DDB Config stub");
        logger.debug("DDB_CONFIG", CONFIG.DDB);
      } else {
        logger.info("Loaded default DDB config, checking for live config access.");
        directConfig();
      }
    } else {
      proxyConfig();
    }
  }
}
