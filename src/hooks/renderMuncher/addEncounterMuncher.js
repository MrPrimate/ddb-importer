import { DDBEncounterMunch } from "../../muncher/encounters.js";
import { DDBSetup, DDBCookie, isSetupComplete, isValidKey } from "../../lib/Settings.js";
import { checkCobalt } from "../../lib/Secrets.js";
import { getPatreonTiers } from "../../muncher/utils.js";


export function addEncounterMuncher (app, html) {
  const tier = game.settings.get("ddb-importer", "patreon-tier");
  const tiers = getPatreonTiers(tier);

  if (app.options.id == "actors" && game.user.isGM && tiers.god) {
    let button = $("<div class='header-actions action-buttons flexrow'><button class='ddb-muncher' id='ddb-encounter-munch-open'><i class='fas fa-dungeon'></i> DDB Encounter Muncher</button></div>");

    const actualButton = button.find('#ddb-encounter-munch-open');
    button.click(async () => {
      actualButton.prop('disabled', true);
      ui.notifications.info("Fetching your DDB Encounter Information, this might take a few seconds!");
      const setupComplete = isSetupComplete();

      if (setupComplete) {
        const cobaltStatus = await checkCobalt();
        if (cobaltStatus.success) {
          let validKey = await isValidKey();
          if (validKey) {
            new DDBEncounterMunch().render(true);
          }
        } else {
          actualButton.prop('disabled', false);
          new DDBCookie().render(true);
        }
      } else {
        actualButton.prop('disabled', false);
        new DDBSetup().render(true);
      }
    });

    const top = game.settings.get("ddb-importer", "show-munch-top");
    if (top) {
      $(html).find(".directory-header").prepend(button);
    } else {
      $(html).find(".directory-footer").append(button);
    }

    Hooks.on("closeApplication", (app) => {
      console.warn(app);
      if (app instanceof DDBEncounterMunch) {
        actualButton.prop('disabled', false);
      }
    });

  }
}
