import { FileHelper } from "../../lib/_module.mjs";

function downloadLog() {
  FileHelper.download(JSON.stringify(CONFIG.debug.ddbimporter.log), `ddbimporter-log-data.json`, "application/json");
  foundry.utils.setProperty(CONFIG.debug, "ddbimporter.log", []);
}

export default function () {
  const enabledDebugLogging = false;

  const defaults = {
    record: enabledDebugLogging,
    log: [],
    download: downloadLog,
  };

  foundry.utils.setProperty(CONFIG.debug, "ddbimporter", defaults);
}
