import logger from "../../logger.js";

export function loadDDBConfig() {
  if (!CONFIG.DDB) {
    $.getJSON("https://www.dndbeyond.com/api/config/json").then((config) => {
      setProperty(CONFIG, "DDB", config);
      logger.debug("DDB_CONFIG", config);
    });
  }
}

