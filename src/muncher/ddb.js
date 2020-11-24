// Main module class
import logger from "../logger.js";
import utils from "../utils.js";
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
      munchNote(`Please be patient downloading monsters!`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      this.parseCritters();
    });
    html.find("#munch-spells-start").click(async () => {
      munchNote(`Please be patient downloading spells!`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      this.parseSpells();
    });
    html.find("#munch-items-start").click(async () => {
      munchNote(`Please be patient downloading items!`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      this.parseItems();
    });

    // watch the change of the import-policy-selector checkboxes
    html.find('.munching-generic-config input[type="checkbox"]').on("change", (event) => {
      game.settings.set(
        "ddb-importer",
        "munching-policy-" + event.currentTarget.dataset.section,
        event.currentTarget.checked
      );
    });

    html.find('.munching-spell-config input[type="checkbox"]').on("change", (event) => {
      game.settings.set(
        "ddb-importer",
        "munching-policy-" + event.currentTarget.dataset.section,
        event.currentTarget.checked
      );
    });

    html.find('.munching-monster-config input[type="checkbox"]').on("change", (event) => {
      game.settings.set(
        "ddb-importer",
        "munching-policy-" + event.currentTarget.dataset.section,
        event.currentTarget.checked
      );
    });

    html.find('.munching-item-config input[type="checkbox"]').on("change", (event) => {
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
    // const daeInstalled = utils.isModuleInstalledAndActive('dae') && utils.isModuleInstalledAndActive('Dynamic-Effects-SRD');
    const iconizerInstalled = utils.isModuleInstalledAndActive("vtta-iconizer");

    const itemConfig = [];
    const spellConfig = [
      {
        name: "use-ddb-icons",
        isChecked: game.settings.get("ddb-importer", "munching-policy-use-ddb-icons"),
        description: "If no other icon, use the D&DBeyond spell school icon.",
        enabled: true,
      },
    ];

    const monsterConfig = [
      {
        name: "download-monster-images",
        isChecked: game.settings.get("ddb-importer", "munching-policy-download-monster-images"),
        description: "Download Monster Images",
        enabled: true,
      },
    ];

    const genericConfig = [
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
        isChecked: (iconizerInstalled) ? game.settings.get("ddb-importer", "munching-policy-use-srd-icons") : false,
        description: "Use icons from the SRD compendiums.",
        enabled: true,
      },
      {
        name: "use-iconizer",
        isChecked: game.settings.get("ddb-importer", "munching-policy-use-iconizer"),
        description: "If installed use Iconizer.",
        enabled: iconizerInstalled,
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
      genericConfig: genericConfig,
      monsterConfig: monsterConfig,
      spellConfig: spellConfig,
      itemConfig: itemConfig,
      beta: betaKey && cobalt,
    };
  }
}
