
export function chatHooks() {
  Hooks.on("renderChatMessage", (message, html) => {
    const chatImg = html.find("img.ddbimporter-chat-image");
    chatImg.click((event) => {
      event.preventDefault();
      event.stopPropagation();
      new ImagePopout($(chatImg).attr("src"), { shareable: true }).render(true);
    });
  });
}
