import logger from "../../logger.js";


export function anchorInjection() {
  Hooks.on("activateNote", (app, options) => {
    if (app.document?.flags?.ddb?.slugLink) {
      logger.debug("Injecting note anchor", app.document.flags.ddb.slugLink);
      options["anchor"] = app.document.flags.ddb.slugLink;
    } else if (app.document?.flags?.anchor) {
      logger.debug("Injecting note anchor", app.document.flags.anchor);
      options["anchor"] = app.document.flags.anchor;
    }
  });

}
