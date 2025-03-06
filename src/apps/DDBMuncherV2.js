import {
  logger,
  PatreonHelper,
  MuncherSettings,
  Secrets,
  base64Check,
  DDBCompendiumFolders,
  utils,
  DDBSources,
} from "../lib/_module.mjs";
import { parseItems } from "../muncher/items.js";
import { parseSpells } from "../muncher/spells.js";
import { parseRaces } from "../muncher/races.js";
import { parseFeats } from "../muncher/feats.js";
import { parseClasses } from "../muncher/classes.js";
import { parseFrames } from "../muncher/frames.js";
import { downloadAdventureConfig } from "../muncher/adventure.js";
import AdventureMunch from "../muncher/adventure/AdventureMunch.js";
import ThirdPartyMunch from "../muncher/adventure/ThirdPartyMunch.js";
import { updateWorldMonsters, resetCompendiumActorImages } from "../muncher/tools.js";
import { parseBackgrounds } from "../muncher/backgrounds.js";
import { parseTransports } from "../muncher/vehicles.js";
import DDBMonsterFactory from "../parser/DDBMonsterFactory.js";
import { updateItemPrices } from "../muncher/prices.js";
import { DDBReferenceLinker } from "../parser/lib/_module.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class DDBMuncherV2 extends HandlebarsApplicationMixin(ApplicationV2) {


  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ["sheet", "standard-form", "dnd5e2"],
    actions: {
      parseSpells: DDBMuncherV2.parseSpells,
      // parseItems: DDBMuncherV2.parseItems,
      // parseMonsters: DDBMuncherV2.parseMonsters,
      // parseVehicles: DDBMuncherV2.parseVehicles,
      // parseFrames: DDBMuncherV2.parseFrames,
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
        "modules/ddb-importer/handlebars/muncher/munch/spells.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/items.hbs",
      ],
    },
    footer: { template: "modules/ddb-importer/handlebars/muncher/footer.hbs" },
  };

  /** @override */
  tabGroups = {
    sheet: "info",
    info: "intro",
    settings: "general",
    munch: "spells",
  };

  _markTabs(tabs) {
    for (const v of Object.values(tabs)) {
      v.active = this.tabGroups[v.group] === v.id;
      v.cssClass = v.active ? "active" : "";
      if ("tabs" in v) this._markTabs(v.tabs);
    }
    return tabs;
  }

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
          // monsters: {
          //   id: "monsters", group: "munch", label: "Monsters", icon: "fas fa-pastafarianism",
          // },
          // adventures: {
          //   id: "adventures", group: "munch", label: "Adventures", icon: "fas fa-book-reader",
          // },
          // tools: {
          //   id: "tools", group: "munch", label: "Tools", icon: "fas fa-tools",
          // },
          // characters: {
          //   id: "characters", group: "munch", label: "Characters", icon: "fas fa-users ",
          // },
        },
      },
    });
    return tabs;
  }

  /**
   * Expanded states for additional settings sections.
   * @type {Map<string, boolean>}
   */
  #expandedSections = new Map();

  get expandedSections() {
    return this.#expandedSections;
  }

  #toggleNestedTabs() {
    const primary = this.element.querySelector('.window-content > [data-application-part="tabs"]');
    const active = this.element.querySelector('.tab.active[data-group="sheet"]');
    if (!primary || !active) return;
    primary.classList.toggle("nested-tabs", active.querySelector(":scope > .sheet-tabs"));
  }

  /* -------------------------------------------- */
  /*  Life-Cycle Handlers                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  _onRender(context, options) {
    super._onRender(context, options);
    // Allow multi-select tags to be removed when the whole tag is clicked.
    this.element.querySelectorAll("multi-select").forEach((select) => {
      if (select.disabled) return;
      select.querySelectorAll(".tag").forEach((tag) => {
        tag.classList.add("remove");
        tag.querySelector(":scope > span")?.classList.add("remove");
      });
    });

    // Add special styling for label-top hints.
    this.element.querySelectorAll(".label-top > p.hint").forEach((hint) => {
      const label = hint.parentElement.querySelector(":scope > label");
      if (!label) return;
      hint.ariaLabel = hint.innerText;
      hint.dataset.tooltip = hint.innerHTML;
      hint.innerHTML = "";
      label.insertAdjacentElement("beforeend", hint);
    });
    for (const element of this.element.querySelectorAll("[data-expand-id]")) {
      element.querySelector(".collapsible")?.classList
        .toggle("collapsed", !this.#expandedSections.get(element.dataset.expandId));
    }
    this.#toggleNestedTabs();
  }


  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritDoc */
  changeTab(tab, group, options) {
    super.changeTab(tab, group, options);
    if (group !== "sheet") return;
    this.#toggleNestedTabs();
  }

  async _prepareContext(options) {
    await DDBReferenceLinker.importCacheLoad();
    let context = MuncherSettings.getMuncherSettings();
    context = foundry.utils.mergeObject(await super._prepareContext(options), context, { inplace: false });
    // V12-only:
    context.tabs = this._getTabs();
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

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @inheritDoc */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (options.isFirstRender && this.hasFrame) {
      options.window ||= {};
    }
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _onFirstRender(context, options) {
    super._onFirstRender(context, options);
    const containers = {};
    for (const [part, config] of Object.entries(this.constructor.PARTS)) {
      if (!config.container?.id) continue;
      const element = this.element.querySelector(`[data-application-part="${part}"]`);
      if (!element) continue;
      if (!containers[config.container.id]) {
        const div = document.createElement("div");
        div.dataset.containerId = config.container.id;
        div.classList.add(...config.container.classes ?? []);
        containers[config.container.id] = div;
        element.replaceWith(div);
      }
      containers[config.container.id].append(element);
    }
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

  // static munchMonsters() {
  //   DDBMuncherV2.munchNote(`Downloading monsters...`, true);
  //   $('button[id^="munch-"]').prop('disabled', true);
  //   $('button[id^="adventure-config-start"]').prop('disabled', true);
  //   DDBMuncherV2.parseCritters();
  // }

  // static munchVehicles() {
  //   DDBMuncherV2.munchNote(`Downloading vehicles...`, true);
  //   $('button[id^="munch-"]').prop('disabled', true);
  //   $('button[id^="adventure-config-start"]').prop('disabled', true);
  //   DDBMuncherV2.parseTransports();
  // }


  // static async parseCritters() {
  //   try {
  //     logger.info("Munching monsters!");
  //     const monsterFactory = new DDBMonsterFactory({ notifier: DDBMuncherV2.munchNote });
  //     const result = await monsterFactory.processIntoCompendium();
  //     DDBMuncherV2.munchNote(`Finished importing ${result} monsters!`, true);
  //     DDBMuncherV2.munchNote("");
  //     DDBMuncherV2.enableButtons();
  //   } catch (error) {
  //     logger.error(error);
  //     logger.error(error.stack);
  //   }
  // }

  // static async parseTransports() {
  //   try {
  //     logger.info("Munching vehicles!");
  //     const result = await parseTransports();
  //     DDBMuncherV2.munchNote(`Finished importing ${result} vehicles!`, true);
  //     DDBMuncherV2.munchNote("");
  //     DDBMuncherV2.enableButtons();
  //   } catch (error) {
  //     logger.error(error);
  //     logger.error(error.stack);
  //   }
  // }

  static async parseSpells(event, target) {
    console.warn("parseSpells", {
      event,
      target,
      this: this,
    });
    // try {
    //   logger.info("Munching spells!");
    //   await parseSpells({ notifier: DDBMuncherV2.munchNote });
    //   DDBMuncherV2.munchNote(`Finished importing spells!`, true);
    //   DDBMuncherV2.munchNote("");
    //   DDBMuncherV2.enableButtons();
    // } catch (error) {
    //   logger.error(error);
    //   logger.error(error.stack);
    // }
  }


  // static async parseItems() {
  //   try {
  //     logger.info("Munching items!");
  //     await parseItems({ notifier: DDBMuncherV2.munchNote });
  //     DDBMuncherV2.munchNote(`Finished importing items!`, true);
  //     DDBMuncherV2.munchNote("");
  //     DDBMuncherV2.enableButtons();
  //   } catch (error) {
  //     logger.error(error);
  //     logger.error(error.stack);
  //   }
  // }


  // static async parseFrames() {
  //   try {
  //     logger.info("Munching frames!");
  //     const result = await parseFrames();
  //     DDBMuncherV2.munchNote(`Finished importing ${result.length} frames!`, true);
  //     DDBMuncherV2.munchNote("");
  //     DDBMuncherV2.enableButtons();
  //   } catch (error) {
  //     logger.error(error);
  //     logger.error(error.stack);
  //   }
  // }

  // static async generateAdventureConfig() {
  //   try {
  //     logger.info("Generating adventure config!");
  //     await downloadAdventureConfig();
  //     DDBMuncherV2.munchNote(`Downloading config file`, true);
  //     DDBMuncherV2.munchNote("");
  //     DDBMuncherV2.enableButtons();
  //   } catch (error) {
  //     logger.error(error);
  //     logger.error(error.stack);
  //   }
  // }

  // static async updateWorldMonsters() {
  //   try {
  //     logger.info("Updating world monsters!");
  //     await updateWorldMonsters();
  //     DDBMuncherV2.enableButtons();
  //   } catch (error) {
  //     logger.error(error);
  //     logger.error(error.stack);
  //   }
  // }

  // static async migrateCompendiumFolders(type) {
  //   logger.info(`Migrating ${type} compendium`);
  //   await DDBCompendiumFolders.migrateExistingCompendium(type);
  //   DDBMuncherV2.munchNote(`Migrating complete.`, true);
  //   DDBMuncherV2.enableButtons();
  // }

  // static async resetCompendiumActorImages() {
  //   logger.info("Resetting compendium actor images");
  //   const results = await resetCompendiumActorImages();
  //   const notifyString = `Reset ${results.length} compendium actors.`;
  //   DDBMuncherV2.munchNote(notifyString, true);
  //   DDBMuncherV2.enableButtons();
  // }

  // static async addItemPrices() {
  //   logger.info("Checking to see if items need prices...");
  //   const results = await updateItemPrices();
  //   const notifyString = `Added ${results.length} prices to items.`;
  //   DDBMuncherV2.munchNote(notifyString, true);
  //   DDBMuncherV2.enableButtons();
  // }

}

