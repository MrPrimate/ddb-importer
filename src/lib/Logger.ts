/* eslint-disable no-console */

import FileHelper from "./FileHelper";

/**
 * Typed accessor for CONFIG.debug.ddbimporter.
 * CONFIG.debug is a closed inline type in foundry-vtt-types that cannot be
 * extended via declaration merging, so this helper encapsulates the cast.
 */
export function ddbDebug(): IDDBImporterDebug {
  return (CONFIG.debug as CONFIG["debug"] & { ddbimporter: IDDBImporterDebug }).ddbimporter;
}


const logger = {

  LOG_PREFIX: "DDB Importer",
  LOG_MSG_DEFAULT: "No logging message provided. Please see the payload for more information.",

  _showMessage: (logLevel: string, data: unknown[]) => {
    if (!logLevel || !data || typeof (logLevel) !== "string") {
      return false;
    }

    try {
      const setting = game.settings.get("ddb-importer", "log-level") as unknown as string;
      const logLevels = ["VERBOSE", "DEBUG", "TIME", "TIMEEND", "TIMELOG", "INFO", "WARN", "ERR", "OFF"];
      const logLevelIndex = logLevels.indexOf(logLevel.toUpperCase());
      if (setting == "OFF"
              || logLevelIndex === -1
              || logLevelIndex < logLevels.indexOf(setting)) {
        return false;
      }
      return true;
    } catch (_err) {
      // the log-level setting is not yet registered (calls before the init
      // hook); default to showing the message rather than dropping it
      return true;
    }

  },

  _addToLogFile: (logLevel: string, data: unknown[]) => {
    if (foundry.utils.getProperty(CONFIG.debug, "ddbimporter.record") === true) {
      ddbDebug().log.push({
        level: logLevel,
        data: data,
      });
    }
  },

  log: (logLevel: string, ...data: unknown[]) => {
    logger._addToLogFile(logLevel, data);
    if (!logger._showMessage(logLevel, data)) {
      return;
    }

    const logLevelType = logLevel.startsWith("TIME")
      ? "DEBUG"
      : logLevel.toUpperCase();

    const msgContent = data[0] && typeof (data[0] == "string")
      ? data[0]
      : logger.LOG_MSG_DEFAULT;
    const payload = data[0] && typeof (data[0] == "string")
      ? data.length > 1
        ? data.slice(1)
        : null
      : data.slice();
    const msg = `${logger.LOG_PREFIX} | ${logLevelType} > ${msgContent}`;

    switch (logLevel.toUpperCase()) {
      case "VERBOSE":
        if (payload) {
          console.debug(msg, ...payload);
        } else {
          console.debug(msg);
        }
        break;
      case "DEBUG":
        if (payload) {
          console.debug(msg, ...payload);
        } else {
          console.debug(msg);
        }
        break;
      case "INFO":
        if (payload) {
          console.info(msg, ...payload);
        } else {
          console.info(msg);
        }
        break;
      case "WARN":
        if (payload) {
          console.warn(msg, ...payload);
        } else {
          console.warn(msg);
        }
        break;
      case "ERR":
        if (payload) {
          console.error(msg, ...payload);
        } else {
          console.error(msg);
        }
        CONFIG.DDBI.CAPTURED_ERRORS.push({ type: "ERROR", msg, payload });
        break;
      case "TIME":
        if (payload) {
          console.debug(msg, ...payload);
        }
        console.timeEnd(msg);
        break;
      case "TIMEEND":
        if (payload) {
          console.debug(msg, ...payload);
        }
        console.timeEnd(msg);
        break;
      case "TIMELOG":
        if (payload) {
          console.timeLog(msg, ...payload);
        } else {
          console.timeLog(msg);
        }
        break;
      default: break;
    }
  },

  debug: (...data: unknown[]) => {
    logger.log("DEBUG", ...data);
  },

  info: (...data: unknown[]) => {
    logger.log("INFO", ...data);
  },

  warn: (...data: unknown[]) => {
    logger.log("WARN", ...data);
  },

  error: (...data: unknown[]) => {
    logger.log("ERR", ...data);
  },

  time: (...data: unknown[]) => {
    logger.log("TIME", ...data);
  },

  verbose: (...data: unknown[]) => {
    logger.log("VERBOSE", ...data);
  },

  timeEnd: (...data: unknown[]) => {
    logger.log("TIMEEND", ...data);
  },

  timeLog: (...data: unknown[]) => {
    logger.log("TIMELOG", ...data);
  },

};
export default logger;

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (_key: string, value: unknown) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }

    return value;
  };
};

function downloadLog() {
  FileHelper.download(JSON.stringify(ddbDebug().log, getCircularReplacer()), `ddbimporter-log-data.json`, "application/json");
  foundry.utils.setProperty(CONFIG.debug, "ddbimporter.log", []);
}

export function setupLogger() {
  const enabledDebugLogging = false;

  const defaults: IDDBImporterDebugConfig = {
    record: enabledDebugLogging,
    log: [],
    download: downloadLog,
  };

  foundry.utils.setProperty(CONFIG.debug, "ddbimporter", defaults);
}
