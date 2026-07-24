import DDBCookie from "../../apps/DDBCookie";
import DDBSetup from "../../apps/DDBSetup";
import { PatreonHelper, Secrets, utils } from "../../lib/_module";
import DDBMuncher from "../../apps/DDBMuncher";

export function addMuncher(app: any, html: HTMLElement) {
  if (app.id !== "compendium" || !game.user.isGM) return;
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
        const validKey = await PatreonHelper.isValidKey();
        if (validKey) {
          new DDBMuncher().render({ force: true });
        }
      } else {
        new DDBCookie({ callMuncher: true }).render(true);
      }
    } else {
      new DDBSetup({ callMuncher: true }).render({ force: true });
    }
  });

  const top = utils.getSetting<boolean>("show-munch-top");
  if (top) {
    html.querySelector(".header-actions")?.append(button);
  } else {
    html.querySelector(".directory-footer")?.append(button);
  }
}
