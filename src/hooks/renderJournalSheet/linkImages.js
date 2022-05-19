function imageToChat(src) {
  const content = `<img class="ddbimporter-chat-image" data-src="${src}" src="${src}">`;

  ChatMessage.create({
    content,
  });
}

export function linkImages(html) {
  if (!game.user.isGM) return;
  const displayImages = game.settings.get("ddb-importer", "show-image-to-players");
  // does this functionality exist from anther module?
  const funcExists = !displayImages ||
    game.modules.get("vtta-dndbeyond")?.active ||
    game.modules.get("vtta-ddb")?.active ||
    game.modules.get("token-hud-art-button")?.active;

  if (funcExists) return;

  // mark all images
  $(html)
    .find('div[data-edit="content"] img, div[data-edit="content"] video')
    .each((index, element) => {
      const showPlayersButton = $("<a class='ddbimporter-show-image'><i class='fas fa-eye'></i>&nbsp;Show Players</a>");
      const toChatButton = $("<a class='ddbimporter-to-chat'><i class='fas fa-eye'></i>&nbsp;To Chat</a>");

      $(element).wrap("<div class='ddbimporter-image-container'></div>");
      // show the button on mouseenter of the image
      $(element)
        .parent()
        .mouseenter(function addHover() {
          // eslint-disable-next-line no-invalid-this
          $(this).append(showPlayersButton);
          $(showPlayersButton).click((event) => {
            event.preventDefault();
            event.stopPropagation();
            const popOut = new ImagePopout($(element).attr("src"), { shareable: true });
            popOut.shareImage();
          });
          // eslint-disable-next-line no-invalid-this
          $(this).append(toChatButton);
          $(toChatButton).click((event) => {
            event.preventDefault();
            event.stopPropagation();
            imageToChat($(element).attr("src"));
          });
        });
      $(element)
        .parent()
        .mouseleave(function removeHover() {
          // eslint-disable-next-line no-invalid-this
          $(this).find("a").remove();
        });
    });
}
