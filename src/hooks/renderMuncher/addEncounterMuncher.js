import DDBEncounterMunch from "../../apps/DDBEncounterMunch.js";
import DDBCookie from "../../apps/DDBCookie.js";
import DDBSetup from "../../apps/DDBSetup.js";
import { isValidKey } from "../../apps/DDBKeyChange.js";
import { checkCobalt } from "../../lib/Secrets.js";
import PatreonHelper from "../../lib/PatreonHelper.js";
import logger from "../../logger.js";


export function addEncounterMuncher (app, html) {
  const tier = PatreonHelper.getPatreonTier();
  const tiers = PatreonHelper.calculateAccessMatrix(tier);
  const enabled = game.settings.get("ddb-importer", "encounter-muncher-enabled");

  const scenesTab = app.options.id == "scenes" || app.id === "scenes";

  if (enabled && scenesTab && game.user.isGM && tiers.supporter) {
    let button = $("<div class='header-actions action-buttons flexrow'><button class='ddb-muncher' id='ddb-encounter-munch-open'><i class='fas fa-dungeon'></i> DDB Encounter Muncher</button></div>");

    const actualButton = button.find('#ddb-encounter-munch-open');
    actualButton.click(async () => {
      actualButton.prop('disabled', true);
      ui.notifications.info("Fetching your DDB Encounter Information, this might take a few seconds!");
      try {
        const setupComplete = DDBSetup.isSetupComplete();

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

        const hookId = Hooks.on("closeApplication", (app) => {
          if (app instanceof DDBEncounterMunch) {
            actualButton.prop('disabled', false);
            Hooks.off("closeApplication", hookId);
          }
        });
      } catch (e) {
        logger.error(e);
        actualButton.prop('disabled', false);
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
