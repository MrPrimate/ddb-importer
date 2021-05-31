import DDBMuncher from "../../muncher/ddb.js";
import { DDBSetup, isSetupComplete, isValidKey } from "../../lib/Settings.js";


export function addMuncher (app, html) {
  if (app.options.id == "compendium" && game.user.isGM) {
    let button = $("<div class='header-actions action-buttons flexrow'><button class='ddb-muncher'><i class='fas fa-pastafarianism'></i> DDB Muncher</button></div>");

    button.click(async () => {
      const setupComplete = isSetupComplete();

      if (setupComplete) {
        let validKey = await isValidKey();
        if (validKey) {
          new DDBMuncher().render(true);
        }
      } else {
        game.settings.set("ddb-importer", "settings-call-muncher", true);
        new DDBSetup().render(true);
      }
    });

    game.settings.register("ddb-importer", "show-munch-top", {
      name: "ddb-importer.show-munch-top.name",
      hint: "ddb-importer.show-munch-top.hint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
    });

    const top = game.settings.get("ddb-importer", "show-munch-top");
    if (top) {
      $(html).find(".directory-header").append(button);
    } else {
      $(html).find(".directory-footer").append(button);
    }

  }
}
