const logger = {
    _showMessage: (logLevel, data) => {
        if (!logLevel || !data || typeof (logLevel) !== 'string') {
            return false;
        }

        const setting = game.settings.get("ddb-importer", "log-level");
        const logLevels = ["DEBUG", "INFO", "WARN", "ERR", "OFF"];
        const logLevelIndex = logLevels.indexOf(logLevel.toUpperCase());
        if (setting == "OFF" ||
            logLevelIndex === -1 ||
            logLevelIndex < logLevels.indexOf(setting)) {
            return false;
        }
        return true;
    },
    log: (logLevel, ...data) => {
        if (!logger._showMessage) {
            return;
        }

        logLevel = logLevel.toUpperCase();

        const LOG_PREFIX = "DDB Importer";
        let msg = "No logging message provided.  Please see the payload for more information.";
        let payload = data.slice();
        if (data[0] && typeof (data[0] == 'string')) {
            msg = data[0];
            if (data.length > 1) {
                payload = data.slice(1);
            } else {
                payload = null;
            }
        }
        msg = `${LOG_PREFIX} | ${logLevel} > ${msg}`;
        switch (logLevel) {
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

};
export default logger;
