// Main module class
// import { updateCompendium, getSRDCompendiumItems, removeItems } from "./import.js";
import logger from "../logger.js";

export default class MonsterMuncher extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-monsters";
    options.template = "modules/ddb-importer/src/muncher/monster_munch_ui.handlebars";
    options.classes.push("monster-muncher");
    options.resizable = false;
    options.height = "auto";
    options.width = 400;
    options.minimizable = true;
    options.title = "MrPrimate's Monster Muncher";
    return options;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("#munch-monsters-start").click(async () => {
      this.parseSpell();
    });

    // watch the change of the import-policy-selector checkboxes
    html.find('.monsters-import-policy input[type="checkbox"]').on("change", (event) => {
      game.settings.set(
        "ddb-importer",
        "monsters-policy-" + event.currentTarget.dataset.section,
        event.currentTarget.checked
      );
    });
    this.close();
  }

  static getMonsterData() {
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

  async parseCritter() {
    logger.info("Munching monsters!"); // eslint-disable-line no-console
    this.close();
  }

  getData() { // eslint-disable-line class-methods-use-this
    const cobalt = game.settings.get("ddb-importer", "cobalt-cookie") != "";
    const importConfig = [
      {
        name: "update-existing",
        isChecked: game.settings.get("ddb-importer", "monsters-policy-update-existing"),
        description: "Update existing monsters.",
      },
      {
        name: "use-srd",
        isChecked: game.settings.get("ddb-importer", "monsters-policy-use-srd"),
        description: "Copy matching SRD monsters instead of importing.",
      },
      {
        name: "use-srd-icons",
        isChecked: game.settings.get("ddb-importer", "monsters-policy-use-srd-icons"),
        description: "Use icons from the SRD compendium.",
      },
    ];
    return {
      cobalt: cobalt,
      importConfig: importConfig,
    };
  }
}
