import SpellMuncher from "../../muncher/spells.js";

export default function (app, html) {
  $(html);
  if (app.options.id == "items") {
    let button = $("<button class='spell-muncher'><i class='fas fa-file-import'></i> Spell Muncher</button>");

    button.click(() => {
      new SpellMuncher().render(true);
    });

    $(html).find(".directory-footer").append(button);
  }
}
