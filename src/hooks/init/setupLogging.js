export default function () {
  let enabledDebugLogging = false;

  let defaults = {
    general: enabledDebugLogging,
    messaging: enabledDebugLogging,
    character: enabledDebugLogging,
    extension: enabledDebugLogging,
  };

  if (!CONFIG.debug.ddbimporter) {
    CONFIG.debug.ddbimporter = { dndbeyond: defaults };
  } else {
    CONFIG.debug.ddbimporter.dndbeyond = defaults;
  }
}
