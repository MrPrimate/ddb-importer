import SpellMuncher from "../../spells/munch.js";

export default function (app, html) {
  $(html);
  if (app.options.id == "items") {
    let button = $("<button class='items-muncher'><i class='fas fa-file-import'></i> Spell Muncher</button>");

    button.click(() => {
      new SpellMuncher().render(true);
    });

    $(html).find(".directory-footer").append(button);
  }
}
