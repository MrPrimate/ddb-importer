import DDBMuncher from "../../muncher/ddb.js";

export function addMuncher (app, html) {
  $(html);
  if (app.options.id == "compendium") {
    let button = $("<button class='ddb-muncher'><i class='fas fa-file-import'></i> DDB Muncher</button>");

    button.click(() => {
      new DDBMuncher().render(true);
    });

    $(html).find(".directory-footer").append(button);
  }
}
