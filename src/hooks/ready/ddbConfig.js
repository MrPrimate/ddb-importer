import logger from "../../logger.js";
import { fallbackDDBConfig } from "./fallbackConfig.js";

export function loadDDBConfig() {
  if (!CONFIG.DDB) {
    try {
      $.getJSON("https://www.dndbeyond.com/api/config/json").then((config) => {
        if (config && config.sources) {
          setProperty(CONFIG, "DDB", config);
          logger.debug("Loaded DDB live config");
        } else {
          setProperty(CONFIG, "DDB", fallbackDDBConfig);
          logger.warn("Failed to load DDB config, using fallback.");
        }
        logger.debug("DDB_CONFIG", CONFIG.DDB);
      });
    } catch (err) {
      setProperty(CONFIG, "DDB", fallbackDDBConfig);
      logger.warn("Failed to load DDB config, using fallback.");
    }
  }
}

