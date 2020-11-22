// Main module class
import logger from "../logger.js";
import { parseItems } from "./items.js";
import { parseSpells } from "./spells.js";
import { parseCritters } from "./monsters.js";
import { munchNote } from "./import.js";

export default class DDBMuncher extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-monsters";
    options.template = "modules/ddb-importer/src/muncher/ddb_munch.handlebars";
    options.classes.push("ddb-muncher");
    options.resizable = false;
    options.height = "auto";
    options.width = 400;
    options.minimizable = true;
    options.title = "MrPrimate's Muncher";
    return options;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("#munch-monsters-start").click(async () => {
      munchNote(`Please be patient downloading monsters!`);
      $('button[id^="munch-"]').prop('disabled', true);
      this.parseCritters();
    });
    html.find("#munch-spells-start").click(async () => {
      munchNote(`Please be patient downloading spells!`);
      $('button[id^="munch-"]').prop('disabled', true);
      this.parseSpells();
    });
    html.find("#munch-items-start").click(async () => {
      munchNote(`Please be patient downloading items!`);
      $('button[id^="munch-"]').prop('disabled', true);
      this.parseItems();
    });

    // watch the change of the import-policy-selector checkboxes
    html.find('.munching-import-config input[type="checkbox"]').on("change", (event) => {
      game.settings.set(
        "ddb-importer",
        "munching-policy-" + event.currentTarget.dataset.section,
        event.currentTarget.checked
      );
    });
    this.close();
  }


  async parseCritters() {
    try {
      logger.info("Munching monsters!");
      await parseCritters();
      this.close();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }

  }

  async parseSpells() {
    try {
      logger.info("Munching spells!");
      await parseSpells();
      this.close();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  async parseItems() {
    try {
      logger.info("Munching items!");
      await parseItems();
      this.close();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  getData() { // eslint-disable-line class-methods-use-this
    const cobalt = game.settings.get("ddb-importer", "cobalt-cookie") != "";
    const betaKey = game.settings.get("ddb-importer", "beta-key") != "";
    // const daeInstalled = game.modules.get('dae').active && game.modules.get('Dynamic-Effects-SRD').active;

    const importConfig = [
      {
        name: "update-existing",
        isChecked: game.settings.get("ddb-importer", "munching-policy-update-existing"),
        description: "Update existing items.",
        enabled: true,
      },
      {
        name: "use-srd",
        isChecked: game.settings.get("ddb-importer", "munching-policy-use-srd"),
        description: "Copy matching SRD compendium items instead of importing.",
        enabled: true,
      },
      {
        name: "use-srd-icons",
        isChecked: game.settings.get("ddb-importer", "munching-policy-use-srd-icons"),
        description: "Use icons from the SRD compendiums.",
        enabled: true,
      },
      {
        name: "download-monster-images",
        isChecked: game.settings.get("ddb-importer", "munching-policy-download-monster-images"),
        description: "Download Monster Images",
        enabled: true,
      },
      // {
      //   name: "dae-copy",
      //   isChecked: game.settings.get("ddb-importer", "munching-policy-dae-copy"),
      //   description: "Copy Dynamic Active Effects (requires DAE and SRD module)",
      //   enabled: daeInstalled,
      // },
    ];
    return {
      cobalt: cobalt,
      importConfig: importConfig,
      beta: betaKey && cobalt,
    };
  }
}
