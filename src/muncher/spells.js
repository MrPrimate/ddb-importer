// Main module class

export default class SpellMuncher extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer";
    options.template = "modules/ddb-importer/src/muncher/spells_munch_ui.html";
    options.classes.push("ddb-importer");
    options.resizable = false;
    options.height = "auto";
    options.width = 400;
    options.minimizable = true;
    options.title = "MrPrimate's Spell Muncher";
    return options;
  }

  static getSpellData(className) {
    const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
    const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
    const body = { cobalt: cobaltCookie };
    // const body = {};
    return new Promise((resolve, reject) => {
      fetch(`${parsingApi}/getClassSpells/${className}`, {
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

    const results = await Promise.allSettled([
      SpellMuncher.getSpellData("Cleric"),
      SpellMuncher.getSpellData("Druid"),
      SpellMuncher.getSpellData("Sorcerer"),
      SpellMuncher.getSpellData("Warlock"),
      SpellMuncher.getSpellData("Wizard"),
      SpellMuncher.getSpellData("Paladin"),
      SpellMuncher.getSpellData("Ranger"),
    ]);

    const spells = results.map((r) => r.value.data).flat().flat();
    const uniqueSpells = spells.filter((v, i, a) => a.findIndex((t) => (t.name === v.name)) === i);

    console.log(uniqueSpells);
  }
}
