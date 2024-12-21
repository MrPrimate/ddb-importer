import DDBEncounterMunch from "../../apps/DDBEncounterMunch.js";
import DDBCookie from "../../apps/DDBCookie.js";
import DDBSetup from "../../apps/DDBSetup.js";
import { isValidKey } from "../../apps/DDBKeyChange.js";
import { logger, Secrets, PatreonHelper } from "../../lib/_module.mjs";


export function addEncounterMuncher (app, html) {
  if (!game.user.isGM) return;

  const tier = PatreonHelper.getPatreonTier();
  const tiers = PatreonHelper.calculateAccessMatrix(tier);
  const enabled = game.settings.get("ddb-importer", "encounter-muncher-enabled");

  console.warn({
    enabled,
    tiers,
    tier,
    app,
    html,
  })

  if (!enabled || !tiers.supporter) return;
  const button = document.createElement("button");
  button.type = "button";
  button.id = "ddb-encounter-munch-open";
  button.classList.add("ddb-muncher");
  button.innerHTML = `
    <i class="fas fa-dungeon" inert></i>
    DDB Encounter Muncher
  `;

  button.addEventListener("click", async (_event) => {
    button.disabled = true;
    ui.notifications.info("Fetching your DDB Encounter Information, this might take a few seconds!");
    try {
      const setupComplete = DDBSetup.isSetupComplete();

      if (setupComplete) {
        const cobaltStatus = await Secrets.checkCobalt();
        if (cobaltStatus.success) {
          let validKey = await isValidKey();
          if (validKey) {
            new DDBEncounterMunch().render(true);
          }
        } else {
          button.disabled = false;
          new DDBCookie().render(true);
        }
      } else {
        button.disabled = false;
        new DDBSetup().render(true);
      }

      const hookId = Hooks.on("closeApplication", (app) => {
        if (app instanceof DDBEncounterMunch) {
          button.disabled = false;
          Hooks.off("closeApplication", hookId);
        }
      });
    } catch (e) {
      logger.error(e);
      button.disabled = false;
    }
  });

  const top = game.settings.get("ddb-importer", "show-munch-top");
  if (top) {
    const headerActions = html.querySelector(".header-actions");
    headerActions.append(button);
  } else {
    const headerActions = html.querySelector(".footer-actions");
    headerActions.append(button);
  }
}
