import MonsterMuncher from "../../monster/munch.js";

export default function (app, html) {
  $(html);
  if (app.options.id == "compendium") {
    let button = $("<button class='monster-muncher'><i class='fas fa-file-import'></i> Monster Muncher</button>");

    button.click(() => {
      new MonsterMuncher().render(true);
    });

    $(html).find(".directory-footer").append(button);
  }
}
