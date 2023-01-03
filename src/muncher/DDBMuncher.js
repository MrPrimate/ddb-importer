// Main module class
import logger from "../logger.js";
import PatreonHelper from "../lib/PatreonHelper.js";
import { parseItems } from "./items.js";
import { parseSpells } from "./spells.js";
import { parseRaces } from "./races.js";
import { parseFeats } from "./feats.js";
import { parseClasses } from "./classes.js";
import { parseFrames } from "./frames.js";
import { getCobalt } from "../lib/Secrets.js";
import { base64Check } from "../lib/base64Check.js";
import { downloadAdventureConfig } from "./adventure.js";
import AdventureMunch from "./adventure/AdventureMunch.js";
import ThirdPartyMunch from "./adventure/ThirdPartyMunch.js";
import MuncherSettings from "./MuncherSettings.js";
import { migrateExistingCompendium } from "./compendiumFolders.js";
import { createGMMacros } from "../effects/macros.js";
import { importCacheLoad } from "../lib/DDBTemplateStrings.js";
import { updateWorldMonsters, resetCompendiumActorImages } from "./tools.js";
import { parseBackgrounds } from "./backgrounds.js";
import { parseTransports } from "./vehicles.js";
import DDBSources from "../lib/DDBSources.js";
import SETTINGS from "../settings.js";
import DDBMonsterFactory from "./DDBMonsterFactory.js";

export default class DDBMuncher extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-monsters";
    options.template = "modules/ddb-importer/handlebars/munch.hbs";
    options.resizable = false;
    options.height = "auto";
    options.width = 800;
    options.title = "MrPrimate's Muncher";
    options.classes = ["ddb-muncher", "sheet"];
    options.tabs = [{ navSelector: ".tabs", contentSelector: "div", initial: "settings" }];
    return options;
  }

  /**
   * Display information when Munching
   * @param {*} note
   * @param {*} nameField
   * @param {*} monsterNote
   */
  static munchNote(note, nameField = false, monsterNote = false) {
    if (nameField) {
      $("#munching-task-name").text(note);
      $("#ddb-importer-monsters").css("height", "auto");
    } else if (monsterNote) {
      $("#munching-task-monster").text(note);
      $("#ddb-importer-monsters").css("height", "auto");
    } else {
      $("#munching-task-notes").text(note);
      $("#ddb-importer-monsters").css("height", "auto");
    }
  }

  static munchMonsters() {
    DDBMuncher.munchNote(`Downloading monsters...`, true);
    $('button[id^="munch-"]').prop('disabled', true);
    $('button[id^="adventure-config-start"]').prop('disabled', true);
    DDBMuncher.parseCritters();
  }

  static munchVehicles() {
    DDBMuncher.munchNote(`Downloading vehicles...`, true);
    $('button[id^="munch-"]').prop('disabled', true);
    $('button[id^="adventure-config-start"]').prop('disabled', true);
    DDBMuncher.parseTransports();
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("#munch-monsters-start").click(async () => {
      DDBMuncher.munchMonsters();
    });
    html.find("#munch-vehicles-start").click(async () => {
      DDBMuncher.munchVehicles();
    });
    html.find("#munch-source-select").click(async () => {
      new DDBSources().render(true);
    });

    html.find("#munch-spells-start").click(async () => {
      DDBMuncher.munchNote(`Downloading spells...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.parseSpells();
    });
    html.find("#munch-items-start").click(async () => {
      DDBMuncher.munchNote(`Downloading items...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.parseItems();
    });
    html.find("#munch-races-start").click(async () => {
      DDBMuncher.munchNote(`Downloading races...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.parseRaces();
    });
    html.find("#munch-feats-start").click(async () => {
      DDBMuncher.munchNote(`Downloading feats...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.parseFeats();
    });
    html.find("#munch-backgrounds-start").click(async () => {
      DDBMuncher.munchNote(`Downloading backgrounds...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.parseBackgrounds();
    });
    html.find("#munch-classes-start").click(async () => {
      DDBMuncher.munchNote(`Downloading classes...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.parseClasses();
    });
    html.find("#munch-frames-start").click(async () => {
      DDBMuncher.munchNote(`Downloading frames...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.parseFrames();
    });
    html.find("#munch-adventure-config-start").click(async () => {
      DDBMuncher.munchNote(`Generating config file...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.generateAdventureConfig();
    });
    html.find("#munch-adventure-import-start").click(async () => {
      new AdventureMunch().render(true);
    });
    html.find("#munch-adventure-third-party-start").click(async () => {
      new ThirdPartyMunch().render(true);
    });
    html.find("#munch-migrate-compendium-monster").click(async () => {
      DDBMuncher.munchNote(`Migrating monster compendium...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.migrateCompendiumFolders("monsters");
    });
    html.find("#munch-migrate-compendium-spell").click(async () => {
      DDBMuncher.munchNote(`Migrating spell compendium...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.migrateCompendiumFolders("spells");
    });
    html.find("#munch-migrate-compendium-item").click(async () => {
      DDBMuncher.munchNote(`Migrating item compendium...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.migrateCompendiumFolders("items");
    });
    html.find("#munch-fix-base64").click(async () => {
      DDBMuncher.munchNote(`Checking Scenes for base64 data...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.base64Check();
    });
    html.find("#munch-world-monster-update").click(async () => {
      DDBMuncher.munchNote(`Updating world actors...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.updateWorldMonsters();
    });
    html.find("#munch-reset-images").click(async () => {
      DDBMuncher.munchNote(`Resetting images...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.resetCompendiumActorImages();
    });

    // watch the change of the import-policy-selector checkboxes
    $(html)
      .find(
        [
          '.munching-generic-config input[type="checkbox"]',
          '.munching-spell-config input[type="checkbox"]',
          '.munching-item-config input[type="checkbox"]',
          '.munching-monster-config input[type="checkbox"]',
          '.munching-monster-world-update-config input[type="checkbox"]',
        ].join(",")
      )
      .on("change", (event) => {
        MuncherSettings.updateMuncherSettings(html, event, this);
      });


    html.find("#monster-munch-filter").on("keyup", (event) => {
      event.preventDefault();
      if (event.key !== "Enter") return; // Use `.key` instead.
      DDBMuncher.munchMonsters();
    });

    // compendium style migrations
    html.find("#compendium-folder-style-monster").on("change", async () => {
      const style = html.find("#compendium-folder-style-monster");
      const importStyle = style[0].selectedOptions[0] ? style[0].selectedOptions[0].value : "TYPE";
      game.settings.set("ddb-importer", "munching-selection-compendium-folders-monster", importStyle);
    });
    html.find("#compendium-folder-style-spell").on("change", async () => {
      const style = html.find("#compendium-folder-style-spell");
      const importStyle = style[0].selectedOptions[0] ? style[0].selectedOptions[0].value : "SCHOOL";
      game.settings.set("ddb-importer", "munching-selection-compendium-folders-spell", importStyle);
    });
    html.find("#compendium-folder-style-item").on("change", async () => {
      const style = html.find("#compendium-folder-style-item");
      const importStyle = style[0].selectedOptions[0] ? style[0].selectedOptions[0].value : "TYPE";
      game.settings.set("ddb-importer", "munching-selection-compendium-folders-item", importStyle);
    });

    this.close();
  }

  static enableButtons() {
    const cobalt = getCobalt() != "";
    const tier = game.settings.get(SETTINGS.MODULE_ID, "patreon-tier");
    const tiers = PatreonHelper.getPatreonTiers(tier);

    if (cobalt) {
      $('button[id^="munch-spells-start"]').prop('disabled', false);
      $('button[id^="munch-items-start"]').prop('disabled', false);
      $('button[id^="munch-adventure-config-start"]').prop('disabled', false);
      $('button[id^="munch-adventure-import-start"]').prop('disabled', false);
      $('button[id^="munch-adventure-third-party-start"]').prop('disabled', false);
      $('button[id^="munch-migrate-compendium-monster"]').prop('disabled', false);
      $('button[id^="munch-migrate-compendium-spell"]').prop('disabled', false);
      $('button[id^="munch-migrate-compendium-item"]').prop('disabled', false);
      $('button[id^="munch-fix-base64"]').prop('disabled', false);
      $('button[id^="munch-reset-images"]').prop('disabled', false);

      if (tiers.all) {
        $('button[id^="munch-monsters-start"]').prop('disabled', false);
        $('button[id^="munch-source-select"]').prop('disabled', false);
      }
      if (tiers.supporter) {
        $('button[id^="munch-races-start"]').prop('disabled', false);
        $('button[id^="munch-feats-start"]').prop('disabled', false);
        $('button[id^="munch-frames-start"]').prop('disabled', false);
        $('button[id^="munch-classes-start"]').prop('disabled', false);
        $('button[id^="munch-backgrounds-start"]').prop('disabled', false);
      }
      if (tiers.experimentalMid) {
        $('button[id^="munch-vehicles-start"]').prop('disabled', false);
      }
    }
  }

  static async parseCritters() {
    try {
      logger.info("Munching monsters!");
      const monsterFactory = new DDBMonsterFactory();
      const result = await monsterFactory.processIntoCompendium();
      DDBMuncher.munchNote(`Finished importing ${result} monsters!`, true);
      DDBMuncher.munchNote("");
      DDBMuncher.enableButtons();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  static async parseTransports() {
    try {
      logger.info("Munching vehicles!");
      const result = await parseTransports();
      DDBMuncher.munchNote(`Finished importing ${result} vehicles!`, true);
      DDBMuncher.munchNote("");
      DDBMuncher.enableButtons();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  static async parseSpells() {
    try {
      logger.info("Munching spells!");
      if (game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-spell-effects")) await createGMMacros("spells");
      await parseSpells();
      DDBMuncher.munchNote(`Finished importing spells!`, true);
      DDBMuncher.munchNote("");
      DDBMuncher.enableButtons();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  static async parseItems() {
    try {
      logger.info("Munching items!");
      await parseItems();
      DDBMuncher.munchNote(`Finished importing items!`, true);
      DDBMuncher.munchNote("");
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
      DDBMuncher.munchNote(`Finished importing ${result.length} races and features!`, true);
      DDBMuncher.munchNote("");
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
      DDBMuncher.munchNote(`Finished importing ${result.length} feats!`, true);
      DDBMuncher.munchNote("");
      DDBMuncher.enableButtons();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  static async parseBackgrounds() {
    try {
      logger.info("Munching backgrounds!");
      const result = await parseBackgrounds();
      DDBMuncher.munchNote(`Finished importing ${result.length} backgrounds!`, true);
      DDBMuncher.munchNote("");
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
      DDBMuncher.munchNote(`Finished importing ${result.length} classes and features!`, true);
      DDBMuncher.munchNote("");
      DDBMuncher.enableButtons();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  static async parseFrames() {
    try {
      logger.info("Munching frames!");
      const result = await parseFrames();
      DDBMuncher.munchNote(`Finished importing ${result.length} frames!`, true);
      DDBMuncher.munchNote("");
      DDBMuncher.enableButtons();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  static async generateAdventureConfig() {
    try {
      logger.info("Generating adventure config!");
      await downloadAdventureConfig();
      DDBMuncher.munchNote(`Downloading config file`, true);
      DDBMuncher.munchNote("");
      DDBMuncher.enableButtons();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  static async updateWorldMonsters() {
    try {
      logger.info("Updating world monsters!");
      await updateWorldMonsters();
      DDBMuncher.enableButtons();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  static async migrateCompendiumFolders(type) {
    logger.info(`Migrating ${type} compendium`);
    await migrateExistingCompendium(type);
    DDBMuncher.munchNote(`Migrating complete.`, true);
    DDBMuncher.enableButtons();
  }

  static async base64Check() {
    logger.info("Checking base64 in scenes");
    const results = base64Check();
    let notifyString = `Check complete.`;
    if (results.fixedScenes.length === 0 && results.badScenes.length === 0) {
      notifyString += " No problems found.";
    } else {
      if (results.fixedScenes.length > 0) notifyString += ` Fixing ${results.fixedScenes.length} scenes (wait untill uploads complete).`;
      if (results.badScenes.length > 0) notifyString += ` Found ${results.badScenes.length} scenes that I couldn't fix.`;
    }
    DDBMuncher.munchNote(notifyString, true);
    DDBMuncher.enableButtons();
  }

  static async resetCompendiumActorImages() {
    logger.info("Resetting compendium actor images");
    const results = await resetCompendiumActorImages();
    const notifyString = `Reset ${results.length} compendium actors.`;
    DDBMuncher.munchNote(notifyString, true);
    DDBMuncher.enableButtons();
  }

  async getData() { // eslint-disable-line class-methods-use-this
    const resultData = MuncherSettings.getMuncherSettings();
    await importCacheLoad();
    return resultData;
  }
}
