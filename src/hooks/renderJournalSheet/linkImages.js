import utils from "../../lib/utils.js";
import { createAndShowPlayerHandout, imageToChat } from "./shared.js";

export function linkImages(html, data) {
  if (!game.user.isGM) return;
  const displayImages = game.settings.get("ddb-importer", "show-image-to-players");
  // does this functionality exist from anther module?
  const funcExists = !displayImages || game.modules.get("token-hud-art-button")?.active;

  if (funcExists) return;

  // mark all images
  $(html)
    .find('img')
    .each((index, element) => {
      const showPlayersButton = $("<a class='ddbimporter-show-image'><i class='fas fa-eye'></i>&nbsp;Show Players Image</a>");
      const toChatButton = $("<a class='ddbimporter-to-chat'><i class='fas fa-comment'></i>&nbsp;To Chat</a>");

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
            const src = $(element).attr("src");
            Dialog.confirm({
              title: "Would you like to create a handout for the image?",
              content: "<p>Create a player viewable handout? (No will show the image only)</p>",
              yes: async () => {
                const name = await utils.namePrompt("What would you like to call the Handout?");
                if (name && name !== "") {
                  const bookCode = data.flags?.ddb?.bookCode;
                  createAndShowPlayerHandout(name, src, "image", bookCode);
                }
              },
              no: () => {
                const popOut = new ImagePopout(src, { shareable: true });
                popOut.shareImage();
              },
              defaultYes: true
            });
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
          $(this).find("a.ddbimporter-show-image, a.ddbimporter-to-chat").remove();
        });
    });
}
