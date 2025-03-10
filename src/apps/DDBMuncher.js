import {
  logger,
  PatreonHelper,
  MuncherSettings,
  Secrets,
  DDBCompendiumFolders,
  utils,
  DDBSources,
} from "../lib/_module.mjs";
import { parseItems } from "../muncher/items.js";
import { parseSpells } from "../muncher/spells.js";
import { parseFrames } from "../muncher/frames.js";
import { downloadAdventureConfig } from "../muncher/adventure.js";
import AdventureMunch from "../muncher/adventure/AdventureMunch.js";
import ThirdPartyMunch from "../muncher/adventure/ThirdPartyMunch.js";
import { updateWorldMonsters, resetCompendiumActorImages } from "../muncher/tools.js";
import { parseTransports } from "../muncher/vehicles.js";
import DDBMonsterFactory from "../parser/DDBMonsterFactory.js";
import { updateItemPrices } from "../muncher/prices.js";
import DDBAppV2 from "./DDBAppV2.js";


export default class DDBMuncher extends DDBAppV2 {


  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    id: "ddb-importer-monsters",
    classes: ["sheet", "standard-form", "dnd5e2"],
    actions: {
      parseSpells: DDBMuncher.parseSpells,
      parseItems: DDBMuncher.parseItems,
      parseMonsters: DDBMuncher.parseMonsters,
      parseVehicles: DDBMuncher.parseVehicles,
      parseFrames: DDBMuncher.parseFrames,
      resetCompendiumActorImages: DDBMuncher.resetCompendiumActorImages,
      generateAdventureConfig: DDBMuncher.generateAdventureConfig,
      importAdventure: DDBMuncher.importAdventure,
      importThirdParty: DDBMuncher.importThirdParty,
      updateWorldActors: DDBMuncher.updateWorldMonsters,
      migrateCompendiumMonster: DDBMuncher.migrateCompendiumFolders,
      migrateCompendiumSpell: DDBMuncher.migrateCompendiumFolders,
      migrateCompendiumItem: DDBMuncher.migrateCompendiumFolders,
      setPricesXanathar: DDBMuncher.addItemPrices,
    },
    position: {
      width: "800",
      height: "auto",
    },
    window: {
      icon: 'fab fa-d-and-d-beyond',
      title: "MrPrimate's DDB Muncher",
      resizable: true,
      minimizable: true,
      subtitle: "",
    },
  };

  static PARTS = {
    header: { template: "modules/ddb-importer/handlebars/muncher/header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    info: {
      template: "modules/ddb-importer/handlebars/muncher/info.hbs",
      templates: [
        "modules/ddb-importer/handlebars/muncher/info/intro.hbs",
        "modules/ddb-importer/handlebars/muncher/info/help.hbs",
      ],
    },
    settings: {
      template: "modules/ddb-importer/handlebars/muncher/settings.hbs",
      templates: [
        "modules/ddb-importer/handlebars/muncher/settings/general.hbs",
        "modules/ddb-importer/handlebars/muncher/settings/sources.hbs",
      ],
    },
    munch: {
      template: "modules/ddb-importer/handlebars/muncher/munch.hbs",
      templates: [
        "modules/ddb-importer/handlebars/generic/tab-navigation.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/spells.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/items.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/monsters.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/monsters/main.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/monsters/settings.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/monsters/art.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/adventures.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/characters.hbs",
      ],
    },
    tools: {
      template: "modules/ddb-importer/handlebars/muncher/tools.hbs",
      templates: [
        "modules/ddb-importer/handlebars/muncher/tools/tools.hbs",
        "modules/ddb-importer/handlebars/muncher/tools/compendiums.hbs",
      ],
    },
    details: { template: "modules/ddb-importer/handlebars/muncher/details.hbs" },
    footer: { template: "modules/ddb-importer/handlebars/muncher/footer.hbs" },
  };

  /** @override */
  tabGroups = {
    sheet: "info",
    info: "intro",
    settings: "general",
    munch: "spells",
    tools: "tools",
    monsters: "monsterMain",
  };

  /** @override */
  _getTabs() {
    const tabs = this._markTabs({
      info: {
        id: "info", group: "sheet", label: "Info", icon: "fas fa-info",
        tabs: {
          intro: {
            id: "intro", group: "info", label: "Intro", icon: "fas fa-info",
          },
          help: {
            id: "help", group: "info", label: "Help", icon: "fas fa-question",
          },
        },
      },
      settings: {
        id: "settings", group: "sheet", label: "Settings", icon: "fas fa-cogs",
        tabs: {
          general: {
            id: "general", group: "settings", label: "General", icon: "fas fa-cog",
          },
          sources: {
            id: "sources", group: "settings", label: "Sources", icon: "fas fa-book",
          },
        },
      },
      munch: {
        id: "munch", group: "sheet", label: "Munch", icon: "fas fa-utensils",
        tabs: {
          spells: {
            id: "spells", group: "munch", label: "Spells", icon: "fas fa-magic",
          },
          items: {
            id: "items", group: "munch", label: "Items", icon: "fas fa-shield-alt",
          },
          monsters: {
            id: "monsters", group: "munch", label: "Monsters", icon: "fas fa-pastafarianism",
            tabs: {
              main: {
                id: "monsterMain", group: "monsters", label: "Monster Munch", icon: "fas fa-dragon",
              },
              settings: {
                id: "monsterSettings", group: "monsters", label: "Monster Configuration", icon: "fas fa-dungeon",
              },
              art: {
                id: "monsterArt", group: "monsters", label: "Monster Art", icon: "fas fa-image",
              },
            },
          },
          adventures: {
            id: "adventures", group: "munch", label: "Adventures", icon: "fas fa-book-reader",
          },
          characters: {
            id: "characters", group: "munch", label: "Characters", icon: "fas fa-users ",
          },
        },
      },
      tools: {
        id: "tools", group: "sheet", label: "Tools", icon: "fas fa-tools",
        tabs: {
          tools: {
            id: "tools", group: "tools", label: "Tools", icon: "fas fa-border-all",
          },
          compendiums: {
            id: "compendiums", group: "tools", label: "Compendiums", icon: "fas fa-atlas",
          },
        },
      },
    });
    return tabs;
  }


  _toggleNestedTabs() {
    const munch = this.element.querySelector('.munch-munch > [data-application-part="muncherTabs"]');
    const munchActive = this.element.querySelector('.tab.active[data-group="munch"]');
    if (munch && munchActive) {
      const monstersActive = this.element.querySelector('.tab.active[data-tab="monsters"]');
      munch.classList.toggle("nested-tabs", monstersActive ?? false);
    }
    super._toggleNestedTabs();
  }

  /* -------------------------------------------- */
  /*  Life-Cycle Handlers                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  _onRender(context, options) {
    super._onRender(context, options);

    // custom listeners
    // multi-selects
    this.element.querySelector("#muncher-excluded-source-categories")?.addEventListener("change", async (event) => {
      await DDBSources.updateExcludedCategories(Array.from(event.target._value));
    });

    this.element.querySelector("#muncher-source-select")?.addEventListener("change", async (event) => {
      await DDBSources.updateSelectedSources(Array.from(event.target._value));
    });

    this.element.querySelector("#muncher-monster-types-select")?.addEventListener("change", async (event) => {
      await DDBSources.updateSelectedMonsterTypes(Array.from(event.target._value));
    });

    // watch the change of the muncher-policy-selector checkboxes
    this.element.querySelectorAll("fieldset :is(dnd5e-checkbox)").forEach((checkbox) => {
      checkbox.addEventListener('change', async (event) => {
        await MuncherSettings.updateMuncherSettings(this.element, event);
        await this.render();
      });
    });

  }


  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritDoc */
  changeTab(tab, group, options) {
    super.changeTab(tab, group, options);
    if (["munch"].includes(group)) {
      this._toggleNestedTabs();
    }
  }

  async _prepareContext(options) {
    let context = MuncherSettings.getMuncherSettings();
    context = foundry.utils.mergeObject(await super._prepareContext(options), context, { inplace: false });
    logger.debug("Muncher: _prepareContext", context);
    return context;
  }

  /** @override */
  // eslint-disable-next-line class-methods-use-this
  async _preparePartContext(partId, context) {
    switch (partId) {
      case "info":
      case "settings":
      case "munch":
      case "tools": {
        context.tab = context.tabs[partId];
        break;
      }
      // no default
    };
    return context;
  }


  /**
   * Display information when Munching
   * @param {*} note
   * @param {*} nameField
   * @param {*} monsterNote
   */
  static munchNote(note, nameField = false, monsterNote = false) {
    utils.munchNote(note, nameField, monsterNote);
  }

  _disableButtons() {
    const buttonSelectors = [
      'button[id^="adventure-config-start"]',
      'button[id^="munch-"]',
    ];
    buttonSelectors.forEach((selector) => {
      const buttons = this.element.querySelectorAll(selector);
      buttons.forEach((button) => {
        button.disabled = true;
      });
    });
  }

  _enableButtons() {
    const cobalt = Secrets.getCobalt() != "";
    if (!cobalt) return;
    const tier = PatreonHelper.getPatreonTier();
    const tiers = PatreonHelper.calculateAccessMatrix(tier);

    const buttonSelectors = [
      'button[id^="adventure-config-start"]',
      'button[id^="munch-spells-start"]',
      'button[id^="munch-items-start"]',
      'button[id^="munch-adventure-config-start"]',
      'button[id^="munch-adventure-import-start"]',
      'button[id^="munch-adventure-third-party-start"]',
      'button[id^="munch-migrate-compendium-monster"]',
      'button[id^="munch-migrate-compendium-spell"]',
      'button[id^="munch-migrate-compendium-item"]',
      'button[id^="munch-reset-images"]',
      'button[id^="munch-xanathar-price"]',
    ];

    if (tiers.all) {
      buttonSelectors.push('button[id^="munch-monsters-start"]');
      buttonSelectors.push('button[id^="munch-source-select"]');
    }
    if (tiers.supporter) {
      buttonSelectors.push('button[id^="munch-frames-start"]');
      // $('button[id^="munch-races-start"]').prop('disabled', false);
      // $('button[id^="munch-feats-start"]').prop('disabled', false);
      // $('button[id^="munch-classes-start"]').prop('disabled', false);
      // $('button[id^="munch-backgrounds-start"]').prop('disabled', false);
    }
    if (tiers.experimentalMid) {
      // buttonSelectors.push('button[id^="munch-vehicles-start"]');
    }

    buttonSelectors.forEach((selector) => {
      const buttons = this.element.querySelectorAll(selector);
      buttons.forEach((button) => {
        button.disabled = false;
      });
    });
  }

  static async parseMonsters(_event, _target) {
    try {
      logger.info("Munching monsters!");
      this._disableButtons();
      const monsterFactory = new DDBMonsterFactory({ notifier: DDBMuncher.munchNote });
      const result = await monsterFactory.processIntoCompendium();
      DDBMuncher.munchNote(`Finished importing ${result} monsters!`, true);
      DDBMuncher.munchNote("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async parseVehicles(_event, _target) {
    try {
      logger.info("Munching vehicles!");
      this._disableButtons();
      const result = await parseTransports();
      DDBMuncher.munchNote(`Finished importing ${result} vehicles!`, true);
      DDBMuncher.munchNote("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async parseSpells(_event, _target) {
    try {
      logger.info("Munching spells!");
      this._disableButtons();
      await parseSpells({ notifier: DDBMuncher.munchNote });
      DDBMuncher.munchNote(`Finished importing spells!`, true);
      DDBMuncher.munchNote("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }


  static async parseItems(_event, _target) {
    try {
      logger.info("Munching items!");
      this._disableButtons();
      await parseItems({ notifier: DDBMuncher.munchNote });
      DDBMuncher.munchNote(`Finished importing items!`, true);
      DDBMuncher.munchNote("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }


  static async parseFrames(_event, _target) {
    try {
      logger.info("Munching frames!");
      this._disableButtons();
      const result = await parseFrames();
      DDBMuncher.munchNote(`Finished importing ${result.length} frames!`, true);
      DDBMuncher.munchNote("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async generateAdventureConfig(_event, _target) {
    try {
      logger.info("Generating adventure config!");
      await downloadAdventureConfig();
      DDBMuncher.munchNote(`Downloading config file`, true);
      DDBMuncher.munchNote("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  static async importAdventure(_event, _target) {
    try {
      logger.info("Generating adventure config!");
      this._disableButtons();
      $(".import-progress").toggleClass("import-hidden");
      $(".ddb-overlay").toggleClass("import-invalid");

      const adventureMuncher = new AdventureMunch({
        importFile: this.element.querySelector(`#munch-adventure-file`).files[0],
        notifierElement: this.element,
      });

      await adventureMuncher.importAdventure();

    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      $(".ddb-overlay").toggleClass("import-invalid");
      this._enableButtons();
    }
  }

  static async importThirdParty(_event, _target) {
    new ThirdPartyMunch().render(true);
  }

  static async updateWorldMonsters(_event, _target) {
    try {
      logger.info("Updating world monsters!");
      this._disableButtons();
      await updateWorldMonsters();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async migrateCompendiumFolders(event, target) {
    let type = null;
    switch (target.id) {
      case "munch-migrate-compendium-monster":
        type = "monster";
        break;
      case "munch-migrate-compendium-spell":
        type = "spell";
        break;
      case "munch-migrate-compendium-item":
        type = "item";
        break;
      // no default
    }
    if (!type) return;
    try {
      logger.info(`Migrating ${type} compendium`);
      this._disableButtons();
      DDBMuncher.munchNote(`Begin migration.... this might take some considerable time, please wait...`, true);
      await DDBCompendiumFolders.migrateExistingCompendium(type);
      DDBMuncher.munchNote(`Migrating complete.`, true);
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async resetCompendiumActorImages(_event, _target) {
    try {
      logger.info("Resetting compendium actor images");
      this._disableButtons();
      const results = await resetCompendiumActorImages();
      const notifyString = `Reset ${results.length} compendium actors.`;
      DDBMuncher.munchNote(notifyString, true);
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async addItemPrices(_event, _target) {
    try {
      logger.info("Checking to see if items need prices...");
      this._disableButtons();
      const results = await updateItemPrices();
      const notifyString = `Added ${results.length} prices to items.`;
      DDBMuncher.munchNote(notifyString, true);
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

}

