// Main module class
import logger from "../logger.js";
import utils from "../utils.js";
import { parseItems } from "./items.js";
import { parseSpells } from "./spells.js";
import { parseCritters } from "./monsters.js";
import { parseRaces } from "./races.js";
import { parseClasses } from "./classes.js";
import { getPatreonTiers, munchNote } from "./utils.js";


export default class DDBMuncher extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-monsters";
    options.template = "modules/ddb-importer/handlebars/munch.handlebars";
    options.classes.push("ddb-muncher");
    options.resizable = false;
    options.height = "auto";
    options.width = 550;
    options.minimizable = true;
    options.title = "MrPrimate's Muncher";
    return options;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("#munch-monsters-start").click(async () => {
      munchNote(`Downloading monsters...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.parseCritters();
    });
    html.find("#munch-spells-start").click(async () => {
      munchNote(`Downloading spells...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.parseSpells();
    });
    html.find("#munch-items-start").click(async () => {
      munchNote(`Downloading items...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.parseItems();
    });
    html.find("#munch-races-start").click(async () => {
      munchNote(`Downloading races...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.parseRaces();
    });
    html.find("#munch-classes-start").click(async () => {
      munchNote(`Downloading classes...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.parseClasses();
    });

    // watch the change of the import-policy-selector checkboxes
    html.find('.munching-generic-config input[type="checkbox"]').on("change", (event) => {
      const selection = event.currentTarget.dataset.section;
      const checked = event.currentTarget.checked;
      game.settings.set("ddb-importer", "munching-policy-" + selection, checked);
      if (selection == "remote-images" && checked) {
        game.settings.set("ddb-importer", "munching-policy-download-images", false);
        $('#munching-generic-policy-download-images').prop('checked', false);
      } else if (selection == "download-images" && checked) {
        game.settings.set("ddb-importer", "munching-policy-remote-images", false);
        $('#munching-generic-policy-remote-images').prop('checked', false);
      }
    });

    html.find('.munching-spell-config input[type="checkbox"]').on("change", (event) => {
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

  static enableButtons() {
    const cobalt = game.settings.get("ddb-importer", "cobalt-cookie") != "";
    const betaKey = game.settings.get("ddb-importer", "beta-key") != "";
    const tier = game.settings.get("ddb-importer", "patreon-tier");

    if (cobalt) {
      $('button[id^="munch-spells-start"]').prop('disabled', false);
      $('button[id^="munch-items-start"]').prop('disabled', false);
    }
    if (cobalt && betaKey) {
      $('button[id^="munch-monsters-start"]').prop('disabled', false);
    }
    if (cobalt && tier === "GOD") {
      $('button[id^="munch-races-start"]').prop('disabled', false);
      $('button[id^="munch-classes-start"]').prop('disabled', false);
    }
  }

  static async parseCritters() {
    try {
      logger.info("Munching monsters!");
      const result = await parseCritters();
      munchNote(`Finished importing ${result} monsters!`, true);
      munchNote("");
      DDBMuncher.enableButtons();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }

  }

  static async parseSpells() {
    try {
      logger.info("Munching spells!");
      const result = await parseSpells();
      munchNote(`Finished importing ${result.length} spells!`, true);
      munchNote("");
      DDBMuncher.enableButtons();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  static async parseItems() {
    try {
      logger.info("Munching items!");
      const result = await parseItems();
      munchNote(`Finished importing ${result.length} items!`, true);
      munchNote("");
      DDBMuncher.enableButtons();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  static async parseRaces() {
    try {
      logger.info("Munching races!");
      const result = await parseRaces();
      munchNote(`Finished importing ${result.length} races and features!`, true);
      munchNote("");
      DDBMuncher.enableButtons();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  static async parseClasses() {
    try {
      logger.info("Munching classes!");
      const result = await parseClasses();
      munchNote(`Finished importing ${result.length} classes and features!`, true);
      munchNote("");
      DDBMuncher.enableButtons();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }


  getData() { // eslint-disable-line class-methods-use-this
    const cobalt = game.settings.get("ddb-importer", "cobalt-cookie") != "";
    const betaKey = game.settings.get("ddb-importer", "beta-key") != "";
    const iconizerInstalled = utils.isModuleInstalledAndActive("vtta-iconizer");
    const tier = game.settings.get("ddb-importer", "patreon-tier");
    const tiers = getPatreonTiers(tier);
    const daeInstalled = utils.isModuleInstalledAndActive("dae") && utils.isModuleInstalledAndActive("Dynamic-Effects-SRD");

    const itemConfig = [
      {
        name: "use-ddb-item-icons",
        isChecked: game.settings.get("ddb-importer", "munching-policy-use-ddb-item-icons"),
        description: "Use D&D Beyond item images, if available",
        enabled: true,
      },
      {
        name: "use-ddb-generic-item-icons",
        isChecked: game.settings.get("ddb-importer", "munching-policy-use-ddb-generic-item-icons"),
        description: "Use D&D Beyond generic item type images, if available (final fallback)",
        enabled: true,
      },
    ];

    const spellConfig = [
      {
        name: "use-ddb-spell-icons",
        isChecked: game.settings.get("ddb-importer", "munching-policy-use-ddb-spell-icons"),
        description: "If no other icon, use the D&DBeyond spell school icon.",
        enabled: true,
      },
    ];

    const monsterConfig = [
      {
        name: "hide-description",
        isChecked: game.settings.get("ddb-importer", "munching-policy-hide-description"),
        description: "Hide description from players?",
        enabled: true,
      },
      {
        name: "monster-items",
        isChecked: game.settings.get("ddb-importer", "munching-policy-monster-items"),
        description: "[Experimental] Load items from DDB compendium instead of parsing action/attack?",
        enabled: true,
      },
      {
        name: "update-images",
        isChecked: game.settings.get("ddb-importer", "munching-policy-update-images"),
        description: "Update Monster images on existing items?",
        enabled: true,
      },
      {
        name: "dae-copy",
        isChecked: game.settings.get("ddb-importer", "munching-policy-dae-copy"),
        description: "Use Dynamic Active Effects Compendiums for matching items/features (requires DAE and SRD module).",
        enabled: daeInstalled,
      },
      {
        name: "monster-homebrew",
        isChecked: game.settings.get("ddb-importer", "munching-policy-monster-homebrew"),
        description: (tiers.homebrew) ? "Include homebrew?" : "Include homebrew? [Undying or God tier patreon supporters]",
        enabled: tiers.homebrew,
      },
    ];

    const genericConfig = [
      {
        name: "update-existing",
        isChecked: game.settings.get("ddb-importer", "munching-policy-update-existing"),
        description: "Update existing things.",
        enabled: true,
      },
      {
        name: "use-srd",
        isChecked: game.settings.get("ddb-importer", "munching-policy-use-srd"),
        description: "Use SRD compendium things instead of importing.",
        enabled: true,
      },
      {
        name: "use-srd-icons",
        isChecked: game.settings.get("ddb-importer", "munching-policy-use-srd-icons"),
        description: "Use icons from the SRD compendiums.",
        enabled: true,
      },
      {
        name: "use-iconizer",
        isChecked: (iconizerInstalled) ? game.settings.get("ddb-importer", "munching-policy-use-iconizer") : false,
        description: "Use Iconizer (if installed).",
        enabled: iconizerInstalled,
      },
      {
        name: "download-images",
        isChecked: game.settings.get("ddb-importer", "munching-policy-download-images"),
        description: "Download D&D Beyond images (takes longer and needs space).",
        enabled: true,
      },
      {
        name: "remote-images",
        isChecked: game.settings.get("ddb-importer", "munching-policy-remote-images"),
        description: "Use D&D Beyond remote images (a lot quicker)",
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
      genericConfig: genericConfig,
      monsterConfig: monsterConfig,
      spellConfig: spellConfig,
      itemConfig: itemConfig,
      beta: betaKey && cobalt,
      tiers: tiers,
    };
  }
}
