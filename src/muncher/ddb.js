// Main module class
import logger from "../logger.js";
import utils from "../utils.js";
import { parseItems } from "./items.js";
import { parseSpells } from "./spells.js";
import { parseCritters } from "./monsters.js";
import { parseRaces } from "./races.js";
import { parseFeats } from "./feats.js";
import { parseClasses } from "./classes.js";
import { getPatreonTiers, munchNote } from "./utils.js";
import { DDB_CONFIG } from "../ddb-config.js";
import { getCobalt } from "../lib/Secrets.js";
import { generateAdventureConfig } from "./adventure.js";

function getSourcesLookups(selected) {
  const selections = DDB_CONFIG.sources
  .filter((source) => source.isReleased)
  .map((source) => {
    const details = {
      id: source.id,
      acronym: source.name,
      label: source.description,
      selected: selected.includes(source.id),
    };
    return details;
  });

  return selections;
}

export class DDBSources extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-sources";
    options.template = "modules/ddb-importer/handlebars/sources.hbs";
    options.width = 500;
    return options;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "Monster Muncher Sauce Selection";
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    const existingSelection = game.settings.get("ddb-importer", "munching-policy-monster-sources").flat();
    const sources = getSourcesLookups(existingSelection);

    return {
      sources: sources,
    };
  }

  /** @override */
  // eslint-disable-next-line no-unused-vars
  async _updateObject(event, formData) { // eslint-disable-line class-methods-use-this
    event.preventDefault();
    let sources = [];
    for (const [key, value] of Object.entries(formData)) {
      if (value) sources.push(parseInt(key));
    }
    await game.settings.set("ddb-importer", "munching-policy-monster-sources", sources);
    // eslint-disable-next-line no-use-before-define
    new DDBMuncher().render(true);
  }
}

export default class DDBMuncher extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-monsters";
    options.template = "modules/ddb-importer/handlebars/munch.hbs";
    options.resizable = false;
    options.height = "auto";
    options.width = 600;
    options.title = "MrPrimate's Muncher";
    options.classes = ["ddb-muncher", "sheet"];
    options.tabs = [{ navSelector: ".tabs", contentSelector: "div", initial: "settings" }];
    return options;
  }

  static startMunch() {
    munchNote(`Downloading monsters...`, true);
    $('button[id^="munch-"]').prop('disabled', true);
    $('button[id^="adventure-config-start"]').prop('disabled', true);
    DDBMuncher.parseCritters();
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("#munch-monsters-start").click(async () => {
      DDBMuncher.startMunch();
    });
    html.find("#munch-source-select").click(async () => {
      DDBMuncher.selectSources();
    });

    html.find("#munch-spells-start").click(async () => {
      munchNote(`Downloading spells...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      $('button[id^="adventure-config-start"]').prop('disabled', true);
      DDBMuncher.parseSpells();
    });
    html.find("#munch-items-start").click(async () => {
      munchNote(`Downloading items...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      $('button[id^="adventure-config-start"]').prop('disabled', true);
      DDBMuncher.parseItems();
    });
    html.find("#munch-races-start").click(async () => {
      munchNote(`Downloading races...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      $('button[id^="adventure-config-start"]').prop('disabled', true);
      DDBMuncher.parseRaces();
    });
    html.find("#munch-feats-start").click(async () => {
      munchNote(`Downloading feats...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      $('button[id^="adventure-config-start"]').prop('disabled', true);
      DDBMuncher.parseFeats();
    });
    html.find("#munch-classes-start").click(async () => {
      munchNote(`Downloading classes...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      $('button[id^="adventure-config-start"]').prop('disabled', true);
      DDBMuncher.parseClasses();
    });
    html.find("#adventure-config-start").click(async () => {
      munchNote(`Generating config file...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      $('button[id^="adventure-config-start"]').prop('disabled', true);
      DDBMuncher.generateAdventureConfig();
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

    this.homebrew = html.find("#munching-policy-monster-homebrew");
    this.homebrewOnly = html.find("#munching-policy-monster-homebrew-only");

    html.find('.munching-monster-config input[type="checkbox"]').on("change", (event) => {
      game.settings.set(
        "ddb-importer",
        "munching-policy-" + event.currentTarget.dataset.section,
        event.currentTarget.checked
      );
      switch (event.currentTarget.dataset.section) {
        case "monster-homebrew": {
          if (!event.currentTarget.checked) {
            game.settings.set("ddb-importer", "munching-policy-monster-homebrew-only", false);
            this.homebrewOnly.get(0).checked = false;
          }
          break;
        }
        case "monster-homebrew-only": {
          if (event.currentTarget.checked) {
            game.settings.set("ddb-importer", "munching-policy-monster-homebrew", true);
            this.homebrew.get(0).checked = true;
          }
          break;
        }
        // no default
      }

    });

    html.find('.munching-item-config input[type="checkbox"]').on("change", (event) => {
      game.settings.set(
        "ddb-importer",
        "munching-policy-" + event.currentTarget.dataset.section,
        event.currentTarget.checked
      );
    });

    html.find("#monster-munch-filter").on("keyup", (event) => {
      event.preventDefault();
      if (event.key !== "Enter") return; // Use `.key` instead.
      DDBMuncher.startMunch();
    });

    this.close();
  }

  static enableButtons() {
    const cobalt = getCobalt() != "";
    const betaKey = game.settings.get("ddb-importer", "beta-key") != "";
    const tier = game.settings.get("ddb-importer", "patreon-tier");

    if (cobalt) {
      $('button[id^="munch-spells-start"]').prop('disabled', false);
      $('button[id^="munch-items-start"]').prop('disabled', false);
    }
    if (cobalt && betaKey) {
      $('button[id^="munch-monsters-start"]').prop('disabled', false);
    }
    if (cobalt && (tier === "GOD" || tier === "UNDYING")) {
      $('button[id^="munch-races-start"]').prop('disabled', false);
      $('button[id^="munch-feats-start"]').prop('disabled', false);
      $('button[id^="munch-classes-start"]').prop('disabled', false);
      $('button[id^="munch-source-select"]').prop('disabled', false);
    }
    if (cobalt && (tier === "GOD")) {
      $('button[id^="adventure-config-start"]').prop('disabled', false);
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

  static async parseFeats() {
    try {
      logger.info("Munching feats!");
      const result = await parseFeats();
      munchNote(`Finished importing ${result.length} feats!`, true);
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

  static async generateAdventureConfig() {
    try {
      logger.info("Generating adventure config!");
      await generateAdventureConfig();
      munchNote(`Downloading config file`, true);
      munchNote("");
      DDBMuncher.enableButtons();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  static async selectSources() {
    new DDBSources().render(true);
  }


  getData() { // eslint-disable-line class-methods-use-this
    const cobalt = getCobalt() != "";
    const betaKey = game.settings.get("ddb-importer", "beta-key") != "";
    const iconizerInstalled = utils.isModuleInstalledAndActive("vtta-iconizer");
    const tier = game.settings.get("ddb-importer", "patreon-tier");
    const tiers = getPatreonTiers(tier);
    const daeInstalled = utils.isModuleInstalledAndActive("dae");
    const daeSRDInstall = utils.isModuleInstalledAndActive("Dynamic-Effects-SRD");

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
      {
        name: "add-effects",
        isChecked: game.settings.get("ddb-importer", "munching-policy-add-effects"),
        description: "[Experimental] Dynamically generate DAE effects (equipment only). (Requires DAE)",
        enabled: daeInstalled,
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

    const sourcesSelected = game.settings.get("ddb-importer", "munching-policy-monster-sources").flat().length > 0;
    const homebrewDescription = (tiers.homebrew)
      ? sourcesSelected
        ? "SOURCES SELECTED! You can't import homebrew with a source filter selected"
        : "Include homebrew?"
      : "Include homebrew? [Undying or God tier patreon supporters]";

    const monsterConfig = [
      {
        name: "hide-description",
        isChecked: game.settings.get("ddb-importer", "munching-policy-hide-description"),
        description: "Hide monster action description from players?",
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
        name: "use-full-token-image",
        isChecked: game.settings.get("ddb-importer", "munching-policy-use-full-token-image"),
        description: "Use avatar image for token rather than token image",
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
        isChecked: game.settings.get("ddb-importer", "munching-policy-monster-homebrew") && !sourcesSelected,
        description: homebrewDescription,
        enabled: tiers.homebrew && !sourcesSelected,
      },
      {
        name: "monster-homebrew-only",
        isChecked: game.settings.get("ddb-importer", "munching-policy-monster-homebrew-only") && !sourcesSelected,
        description: "Homebrew monsters only? (Otherwise both)",
        enabled: tiers.homebrew && !sourcesSelected,
      },
      {
        name: "monster-exact-match",
        isChecked: game.settings.get("ddb-importer", "munching-policy-monster-exact-match"),
        description: (tiers.homebrew) ? "Exact name match? (case insensitive)" : "Exact name match? [Undying or God tier patreon supporters]",
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
        name: "use-inbuilt-icons",
        isChecked: game.settings.get("ddb-importer", "munching-policy-use-inbuilt-icons"),
        description: "Use icons from the inbuilt dictionary. (High coverage, recommended, fast).",
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
      {
        name: "use-dae-effects",
        isChecked: game.settings.get("ddb-importer", "munching-policy-use-dae-effects"),
        description: "Copy effects from DAE (items and spells only). (Requires DAE and SRD module)",
        enabled: daeInstalled && daeSRDInstall,
      },
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
