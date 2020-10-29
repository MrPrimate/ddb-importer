// Main module class
export default class SpellMuncher extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer";
    options.template = "modules/ddb-importer/src/spell/munch_ui.html";
    options.classes.push("ddb-importer");
    options.resizable = false;
    options.height = "auto";
    options.width = 400;
    options.minimizable = true;
    options.title = "MrPrimate's Spell Muncher";
    return options;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".munch-spells").click(async () => {
      let updateBool = html.find("[name=updateButton]").is(":checked");
      SpellMuncher.parseSpell(updateBool);
    });
    this.close();
  }

  static async parseSpell(updateBool) {
    console.log(`munching spells! Updating? ${updateBool}`); // eslint-disable-line no-console
  }
}
