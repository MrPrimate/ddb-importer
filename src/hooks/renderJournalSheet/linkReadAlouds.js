import utils from "../../lib/utils.js";
import { createAndShowPlayerHandout } from "./shared.js";

export function showReadAlouds(html, data) {
  if (!game.user.isGM) return;
  const displayImages = game.settings.get("ddb-importer", "show-read-alouds-button");
  if (!displayImages) return;

  // mark all read alouds
  $(html)
    .find("aside, blockquote, .read-aloud-text, .read-aloud, .adventure-read-aloud-text, .ddb-blockquote")
    .each((index, element) => {
      const showPlayersJournalButton = $("<a class='ddbimporter-show-image'><i class='fas fa-book-open'></i>&nbsp;Create and Show Handout</a>");
      const toChatButton = $("<a class='ddbimporter-to-chat'><i class='fas fa-comment '></i>&nbsp;To Chat</a>");

      $(element).wrap("<div class='ddbimporter-image-container'></div>");
      // show the button on mouseenter of the image
      $(element)
        .parent()
        .mouseenter(function addHover() {
          // eslint-disable-next-line no-invalid-this
          $(this).append(showPlayersJournalButton);
          $(showPlayersJournalButton).click(async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const name = await utils.namePrompt("What would you like to call the Handout?");
            if (name && name !== "") {
              const bookCode = data.data?.flags?.ddb?.bookCode;
              createAndShowPlayerHandout(name, element.outerHTML, "text", bookCode);
            }
          });
          // eslint-disable-next-line no-invalid-this
          $(this).append(toChatButton);
          $(toChatButton).click((event) => {
            event.preventDefault();
            event.stopPropagation();
            ChatMessage.create({ content: element.outerHTML });
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
