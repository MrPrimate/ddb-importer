import DDBMuncher from "../../muncher/ddb.js";
import { DDBSetup, isSetupComplete, isValidKey } from "../../lib/Settings.js";


export function addMuncher (app, html) {
  if (app.options.id == "compendium" && game.user.isGM) {
    let button = $("<button class='ddb-muncher'><i class='fas fa-pastafarianism'></i> DDB Muncher</button>");

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

    $(html).find(".directory-footer").append(button);
  }
}
