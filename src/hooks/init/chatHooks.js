
function addAppButtonClickEvent(event) {
  const menu = game.settings.menus.get(event.currentTarget.dataset.key);
  const app = new menu.type({
    sheetTab: "core",
  });
  return app.render(true);
}

function addChatImgButtonClickEvent(chatImg) {
  if (foundry.applications?.apps?.ImagePopout) {
    new foundry.applications.apps.ImagePopout({
      src: $(chatImg).attr("src"),
      showTitle: false,
    }).render(true);
  } else {
    new ImagePopout($(chatImg).attr("src"), { shareable: true }).render(true);
  }
}

export function chatHooks() {

  Hooks.on("renderChatMessageHTML", (message, element) => {
    console.warn({
      message,
      element,
    })
    const chatImg = element.querySelector("img.ddbimporter-chat-image");
    const settingsButton = element.querySelector("button.ddb-importer-chat-settings");

    console.warn({
      chatImg,
      settingsButton
    })
    if (chatImg) chatImg.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      addChatImgButtonClickEvent(chatImg);
    });
    if (settingsButton) settingsButton.addEventListener("click", addAppButtonClickEvent);

  });

}
