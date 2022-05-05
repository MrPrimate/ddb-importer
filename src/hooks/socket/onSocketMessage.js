import logger from "../../logger.js";

export function onSocketMessage (sender, data) {
  switch (data.action) {
    case "showImage": {
      logger.warn("showImage handler has been removed, use ImagePopout instead");
    }
    // no default
  }
}
