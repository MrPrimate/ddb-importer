import FileHelper from "../../lib/FileHelper.js";

function downloadLog() {
  FileHelper.download(JSON.stringify(CONFIG.debug.ddbimporter.log), `ddbimporter-log-data.json`, "application/json");
  setProperty(CONFIG.debug, "ddbimporter.log", []);
}

export default function () {
  const enabledDebugLogging = false;

  const defaults = {
    record: enabledDebugLogging,
    log: [],
    download: downloadLog,
  };

  setProperty(CONFIG.debug, "ddbimporter", defaults);
}
