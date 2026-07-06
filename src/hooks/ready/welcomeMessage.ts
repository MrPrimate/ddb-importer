import { SETTINGS } from "../../config/_module";
import { Secrets, utils } from "../../lib/_module";

function showMessage() {

  const content = [`
<div class="ddb-importer-welcome-message">
  <h3 class="nue">${game.i18n.localize("ddb-importer.Welcome.Title")}</h3>
  <p class="nue">${game.i18n.localize("ddb-importer.Welcome.FirstTime")}</p>
  <p class="nue">${game.i18n.localize("ddb-importer.Welcome.Setup")}</p>
  <p>
    <button type="button" class="ddb-importer-chat-settings" data-key="ddb-importer.setupMenu">
      <i class="fas fa-cogs"></i> ${game.i18n.localize(`${SETTINGS.MODULE_ID}.Welcome.SetupButton`)}
    </button>
  </p>
  <p class="nue">${game.i18n.localize("ddb-importer.Welcome.Later")}</p>
  <footer class="nue"><i class="fas fa-info-circle"></i> ${game.i18n.localize("ddb-importer.Welcome.Fin")}</footer>
</div>
`];
  const chatData = content.map((content) => {
    return {
      whisper: [game.user.id],
      speaker: { alias: "DDB Importer!" },
      flags: { core: { canPopout: true } },
      content,
    };
  });
  ChatMessage.implementation.createDocuments(chatData as unknown as ChatMessage.CreateInput[]);

  // for now we set this to false so it doesn't show again
  game.settings.set(SETTINGS.MODULE_ID, "show-welcome-message", false);
}

export default function welcomeMessage() {
  if (!game.user.isGM) return;
  if (!utils.getSetting<boolean>("show-welcome-message")) return;

  const timeout = setTimeout(() => {
    showMessage();
  }, 10000);

  const cookie = Secrets.getCobalt();
  if (cookie && cookie !== "") {
    clearTimeout(timeout);
    game.settings.set(SETTINGS.MODULE_ID, "show-welcome-message", false);
    return;
  }

  clearTimeout(timeout);
  showMessage();
}
