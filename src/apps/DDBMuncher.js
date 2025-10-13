/* eslint-disable require-atomic-updates */
import {
  logger,
  PatreonHelper,
  MuncherSettings,
  Secrets,
  DDBCompendiumFolders,
  DDBSources,
  DDBCampaigns,
  utils,
} from "../lib/_module.mjs";
import { parseItems } from "../muncher/items.js";
import { parseSpells } from "../muncher/spells.js";
import DDBFrameImporter from "../muncher/DDBFrameImporter.js";
import { downloadAdventureConfig } from "../muncher/adventure.js";
import AdventureMunch from "../muncher/adventure/AdventureMunch.js";
import ThirdPartyMunch from "../muncher/adventure/ThirdPartyMunch.js";
import { updateWorldMonsters, resetCompendiumActorImages } from "../muncher/tools.js";
import { parseTransports } from "../muncher/vehicles.js";
import DDBMonsterFactory from "../parser/DDBMonsterFactory.js";
import { updateItemPrices } from "../muncher/prices.js";
import DDBAppV2 from "./DDBAppV2.js";
import DDBEncounterFactory from "../parser/DDBEncounterFactory.js";
import DDBDebugger from "./DDBDebugger.mjs";
import { SETTINGS } from "../config/_module.mjs";
import DDBMuleHandler from "../muncher/DDBMuleHandler.mjs";
import DDBCharacter from "../parser/DDBCharacter.js";


export default class DDBMuncher extends DDBAppV2 {

  constructor() {
    super();
    this.encounterFactory = new DDBEncounterFactory({
      notifier: this.notifier.bind(this),
    });
    this.encounterId = null;
    this.encounter = null;
    this.searchTermMonster = "";
    this.searchTermItem = "";
    this.searchTermSpell = "";
    this.muleURL = "";
    this.characterId = null;
  }


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
      importEncounter: DDBMuncher.importEncounter,
      openDebug: DDBMuncher.openDebug,
      regenerateStorage: DDBMuncher.regenerateStorage,
      parseFeats: DDBMuncher.parseFeats,
      parseBackgrounds: DDBMuncher.parseBackgrounds,
      parseClasses: DDBMuncher.parseClasses,
      parseSpecies: DDBMuncher.parseSpecies,
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
        "modules/ddb-importer/handlebars/muncher/munch/encounters.hbs",
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
          encounters: {
            id: "encounters", group: "munch", label: "Encounters", icon: "fas fa-dungeon",
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

    this.element.querySelector("#monster-munch-filter")?.addEventListener("change", async (event) => {
      this.searchTermMonster = event.target.value ?? "";
    });

    this.element.querySelector("#item-munch-filter")?.addEventListener("change", async (event) => {
      this.searchTermItem = event.target.value ?? "";
    });

    this.element.querySelector("#spell-munch-filter")?.addEventListener("change", async (event) => {
      this.searchTermSpell = event.target.value ?? "";
    });

    this.element.querySelectorAll("[id^='munching-selection-compendium-folders-'")?.forEach((folder) => {
      folder.addEventListener("change", async (event) => {
        await game.settings.set(SETTINGS.MODULE_ID, folder.id, event.target.value);
      });
    });

    this.element.querySelector("#encounter-campaign-select")?.addEventListener("change", async (event) => {
      if (!context.tiers.supporter) return;
      const campaignId = event.target._value ?? undefined;
      const encounters = await this.encounterFactory.filterEncounters(campaignId);
      const campaignSelected = campaignId && campaignId !== "";
      let encounterList = `<option value=""></option>`;
      encounters.forEach((encounter) => {
        encounterList += `<option value="${encounter.id}">${encounter.name}${
          campaignSelected || !encounter.campaign ? "" : ` (${encounter.campaign.name})`
        }</option>\n`;
      });
      const list = this.element.querySelector("#encounter-select");
      list.innerHTML = encounterList;
      this.resetEncounter();
    });

    this.element.querySelector("#encounter-select")?.addEventListener("change", async (event) => {
      this.encounterId = event.target.value ?? undefined;
      await this.render();
    });

    // watch the change of the muncher-policy-selector checkboxes
    this.element.querySelectorAll("fieldset :is(dnd5e-checkbox)").forEach((checkbox) => {
      checkbox.addEventListener('change', async (event) => {
        await MuncherSettings.updateMuncherSettings(this.element, event);
        await this.render();
      });
    });

    this.element.querySelector("input[name=muncher-character-url]").addEventListener('input', async (event) => {
      await this.#handleURLUpdate(event);
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

  async _prepareEncounterContext(context) {
    context.encounter = {
      id: null,
      data: {},
    };
    if (!context.tiers.supporter) {
      return foundry.utils.mergeObject(context, {
        availableCampaigns: [],
        availableEncounters: [],
      });
    }

    context.availableCampaigns = await DDBCampaigns.getAvailableCampaigns();
    context.availableEncounters = await this.encounterFactory.filterEncounters();
    if (!this.encounterId) return context;
    this.encounter = await this.encounterFactory.parseEncounter(this.encounterId);
    if (!this.encounter) return context;

    context.availableEncounters = context.availableEncounters.map((encounter) => {
      encounter.selected = encounter.id === this.encounterId;
      return encounter;
    });

    const missingCharacters = this.encounter.missingCharacters
      ? `fa-times-circle' style='color: red`
      : `fa-check-circle' style='color: green`;
    const missingMonsters = this.encounter.missingMonsters
      ? `fa-times-circle' style='color: red`
      : `fa-check-circle' style='color: green`;

    const goodCharacters = this.encounter.goodCharacterData.map((character) => `${character.name}`).join(", ");
    const goodMonsters = this.encounter.goodMonsterIds.map((monster) => `${monster.name}`).join(", ");
    const neededCharactersHTML = this.encounter.missingCharacters
      ? ` <span style="color: red"> Missing ${
        this.encounter.missingCharacterData.length
      }: ${this.encounter.missingCharacterData.map((character) => character.name).join(", ")}</span>`
      : "";
    const neededMonstersHTML = this.encounter.missingMonsters
      ? ` <span style="color: red"> Missing ${
        this.encounter.missingMonsterIds.length
      }. DDB Id's: ${this.encounter.missingMonsterIds.map((monster) => monster.ddbId).join(", ")}</span>`
      : "";

    context.encounter.nameHtml = `<i class='fas fa-check-circle' style='color: green'></i> <b>Encounter:</b> ${this.encounter.name}`;
    if (this.encounter.summary && this.encounter.summary.trim() !== "") {
      context.encounter.summaryHtml = `<i class='fas fa-check-circle' style='color: green'></i> <b>Summary:</b> ${this.encounter.summary}`;
    }
    if (this.encounter.goodCharacterData.length > 0 || this.encounter.missingCharacterData.length > 0) {
      context.encounter.charactersHtml = `<i class='fas ${missingCharacters}'></i> <b>Characters:</b> ${goodCharacters}${neededCharactersHTML}`;
    }
    if (this.encounter.goodMonsterIds.length > 0 || this.encounter.missingMonsterIds.length > 0) {
      context.encounter.monstersHtml = `<i class='fas ${missingMonsters}'></i> <b>Monsters:</b> ${goodMonsters}${neededMonstersHTML}`;
    }
    context.encounter.difficultyHtml = `<i class='fas fa-check-circle' style='color: green'></i> <b>Difficulty:</b> <span style="color: ${this.encounter.difficulty.color}">${this.encounter.difficulty.name}</span>`;
    if (this.encounter.rewards && this.encounter.rewards.trim() !== "") {
      context.encounter.rewardsHtml = `<i class='fas fa-check-circle' style='color: green'></i> <b>Rewards:</b> ${this.encounter.rewards}`;
    }

    context.encounter.progressHtml = this.encounter.inProgress
      ? `<i class='fas fa-times-circle' style='color: red'></i> <b>In Progress:</b> <span style="color: red"> Encounter in progress on <a href="https://www.dndbeyond.com/combat-tracker/${this.encounterId}">D&D Beyond!</a></span>`
      : `<i class='fas fa-check-circle' style='color: green'></i> <b>In Progress:</b> No`;

    context.encounter.id = this.encounterId;
    context.encounter.data = this.encounter;

    return context;
  }

  async _prepareContext(options) {
    let context = MuncherSettings.getMuncherSettings();
    context = foundry.utils.mergeObject(context, MuncherSettings.getCharacterImportSettings());
    context = foundry.utils.mergeObject(context, MuncherSettings.getEncounterSettings());
    context = await this._prepareEncounterContext(context);

    if (this.encounter) {
      context.encounterConfig = context.encounterConfig.map((setting) => {
        if (setting.name === "encounter-import-policy-use-ddb-save") setting.enabled = this.encounter.inProgress;
        return setting;
      });
    }
    context = foundry.utils.mergeObject(await super._prepareContext(options), context, { inplace: false });
    context.searchTermMonster = this.searchTermMonster;
    context.searchTermItem = this.searchTermItem;
    context.searchTermSpell = this.searchTermSpell;
    context.muleURL = this.muleURL;
    context.characterId = this.characterId;
    context.useCharacterHomebrew = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-character-fetch-homebrew");
    logger.debug("Muncher: _prepareContext", context);
    return context;
  }

  /** @override */
  // eslint-disable-next-line class-methods-use-this
  async _preparePartContext(partId, context) {
    // console.warn("Muncher: _preparePartContext", partId, context);
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
    const progressElement = this.element.querySelector(".ddb-overlay");
    if (progressElement) progressElement.classList.remove("munching-invalid");
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
      buttonSelectors.push('button[id^="munch-encounter-start"]');
    }
    if (tiers.supporter) {
      buttonSelectors.push('button[id^="munch-frames-start"]');
      // buttonSelectors.push('button[id^="munch-species-start"]');
      buttonSelectors.push('button[id^="munch-feats-start"]');
      buttonSelectors.push('button[id^="munch-classes-start"]');
      buttonSelectors.push('button[id^="munch-backgrounds-start"]');
    }
    if (tiers.experimentalMid) {
      buttonSelectors.push('button[id^="munch-vehicles-start"]');
    }

    buttonSelectors.forEach((selector) => {
      const buttons = this.element.querySelectorAll(selector);
      buttons.forEach((button) => {
        button.disabled = false;
      });
    });

    const progressElement = this.element.querySelector(".ddb-overlay");
    if (progressElement) progressElement.classList.add("munching-invalid");
  }

  static async parseMonsters(_event, _target) {
    try {
      logger.info("Munching monsters!");
      this._disableButtons();
      const monsterFactory = new DDBMonsterFactory({
        notifier: this.notifier.bind(this),
      });
      const result = await monsterFactory.processIntoCompendium(null, this.searchTermMonster);
      this.notifier(`Finished importing ${result} monsters!`, { nameField: true });
      this.notifier("");
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
      this.notifier(`Finished importing ${result} vehicles!`, { nameField: true });
      this.notifier("");
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
      await parseSpells({
        notifier: this.notifier.bind(this),
        searchFilter: this.searchTermSpell,
      });
      this.notifier(`Finished importing spells!`, { nameField: true });
      this.notifier("");
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
      await parseItems({
        notifier: this.notifier.bind(this),
        searchFilter: this.searchTermItem,
      });
      this.notifier(`Finished importing items!`, { nameField: true });
      this.notifier("");
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
      const result = await DDBFrameImporter.parseFrames();
      this.notifier(`Finished importing ${result.length} frames!`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }


  async _parseClassesWithMule() {
    this.autoRotateMessage("class");
    const baseOptions = {
      characterId: this.characterId,
      homebrew: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-character-fetch-homebrew"),
      type: "class",
      ddbMuncher: this,
    };
    const sourceIdArrays = DDBSources.getChosenCategoriesAndBooks();

    try {
      for (const sourceIdArray of sourceIdArrays) {
        const category = CONFIG.DDB.sourceCategories.find((c) => c.id === sourceIdArray.categoryId);
        const options = foundry.utils.deepClone(baseOptions);
        options.sources = sourceIdArray.sourceIds;

        const classList = await DDBMuleHandler.getList("class", options.sources);

        for (const klass of classList) {
          this.autoRotateMessage("class", klass.name.toLowerCase());
          logger.info(`Munching class ${klass.name} (${klass.id}) in ${category?.name ?? sourceIdArray.categoryId}`);
          options.classId = klass.id;
          const muleHandler = new DDBMuleHandler(options);
          this.notifierV2({
            section: "name",
            message: `Munching for ${klass.name} from ${sourceIdArray.sourceIds.length} sources in ${category?.name ?? sourceIdArray.categoryId}...`,
          });
          await muleHandler.process();

          logger.debug(`Munch Complete for class ${klass.name} in ${category?.name ?? sourceIdArray.categoryId}`, {
            muleHandler,
            sources: sourceIdArray,
            options: foundry.utils.deepClone(options),
          });
        }
      }
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
      this.notifier(`Error during munching: ${error.message}`, { nameField: true });
    } finally {
      this.stopAutoRotateMessage();
    }
  }

  async _parseSpeciesWithMule() {
    this.notifierV2({
      section: "name",
      message: `Munching species is not yet supported via the Mule. Please use the DDB Importer Character Importer instead.`,
    });
  }

  async _parseWithMule(type) {
    this.autoRotateMessage(type);
    const baseOptions = {
      characterId: this.characterId,
      homebrew: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-character-fetch-homebrew"),
      type,
      ddbMuncher: this,
    };
    const sourceIdArrays = DDBSources.getChosenCategoriesAndBooks();

    try {
      for (const sourceIdArray of sourceIdArrays) {
        const category = CONFIG.DDB.sourceCategories.find((c) => c.id === sourceIdArray.categoryId);
        const options = foundry.utils.deepClone(baseOptions);
        options.sources = sourceIdArray.sourceIds;
        const muleHandler = new DDBMuleHandler(options);
        this.notifierV2({
          section: "name",
          message: `Munching from ${sourceIdArray.sourceIds.length} sources in ${category?.name ?? sourceIdArray.categoryId}...`,
        });
        await muleHandler.process();

        logger.debug(`Munch Complete for ${type} in ${category?.name ?? sourceIdArray.categoryId}`, {
          muleHandler,
          sources: sourceIdArray,
          options: foundry.utils.deepClone(options),
        });
      }
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
      this.notifier(`Error during munching: ${error.message}`, { nameField: true });
    } finally {
      this.stopAutoRotateMessage();
    }
  }

  static async parseFeats(_event, _target) {
    if (!this.characterId) {
      ui.notifications.error("You must enter a valid D&D Beyond character URL to import feats.");
      return;
    }
    try {
      logger.info("Munching feats!");
      this._disableButtons();
      await this._parseWithMule("feat");
      this.notifier(`Finished importing feats!`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async parseBackgrounds(_event, _target) {
    if (!this.characterId) {
      ui.notifications.error("You must enter a valid D&D Beyond character URL to import backgrounds.");
      return;
    }
    try {
      logger.info("Munching backgrounds!");
      this._disableButtons();
      await this._parseWithMule("background");
      this.notifier(`Finished importing backgrounds!`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async parseClasses(_event, _target) {
    if (!this.characterId) {
      ui.notifications.error("You must enter a valid D&D Beyond character URL to import classes.");
      return;
    }
    try {
      logger.info("Munching classes!");
      this._disableButtons();
      await this._parseClassesWithMule();
      this.notifier(`Finished importing classes!`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async parseSpecies(_event, _target) {
    if (!this.characterId) {
      ui.notifications.error("You must enter a valid D&D Beyond character URL to import species.");
      return;
    }
    try {
      logger.info("Munching species!");
      this._disableButtons();
      await this._parseSpeciesWithMule();
      this.notifier(`Finished importing species!`, { nameField: true });
      this.notifier("");
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
      this.notifier(`Downloading config file`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    }
  }

  static async importAdventure(_event, _target) {
    const progressElement = this.element.querySelector(".import-progress");
    try {
      logger.info("Generating adventure config!");
      this._disableButtons();
      if (progressElement) progressElement.classList.remove("muncher-hidden");

      const adventureMuncher = new AdventureMunch({
        importFile: this.element.querySelector(`#munch-adventure-file`).files[0],
        notifierElement: this.element,
      });

      await adventureMuncher.importAdventure();

    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      if (progressElement) progressElement.classList.add("muncher-hidden");
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
      this.notifier(`Begin migration.... this might take some considerable time, please wait...`, { nameField: true });
      await DDBCompendiumFolders.migrateExistingCompendium(type);
      this.notifier(`Migrating complete.`, true);
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
      this.notifier(notifyString, { nameField: true });
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
      this.notifier(notifyString, { nameField: true });
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  resetEncounter() {
    const nameHtml = this.element.querySelector("#ddb-encounter-name");
    const summaryHtml = this.element.querySelector("#ddb-encounter-summary");
    const charactersHtml = this.element.querySelector("#ddb-encounter-characters");
    const monstersHtml = this.element.querySelector("#ddb-encounter-monsters");
    const difficultyHtml = this.element.querySelector("#ddb-encounter-difficulty");
    const rewardsHtml = this.element.querySelector("#ddb-encounter-rewards");
    const progressHtml = this.element.querySelector("#ddb-encounter-progress");

    nameHtml.innerHTML = `<p id="ddb-encounter-name"><i class='fas fa-question'></i> <b>Encounter:</b></p>`;
    summaryHtml.innerHTML = `<p id="ddb-encounter-summary"><i class='fas fa-question'></i> <b>Summary:</b></p>`;
    charactersHtml.innerHTML = `<p id="ddb-encounter-characters"><i class='fas fa-question'></i> <b>Characters:</b></p>`;
    monstersHtml.innerHTML = `<p id="ddb-encounter-monsters"><i class='fas fa-question'></i> <b>Monsters:</b></p>`;
    difficultyHtml.innerHTML = `<p id="ddb-encounter-difficulty"><i class='fas fa-question'></i> <b>Difficulty:</b></p>`;
    rewardsHtml.innerHTML = `<p id="ddb-encounter-rewards"><i class='fas fa-question'></i> <b>Rewards:</b></p>`;
    progressHtml.innerHTML = `<p id="ddb-encounter-progress"><i class='fas fa-question'></i> <b>In Progress:</b></p>`;

    const importButton = this.element.querySelector("#encounter-button");
    importButton.disabled = true;
    importButton.innerText = "Import Encounter";

    // $("#ddb-importer-encounters").css("height", "auto");
    this.element.querySelector("#encounter-import-policy-use-ddb-save").disabled = true;

    this.encounterFactory.resetEncounters();
  }

  static async importEncounter(_event, _target) {

    const img = this.element.querySelector("#encounter-scene-img-select").value;
    const sceneId = this.element.querySelector("#encounter-scene-select").value;
    const id = this.element.querySelector("#encounter-select").value;

    // console.warn("Munching encounter!", {
    //   encounterFactory: this.encounterFactory,
    //   event: _event,
    //   target: _target,
    //   img,
    //   sceneId,
    //   id,
    // });

    try {
      logger.info("Preparing for encounter munch.");
      this._disableButtons();
      await this.encounterFactory.importEncounter(id, { img, sceneId });
      const campaignFluff = this.encounterFactory.data.campaign?.name && this.encounterFactory.data.campaign.name.trim() !== ""
        ? ` of ${this.encounterFactory.data.name}`
        : "";
      ui.notifications.warn(`Prepare to battle heroes${campaignFluff}, your doom awaits in ${this.encounterFactory.data.name}!`);

      this.notifier("Encounter munched!", { nameField: true });
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }

  }

  static openDebug(_event, _target) {
    new DDBDebugger({ actor: this.actor }).render(true);
  }

  static async regenerateStorage(_event, _target) {
    await DDBImporter.createStorage();
  }

  async #handleURLUpdate(event) {
    let URL = event.currentTarget.value;
    const characterId = DDBCharacter.getCharacterId(URL);
    this.muleURL = URL;
    this.characterId = characterId;

    const status = this.element.querySelector(".ddb-muncher .dndbeyond-url-status i");

    if (URL === "") {
      status.classList.remove("fa-exclamation-triangle");
      status.classList.remove("fa-check-circle");
      status.classList.remove("fas");
      status.style.color = "";
    } else if (characterId) {
      status.classList.add("fas");
      status.classList.remove("fa-exclamation-triangle");
      status.classList.add("fa-check-circle");
      status.style.color = "green";
    } else {
      this.showCurrentTask("URL format incorrect", { message: "That seems not to be the URL we expected...", isError: true });
      status.classList.add("fa-exclamation-triangle");
      status.classList.remove("fa-check-circle");
      status.style.color = "red";
    }
  }

}

