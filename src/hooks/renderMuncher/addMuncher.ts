import DDBSetup from "../../apps/DDBSetup";
import { utils } from "../../lib/_module";
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
    // the loader dialog covers the wait; the button stays disabled until the muncher is up (or the
    // load stops) so a second click cannot start a second load
    button.disabled = true;
    try {
      if (DDBSetup.isSetupComplete()) {
        await DDBMuncher.open();
      } else {
        new DDBSetup({ callMuncher: true }).render({ force: true });
      }
    } finally {
      button.disabled = false;
    }
  });

  const top = utils.getSetting<boolean>("show-munch-top");
  if (top) {
    html.querySelector(".header-actions")?.append(button);
  } else {
    html.querySelector(".directory-footer")?.append(button);
  }
}
