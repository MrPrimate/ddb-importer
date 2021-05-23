import utils from "../../utils.js";

export function linkImages(html) {
  if (!game.user.isGM) return;
  // does this functionality exist from anther module?
  const funcExists = utils.isModuleInstalledAndActive("vtta-dndbeyond") ||
    utils.isModuleInstalledAndActive("vtta-ddb") ||
    utils.isModuleInstalledAndActive("token-hud-art-button");

  if (funcExists) return;

  // mark all images
  $(html)
    .find('div[data-edit="content"] img, div[data-edit="content"] video')
    .each((index, element) => {
      const showPlayersButton = $("<a class='ddbimporter-button'><i class='fas fa-eye'></i>&nbsp;Show Players</a>");

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
            game.socket.emit("module.ddb-importer", {
              sender: game.user.data._id,
              action: "showImage",
              src: $(element).attr("src"),
              type: element.nodeName,
            });
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
