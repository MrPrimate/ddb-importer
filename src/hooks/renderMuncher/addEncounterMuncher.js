import { DDBEncounterMunch } from "../../muncher/encounter.js";
import { DDBSetup, DDBCookie, isSetupComplete, isValidKey } from "../../lib/Settings.js";
import { checkCobalt } from "../../lib/Secrets.js";


export function addEncounterMuncher (app, html) {
  if (app.options.id == "actor" && game.user.isGM) {
    let button = $("<div class='header-actions action-buttons flexrow'><button class='ddb-muncher'><i class='fas fa-pastafarianism'></i> DDB Encounter Muncher</button></div>");

    button.click(async () => {
      const setupComplete = isSetupComplete();

      if (setupComplete) {
        const cobaltStatus = await checkCobalt();
        if (cobaltStatus.success) {
          let validKey = await isValidKey();
          if (validKey) {
            new DDBEncounterMunch().render(true);
          }
        } else {
          new DDBCookie().render(true);
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
