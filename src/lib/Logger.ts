/* eslint-disable no-console */

// Error's diagnostic properties are non-enumerable and otherwise export as {}.
const serializeLogValue = (value) => value instanceof Error
  ? { ...value, name: value.name, message: value.message, stack: value.stack }
  : value;

/** Levels in increasing severity; a message shows when its level is at or above the active one. */
const LOG_LEVELS = ["VERBOSE", "DEBUG", "TIME", "TIMEEND", "TIMELOG", "INFO", "WARN", "ERR", "OFF"];

const logger = {

  LOG_PREFIX: "DDB Importer",
  LOG_MSG_DEFAULT: "No logging message provided. Please see the payload for more information.",

  /**
   * A client-only level that takes precedence over the world `log-level` setting while set. Bulk
   * runs use it to drop to WARN without changing the setting for everyone in the world: at DEBUG,
   * the console keeps every logged parser object (and the character graph behind it) alive.
   */
  levelOverride: null as string | null,

  /**
   * Set or clear (null) the client-only level override. Returns the previous override so a caller
   * can restore it.
   */
  setLevelOverride: (level: string | null): string | null => {
    const previous = logger.levelOverride;
    const normalised = level === null ? null : String(level).toUpperCase();
    if (normalised !== null && !LOG_LEVELS.includes(normalised)) {
      throw new Error(`Unknown log level "${level}", expected one of ${LOG_LEVELS.join(", ")}`);
    }
    logger.levelOverride = normalised;
    return previous;
  },

  _showMessage: (logLevel: string, data: unknown[]) => {
    if (!logLevel || !data || typeof (logLevel) !== "string") {
      return false;
    }

    try {
      const setting = logger.levelOverride ?? game.settings.get("ddb-importer", "log-level") as unknown as string;
      const logLevelIndex = LOG_LEVELS.indexOf(logLevel.toUpperCase());
      if (setting == "OFF"
              || logLevelIndex === -1
              || logLevelIndex < LOG_LEVELS.indexOf(setting)) {
        return false;
      }
      return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      return true;
    }

  },
  _addToLogFile: (logLevel, data) => {
    if (foundry.utils.getProperty(CONFIG.debug, "ddbimporter.record") === true) {
      CONFIG.debug.ddbimporter.log.push({
        level: logLevel,
        data: data.map(serializeLogValue),
      });
    }
  },

  log: (logLevel, ...data) => {
    logger._addToLogFile(logLevel, data);
    if (!logger._showMessage(logLevel, data)) {
      return;
    }

    const logLevelType = logLevel.startsWith("TIME")
      ? "DEBUG"
      : logLevel.toUpperCase();

    const msgContent = typeof data[0] === "string"
      ? data[0]
      : logger.LOG_MSG_DEFAULT;
    const payload = typeof data[0] === "string"
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
        CONFIG.DDBI.CAPTURED_ERRORS.push({ type: "ERROR", msg, payload: payload?.map(serializeLogValue) ?? null });
        break;
      case "TIME":
        if (payload) {
          console.time(msg, ...payload);
        } else {
          console.time(msg);
        }
        break;
      case "TIMEEND":
        if (payload) {
          console.timeEnd(msg, ...payload);
        } else {
          console.timeEnd(msg);
        }
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

  verbose: (...data) => {
    logger.log("VERBOSE", ...data);
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
  return (_key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }

    return value;
  };
};

async function downloadLog() {
  // lazy: Logger is the first import of nearly every module, so a static FileHelper import
  // (which pulls the lib barrel) would re-enter the enricher tree during load
  const { default: FileHelper } = await import("./FileHelper");
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
