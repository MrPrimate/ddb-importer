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

  static getMonsterData(searchTerm) {
    const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
    const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
    const body = { cobalt: cobaltCookie };
    // const body = {};
    return new Promise((resolve, reject) => {
      fetch(`${parsingApi}/getMonsters`, {
      // fetch(`${parsingApi}/getMonsters/${searchTerm}`, {
        method: "POST",
        mode: "cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(body), // body data type must match "Content-Type" header
      })
        .then((response) => response.json())
        .then((data) => resolve(data))
        .catch((error) => reject(error));
    });
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
