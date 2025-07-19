
export function chatHooks() {
  Hooks.on("renderChatMessage", (message, html) => {
    const chatImg = html.find("img.ddbimporter-chat-image");
    chatImg.click((event) => {
      event.preventDefault();
      event.stopPropagation();
      if (foundry.applications?.apps?.ImagePopout) {
        new foundry.applications.apps.ImagePopout({
          src: $(chatImg).attr("src"),
          showTitle: false,
        }).render(true);
      } else {
        new ImagePopout($(chatImg).attr("src"), { shareable: true }).render(true);
      }
    });

    const settingsButton = html.find("button.ddb-importer-chat-settings");

    settingsButton.click((event) => {
      event.preventDefault();
      const menu = game.settings.menus.get(event.currentTarget.dataset.key);
      const app = new menu.type({
        sheetTab: "core",
      });
      return app.render(true);
    });
  });
}
