// Main module class
export default class MonsterMuncher extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-mpnsters";
    options.template = "modules/ddb-importer/src/muncher/monster_munch_ui.handlebars";
    options.classes.push("ddb-importer");
    options.resizable = false;
    options.height = "auto";
    options.width = 400;
    options.minimizable = true;
    options.title = "MrPrimate's Monster Muncher";
    return options;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".munch-monster").click(async () => {
      let monsterSearchName = html.find("[name=ddb-import-munch-name]").val();
      let updateBool = html.find("[name=updateButton]").is(":checked");
      MonsterMuncher.parseCritter(monsterSearchName, updateBool);
    });
    this.close();
  }

  static async parseCritter(monsterSearchName, updateBool) {
    // const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
    console.log(`munching monsters! ${monsterSearchName} ${updateBool}`); // eslint-disable-line no-console
  }

  getData() { // eslint-disable-line class-methods-use-this
    const cobalt = game.settings.get("ddb-importer", "cobalt-cookie") != "";
    return {
      cobalt: cobalt,
    };
  }
}
