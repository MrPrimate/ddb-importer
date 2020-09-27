export default function (html) {
  $(html)
    .find("ol.directory-list > li.directory-item.folder")
    .each((index, element) => {
      let folderId = $(element).attr("data-folder-id");
      let folder = game.folders.get(folderId);
      const labelText =
        folder.data.flags &&
        folder.data.flags.ddbimporter &&
        folder.data.flags.ddbimporter.dndbeyond &&
        folder.data.flags.ddbimporter.dndbeyond.sourcebook
          ? folder.data.flags.ddbimporter.dndbeyond.sourcebook
          : null;
      if (labelText) {
        const label = $(`<span class="ddbimporter-folder-label">${labelText.toUpperCase()}</span>`);
        $(label).on("click", () => {
          const data = {
            senderId: game.user.data._id,
            action: "labelClick",
            label: labelText,
          };
          game.socket.emit("module.ddb-importer", data);
        });

        $(element).find("> header").prepend(label);
      }
    });

  $(html)
    .find("ol.directory-list li.directory-item.folder")
    .each((index, element) => {
      let folderId = $(element).attr("data-folder-id");
      let folder = game.folders.get(folderId);
      const label =
        folder.data.flags &&
        folder.data.flags.ddbimporter &&
        folder.data.flags.ddbimporter.dndbeyond &&
        folder.data.flags.ddbimporter.dndbeyond.sourcebook
          ? folder.data.flags.ddbimporter.dndbeyond.sourcebook
          : null;
      if (label) {
        $(element).attr("data-type", "ddbimporter-folder");
      }
    });
}
