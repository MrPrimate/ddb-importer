import logger from "../../logger.js";
import { fallbackDDBConfig } from "./fallbackConfig.js";

export function loadDDBConfig() {
  if (!CONFIG.DDB) {
    setProperty(CONFIG, "DDB", fallbackDDBConfig);
    if ((/electron/i).test(navigator.userAgent)) {
      logger.info("Electron detected using DDB Config stub");
      logger.debug("DDB_CONFIG", CONFIG.DDB);
    } else {
      logger.info("Loaded default DDB config, checking for live config access.");
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
  }
}
