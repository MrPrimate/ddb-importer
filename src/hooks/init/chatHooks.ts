
function addAppButtonClickEvent(event: any) {
  const menu = game.settings.menus.get(event.currentTarget.dataset.key);
  if (!menu) return undefined;
  const MenuApplication = menu.type as new (options?: Record<string, any>) => { render: (force?: boolean) => unknown };
  const app = new MenuApplication({
    sheetTab: "core",
  });
  return app.render(true);
}

function addChatImgButtonClickEvent(chatImg: HTMLElement) {
  const src = $(chatImg).attr("src");
  if (!src) return;
  new foundry.applications.apps.ImagePopout({
    src,
    showTitle: false,
  }).render({ force: true});
}

export function chatHooks() {

  Hooks.on("renderChatMessageHTML", (_message, element) => {
    const chatImg = element.querySelector("img.ddbimporter-chat-image");
    const settingsButton = element.querySelector("button.ddb-importer-chat-settings");

    if (chatImg) chatImg.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      addChatImgButtonClickEvent(chatImg as HTMLElement);
    });
    if (settingsButton) settingsButton.addEventListener("click", addAppButtonClickEvent);
  });

}
