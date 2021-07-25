import { DDBEncounterMunch } from "../../muncher/encounters.js";
import { DDBSetup, DDBCookie, isSetupComplete, isValidKey } from "../../lib/Settings.js";
import { checkCobalt } from "../../lib/Secrets.js";
import { getPatreonTiers } from "../../muncher/utils.js";


export function addEncounterMuncher (app, html) {
  const tier = game.settings.get("ddb-importer", "patreon-tier");
  const tiers = getPatreonTiers(tier);

  if (app.options.id == "actors" && game.user.isGM && tiers.god) {
    let button = $("<div class='header-actions action-buttons flexrow'><button class='ddb-muncher'><i class='fas fa-dungeon'></i> DDB Encounter Muncher</button></div>");

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

    const top = game.settings.get("ddb-importer", "show-munch-top");
    if (top) {
      $(html).find(".directory-header").prepend(button);
    } else {
      $(html).find(".directory-footer").append(button);
    }

  }
}
