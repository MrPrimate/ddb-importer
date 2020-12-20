import DDBMuncher from "../../muncher/ddb.js";

export function addMuncher (app, html) {
  if (app.options.id == "compendium" && game.user.isGM) {
    let button = $("<button class='ddb-muncher'><i class='fas fa-file-import'></i> DDB Muncher</button>");

    button.click(() => {
      new DDBMuncher().render(true);
    });

    $(html).find(".directory-footer").append(button);
  }
}
