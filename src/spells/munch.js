// Main module class
const PARSING_API = "https://beta.ddb.mrprimate.co.uk";

export default class SpellMuncher extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer";
    options.template = "modules/ddb-importer/src/spells/munch_ui.html";
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
    const body = { cobalt: cobaltCookie };
    // const body = {};
    return new Promise((resolve, reject) => {
      fetch(`${PARSING_API}/getClassSpells/${className}`, {
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
    // const clericSpells = SpellMuncher.getSpellData("Cleric");
    // const druidSpells = SpellMuncher.getSpellData("Druid");
    // const warlockSpells = SpellMuncher.getSpellData("Warlock");
    // const wizardSpells = SpellMuncher.getSpellData("Wizard");
    // const paladinSpells = SpellMuncher.getSpellData("Paladin");
    // const rangerSpells = SpellMuncher.getSpellData("Ranger");
    // console.log(clericSpells);
    // console.log(druidSpells);
    // console.log(warlockSpells);
    // console.log(wizardSpells);

    const results = await Promise.allSettled([
      SpellMuncher.getSpellData("Cleric"),
      SpellMuncher.getSpellData("Druid"),
      SpellMuncher.getSpellData("Warlock"),
      SpellMuncher.getSpellData("Wizard"),
      SpellMuncher.getSpellData("Paladin"),
      SpellMuncher.getSpellData("Ranger"),
    ]);

    //const spells = results.flat().map((r) => r.data)
    // to do need to get data out of each one

    console.log(results.flat());

  }
}
