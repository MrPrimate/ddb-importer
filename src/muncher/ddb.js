// Main module class
import logger from "../logger.js";
import { parseItems } from "./items.js";
import { parseSpells } from "./spells.js";
import { parseCritters } from "./monsters.js";
import { parseRaces } from "./races.js";
import { parseFeats } from "./feats.js";
import { parseClasses } from "./classes.js";
import { parseFrames } from "./frames.js";
import { getPatreonTiers, munchNote } from "./utils.js";
import { DDB_CONFIG } from "../ddbConfig.js";
import { getCobalt } from "../lib/Secrets.js";
import { downloadAdventureConfig } from "./adventure.js";
import AdventureMunch from "./adventure/adventure.js";
import ThirdPartyMunch from "./adventure/thirdParty.js";
import { updateMuncherSettings, getMuncherSettings } from "./settings.js";
import { migrateExistingCompendium } from "./compendiumFolders.js";


export function getSourcesLookups(selected) {
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

  activateListeners(html) {
    super.activateListeners(html);

    html.find("#toggle-sources").click(async (event) => {
      event.preventDefault();
      if ($('.munching-sources input:checked').length && $('.munching-sources input').not(':checked').length) {
        $('.munching-sources input').prop('checked', false);
      } else {
        $('.munching-sources input').each(function() {
          // eslint-disable-next-line no-invalid-this
          $(this).prop('checked', !$(this).prop('checked'));
        });
      }
    });
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    const existingSelection = game.settings.get("ddb-importer", "munching-policy-monster-sources").flat();
    const sources = getSourcesLookups(existingSelection);

    return {
      sources: sources.sort((a, b) => {
        return (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0);
      }),
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
    options.width = 800;
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
      new DDBSources().render(true);
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
    html.find("#munch-feats-start").click(async () => {
      munchNote(`Downloading feats...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.parseFeats();
    });
    html.find("#munch-classes-start").click(async () => {
      munchNote(`Downloading classes...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.parseClasses();
    });
    html.find("#munch-frames-start").click(async () => {
      munchNote(`Downloading frames...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.parseFrames();
    });
    html.find("#munch-adventure-config-start").click(async () => {
      munchNote(`Generating config file...`, true);
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
      munchNote(`Migrating monster compendium...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.migrateCompendiumFolders("monsters");
    });
    html.find("#munch-migrate-compendium-spell").click(async () => {
      munchNote(`Migrating spell compendium...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.migrateCompendiumFolders("spells");
    });
    html.find("#munch-migrate-compendium-item").click(async () => {
      munchNote(`Migrating item compendium...`, true);
      $('button[id^="munch-"]').prop('disabled', true);
      DDBMuncher.migrateCompendiumFolders("items");
    });

    // watch the change of the import-policy-selector checkboxes
    $(html)
    .find(
      [
        '.munching-generic-config input[type="checkbox"]',
        '.munching-spell-config input[type="checkbox"]',
        '.munching-item-config input[type="checkbox"]',
        '.munching-monster-config input[type="checkbox"]',
      ].join(",")
    )
    .on("change", (event) => {
      updateMuncherSettings(html, event);
    });


    html.find("#monster-munch-filter").on("keyup", (event) => {
      event.preventDefault();
      if (event.key !== "Enter") return; // Use `.key` instead.
      DDBMuncher.startMunch();
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
    const tier = game.settings.get("ddb-importer", "patreon-tier");
    const tiers = getPatreonTiers(tier);

    if (cobalt) {
      $('button[id^="munch-spells-start"]').prop('disabled', false);
      $('button[id^="munch-items-start"]').prop('disabled', false);
      $('button[id^="munch-adventure-config-start"]').prop('disabled', false);
      $('button[id^="munch-adventure-import-start"]').prop('disabled', false);
      $('button[id^="munch-migrate-compendium-monster"]').prop('disabled', false);
      $('button[id^="munch-migrate-compendium-spell"]').prop('disabled', false);
      $('button[id^="munch-migrate-compendium-item"]').prop('disabled', false);

      if (tiers.all) {
        $('button[id^="munch-monsters-start"]').prop('disabled', false);
      }
      if (tiers.supporter) {
        $('button[id^="munch-races-start"]').prop('disabled', false);
        $('button[id^="munch-feats-start"]').prop('disabled', false);
        $('button[id^="munch-source-select"]').prop('disabled', false);
        $('button[id^="munch-frames-start"]').prop('disabled', false);
      }
      if (tiers.experimentalMid) {
        $('button[id^="munch-classes-start"]').prop('disabled', false);
      }
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
      await parseSpells();
      munchNote(`Finished importing spells!`, true);
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
      await parseItems();
      munchNote(`Finished importing items!`, true);
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

  static async parseFrames() {
    try {
      logger.info("Munching frames!");
      const result = await parseFrames();
      munchNote(`Finished importing ${result.length} frames!`, true);
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
      await downloadAdventureConfig();
      munchNote(`Downloading config file`, true);
      munchNote("");
      DDBMuncher.enableButtons();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  static async migrateCompendiumFolders(type) {
    logger.info(`Migrating ${type} compendium`);
    await migrateExistingCompendium(type);
    munchNote(`Migrating complete.`, true);
    DDBMuncher.enableButtons();
  }

  getData() { // eslint-disable-line class-methods-use-this
    const resultData = getMuncherSettings();

    // console.warn(resultData);

    return resultData;
  }
}
