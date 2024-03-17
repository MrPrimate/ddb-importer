/* eslint-disable no-continue */
import FileHelper from "./lib/FileHelper.js";

const logger = {

  LOG_PREFIX: "DDB Importer",
  LOG_MSG_DEFAULT: "No logging message provided.  Please see the payload for more information.",

  _showMessage: (logLevel, data) => {
    if (!logLevel || !data || typeof (logLevel) !== 'string') {
      return false;
    }

    try {
      const setting = game.settings.get("ddb-importer", "log-level");
      const logLevels = ["DEBUG", "TIME", "TIMEEND", "TIMELOG", "INFO", "WARN", "ERR", "OFF"];
      const logLevelIndex = logLevels.indexOf(logLevel.toUpperCase());
      if (setting == "OFF"
              || logLevelIndex === -1
              || logLevelIndex < logLevels.indexOf(setting)) {
        return false;
      }
      return true;
    } catch (err) {
      return true;
    }

  },
  _addToLogFile: (logLevel, data) => {
    if (foundry.utils.getProperty(CONFIG.debug, "ddbimporter.record") === true) {
      CONFIG.debug.ddbimporter.log.push({
        level: logLevel,
        data: data,
      });
    }
  },
  // eslint-disable-next-line complexity
  log: (logLevel, ...data) => {
    logger._addToLogFile(logLevel, data);
    if (!logger._showMessage(logLevel, data)) {
      return;
    }

    const logLevelType = logLevel.startsWith("TIME")
      ? "DEBUG"
      : logLevel.toUpperCase();

    const msgContent = data[0] && typeof (data[0] == 'string')
      ? data[0]
      : logger.LOG_MSG_DEFAULT;
    const payload = data[0] && typeof (data[0] == 'string')
      ? data.length > 1
        ? data.slice(1)
        : null
      : data.slice();
    const msg = `${logger.LOG_PREFIX} | ${logLevelType} > ${msgContent}`;

    switch (logLevel.toUpperCase()) {
      case "DEBUG":
        if (payload) {
          console.debug(msg, ...payload);// eslint-disable-line no-console
        } else {
          console.debug(msg);// eslint-disable-line no-console
        }
        break;
      case "INFO":
        if (payload) {
          console.info(msg, ...payload);// eslint-disable-line no-console
        } else {
          console.info(msg);// eslint-disable-line no-console
        }
        break;
      case "WARN":
        if (payload) {
          console.warn(msg, ...payload);// eslint-disable-line no-console
        } else {
          console.warn(msg);// eslint-disable-line no-console
        }
        break;
      case "ERR":
        if (payload) {
          console.error(msg, ...payload);// eslint-disable-line no-console
        } else {
          console.error(msg);// eslint-disable-line no-console
        }
        break;
      case "TIME":
        if (payload) {
          console.time(msg, ...payload);// eslint-disable-line no-console
        } else {
          console.time(msg);// eslint-disable-line no-console
        }
        break;
      case "TIMEEND":
        if (payload) {
          console.timeEnd(msg, ...payload);// eslint-disable-line no-console
        } else {
          console.timeEnd(msg);// eslint-disable-line no-console
        }
        break;
      case "TIMELOG":
        if (payload) {
          console.timeLog(msg, ...payload);// eslint-disable-line no-console
        } else {
          console.timeLog(msg);// eslint-disable-line no-console
        }
        break;
      default: break;
    }
  },

  debug: (...data) => {
    logger.log("DEBUG", ...data);
  },

  info: (...data) => {
    logger.log("INFO", ...data);
  },

  warn: (...data) => {
    logger.log("WARN", ...data);
  },

  error: (...data) => {
    logger.log("ERR", ...data);
  },

  time: (...data) => {
    logger.log("TIME", ...data);
  },

  timeEnd: (...data) => {
    logger.log("TIMEEND", ...data);
  },

  timeLog: (...data) => {
    logger.log("TIMELOG", ...data);
  },

};
export default logger;

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    // eslint-disable-next-line consistent-return
    return value;
  };
};

function downloadLog() {
  FileHelper.download(JSON.stringify(CONFIG.debug.ddbimporter.log, getCircularReplacer()), `ddbimporter-log-data.json`, "application/json");
  foundry.utils.setProperty(CONFIG.debug, "ddbimporter.log", []);
}

export function setupLogger() {
  const enabledDebugLogging = false;

  const defaults = {
    record: enabledDebugLogging,
    log: [],
    download: downloadLog,
  };

  foundry.utils.setProperty(CONFIG.debug, "ddbimporter", defaults);
}
