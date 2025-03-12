import DDBCookie from "../../apps/DDBCookie.js";
import DDBSetup from "../../apps/DDBSetup.js";
import { Secrets } from "../../lib/_module.mjs";
import { isValidKey } from "../../apps/DDBKeyChange.js";
import DDBMuncher from "../../apps/DDBMuncher.js";

export function addMuncher(app, html) {
  if (app.options.id !== "compendium" || !game.user.isGM) return;
  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("ddb-muncher");
  button.innerHTML = `
    <i class="fas fa-pastafarianism" inert></i>
    DDB Muncher
  `;

  button.addEventListener("click", async (_event) => {
    ui.notifications.info("Checking your DDB details - this might take a few seconds!");
    const setupComplete = DDBSetup.isSetupComplete();

    if (setupComplete) {
      const cobaltStatus = await Secrets.checkCobalt();
      if (cobaltStatus.success) {
        let validKey = await isValidKey();
        if (validKey) {
          new DDBMuncher().render(true);
        }
      } else {
        new DDBCookie({ callMuncher: true }).render(true);
      }
    } else {
      new DDBSetup({ callMuncher: true }).render(true);
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
