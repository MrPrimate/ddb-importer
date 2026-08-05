import {
  logger,
  PatreonHelper,
  MuncherSettings,
  Secrets,
  DDBCompendiumFolders,
  DDBSources,
  DDBCampaigns,
  utils,
} from "../lib/_module";
import { parseSpells } from "../muncher/spells";
import DDBFrameImporter from "../muncher/DDBFrameImporter";
import { downloadAdventureConfig } from "../muncher/adventure";
import AdventureMunch from "../muncher/adventure/AdventureMunch";
import ThirdPartyMunch from "../muncher/adventure/ThirdPartyMunch";
import { updateWorldMonsters, resetCompendiumActorImages } from "../muncher/tools";
import DDBSelectiveMonsterUpdate from "./DDBSelectiveMonsterUpdate";
import DDBMonsterFactory from "../parser/DDBMonsterFactory";
import { updateItemPrices } from "../muncher/prices";
import DDBAppV2 from "./DDBAppV2";
import DDBEncounterFactory from "../parser/DDBEncounterFactory";
import DDBDebugger from "./DDBDebugger";
import { SETTINGS } from "../config/_module";
import DDBMuleHandler from "../muncher/DDBMuleHandler";
import DDBCharacter from "../parser/DDBCharacter";
import DDBItemsImporter from "../muncher/DDBItemsImporter";
import DDBVehicleFactory from "../parser/DDBVehicleFactory";
import DDBSetup from "./DDBSetup";
import DDBSourcePruner from "./DDBSourcePruner";
import DDBMapBrowser from "./DDBMapBrowser";
import DDBStickerBrowser from "./DDBStickerBrowser";
import DDBAdventureBrowser from "./DDBAdventureBrowser";


interface IDDBMuncherContext extends
  // tabs is redeclared below with the project's IDDBTabs shape
  Omit<DeepPartial<foundry.applications.api.Application.RenderContext>, "tabs">,
  IMuncherSettings,
  ICharacterImportSettings,
  IEncounterSettings {
  // from super._prepareContext (DDBAppV2Context)
  tabs: IDDBTabs;

  // from _prepareEncounterContext
  encounter: {
    id: string | null;
    data: Record<string, any>;
    nameHtml?: string;
    summaryHtml?: string;
    charactersHtml?: string;
    monstersHtml?: string;
    difficultyHtml?: string;
    rewardsHtml?: string;
    progressHtml?: string;
  };
  availableCampaigns: any[];
  availableEncounters: any[];

  // from getCharacterMuncherSettings (_prepareCharacterContext)
  selectedClasses: any[];
  subclassSelection: any[];
  selectedSpecies: any[];
  rulesVersion: T5eRulesVersion;
  otherRulesVersion: T5eRulesVersion;
  classFilterEnabled: boolean;
  classMunchEnabled: boolean;
  speciesFilterEnabled: boolean;
  speciesMunchEnabled: boolean;

  // explicit assignments in _prepareContext
  searchTermMonster: string;
  searchTermItem: string;
  searchTermSpell: string;
  muleURL: string;
  characterId: string | null;
  useCharacterHomebrew: boolean;
  onlyCharacterHomebrew: boolean;
  characterOptionalClassFeatures: boolean;
  dontGrabExistingCharacterThings: boolean;
}

export default class DDBMuncher extends DDBAppV2 {

  processErrors: any[] = [];
  subClassMap: Record<string, IDDBMuleSubclassDefinition[]> = {};
  homebrewClasses = new Set();
  encounterId: string | null = null;
  encounter: any = null;
  searchTermMonster = "";
  searchTermItem = "";
  searchTermSpell = "";
  muleURL = "";
  characterId: string | null = null;
  actor: TImporterActor | null = null;
  encounterFactory: DDBEncounterFactory;
  // window height before the import details overlay forced the window to grow,
  // restored when the overlay is dismissed. null when no munch is in progress.
  preMunchHeight: number | "auto" | null = null;

  /**
   * The rules version the character munch tabs are set to, shared by the class,
   * species, feat and background rules toggles. Falls back to the 5e system setting.
   */
  static getSelectedRulesVersion(): T5eRulesVersion {
    const rulesVersion = utils.getSetting<T5eRulesVersion | "">("munching-policy-character-class-rules-version") ?? "";
    if (rulesVersion !== "") return rulesVersion;
    return utils.getSetting<string>("rulesVersion", "dnd5e") === "modern" ? "2024" : "2014";
  }

  constructor() {
    super();
    this.encounterFactory = new DDBEncounterFactory({
      notifier: this.notifier.bind(this),
    });

    const URL = utils.getSetting<string>("munching-policy-character-url");
    this.getCharacterId(URL);
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
      selectiveUpdateWorldActors: DDBMuncher.selectiveUpdateWorldMonsters,
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
      openCoreSetup: DDBMuncher.openCoreSetup,
      openSourcePruner: DDBMuncher.openSourcePruner,
      openMapBrowser: DDBMuncher.openMapBrowser,
      openStickerBrowser: DDBMuncher.openStickerBrowser,
      openAdventureBrowser: DDBMuncher.openAdventureBrowser,
      closeDetails: DDBMuncher.closeDetails,
    },
    position: {
      width: 880,
      height: "auto" as const,
    },
    window: {
      icon: "fab fa-d-and-d-beyond",
      title: "MrPrimate's DDB Muncher",
      resizable: true,
      minimizable: true,
      subtitle: "",
    },
  };

  static PARTS = {
    header: { template: "modules/ddb-importer/handlebars/muncher/header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    intro: {
      template: "modules/ddb-importer/handlebars/muncher/info/intro.hbs",
    },
    settings: {
      template: "modules/ddb-importer/handlebars/muncher/settings.hbs",
      templates: [
        "modules/ddb-importer/handlebars/muncher/settings/general.hbs",
        "modules/ddb-importer/handlebars/muncher/settings/sources.hbs",
        "modules/ddb-importer/handlebars/muncher/settings/deprecated.hbs",
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
        "modules/ddb-importer/handlebars/muncher/munch/adventures/browser.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/adventures/legacy.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/maps.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/encounters.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/characters.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/characters/settings.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/characters/feat.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/characters/backgrounds.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/characters/species.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/characters/class.hbs",
      ],
    },
    tools: {
      template: "modules/ddb-importer/handlebars/muncher/tools.hbs",
      templates: [
        "modules/ddb-importer/handlebars/muncher/tools/tools.hbs",
        "modules/ddb-importer/handlebars/muncher/tools/compendiums.hbs",
      ],
    },
    help: { template: "modules/ddb-importer/handlebars/muncher/info/help.hbs" },
    details: { template: "modules/ddb-importer/handlebars/muncher/details.hbs" },
    footer: { template: "modules/ddb-importer/handlebars/muncher/footer.hbs" },
  };

  /** @override */
  tabGroups = {
    sheet: "intro",
    settings: "general",
    munch: "spells",
    tools: "tools",
    monsters: "monsterMain",
    characters: "characterSettings",
    adventures: "adventureBrowser",
  };

  /** @override */
  _getTabs() {
    const tabs = this._markTabs({
      intro: {
        id: "intro", group: "sheet", label: "Intro", icon: "fas fa-info",
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
          deprecated: {
            id: "sourcesDeprecated", group: "settings", label: "Deprecated", icon: "fas fa-scroll-old",
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
            tabs: {
              browser: {
                id: "adventureBrowser", group: "adventures", label: "Browser", icon: "fas fa-book-open",
              },
              legacy: {
                id: "adventureLegacy", group: "adventures", label: "Legacy", icon: "fas fa-file-arrow-up",
              },
            },
          },
          maps: {
            id: "maps", group: "munch", label: "Maps", icon: "fas fa-map",
          },
          encounters: {
            id: "encounters", group: "munch", label: "Encounters", icon: "fas fa-dungeon",
          },
          characters: {
            id: "characters", group: "munch", label: "Characters", icon: "fas fa-users ",
            tabs: {
              settings: {
                id: "characterSettings", group: "characters", label: "Settings", icon: "fas fa-cogs",
              },
              feat: {
                id: "characterFeat", group: "characters", label: "Feats", icon: "fas fa-star",
              },
              backgrounds: {
                id: "characterBackgrounds", group: "characters", label: "Backgrounds", icon: "fas fa-scroll",
              },
              species: {
                id: "characterSpecies", group: "characters", label: "Species", icon: "fas fa-dragon",
              },
              class: {
                id: "characterClass", group: "characters", label: "Classes", icon: "fas fa-hat-wizard",
              },
            },
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
      help: {
        id: "help", group: "sheet", label: "Help", icon: "fas fa-question",
      },
    });
    return tabs;
  }


  _toggleNestedTabs() {
    const munch = this.element.querySelector(".munch-munch > [data-application-part=\"muncherTabs\"]");
    const munchActive = this.element.querySelector(".tab.active[data-group=\"munch\"]");
    if (munch && munchActive) {
      const hasNested = this.element.querySelector(
        ".tab.active[data-tab=\"monsters\"], .tab.active[data-tab=\"characters\"], .tab.active[data-tab=\"adventures\"]",
      );
      munch.classList.toggle("nested-tabs", !!hasNested);
    }
    super._toggleNestedTabs();
  }

  /* -------------------------------------------- */
  /*  Life-Cycle Handlers                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async _onRender(context: IDDBMuncherContext, options: foundry.applications.api.Application.RenderOptions) {
    await super._onRender(context, options);

    // a re-render mid-munch must not drop the height reserved for the overlay
    if (this.preMunchHeight !== null) this.element.classList.add("munching-active");

    // custom listeners
    // multi-selects
    this.element.querySelector("#muncher-included-source-categories")?.addEventListener("change", async (event) => {
      await DDBSources.updateIncludedCategories(DDBMuncher.getMultiSelectValues(event));
      await this.render();
    });

    this.element.querySelector("#muncher-source-select")?.addEventListener("change", async (event) => {
      await DDBSources.updateSelectedSources(DDBMuncher.getMultiSelectValues(event));
      await this.render();
    });

    this.element.querySelector("#muncher-monster-types-select")?.addEventListener("change", async (event) => {
      await DDBSources.updateSelectedMonsterTypes(DDBMuncher.getMultiSelectValues(event));
      await this.render();
    });

    this.element.querySelector("#muncher-class-source-select")?.addEventListener("change", async (event) => {
      const newClassIds = DDBMuncher.getMultiSelectValues(event).map((id) => parseInt(id));
      await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-classes", newClassIds);
      const currentSubclassMap = utils.getSetting<Record<string, number[]>>("munching-policy-character-subclasses") ?? {};
      const prunedSubclassMap: Record<string, number[]> = {};
      for (const classId of newClassIds) {
        if (currentSubclassMap[classId]) prunedSubclassMap[classId] = currentSubclassMap[classId];
      }
      await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-subclasses", prunedSubclassMap);
      await this.render();
    });

    this.element.querySelector("#muncher-species-source-select")?.addEventListener("change", async (event) => {
      const newSpeciesIds = DDBMuncher.getMultiSelectValues(event).map((id) => parseInt(id));
      await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-species", newSpeciesIds);
      await this.render();
    });

    this.element.querySelector("#muncher-class-select-core")?.addEventListener("click", async (event) => {
      event.preventDefault();
      const rulesVersion = utils.getSetting<string>("munching-policy-character-class-rules-version") ?? "2024";
      const coreCategoryId = rulesVersion === "2014" ? 26 : 24;
      const coreSourceIds = new Set(
        CONFIG.DDB.sources
          .filter((s) => s.sourceCategoryId === coreCategoryId)
          .map((s) => s.id),
      );
      // ensure the core category is active in the source filter so core classes are visible
      const includedCategories = utils.getSetting<string[]>("munching-policy-muncher-included-source-categories")
        .map((id) => parseInt(id));
      if (!includedCategories.includes(coreCategoryId)) {
        await DDBSources.updateIncludedCategories([...includedCategories, coreCategoryId]);
      }
      const classes = await DDBMuleHandler.getList<IDDBMuleClassDefinition>("class", Array.from(coreSourceIds));
      const coreClassIds = classes
        .filter((klass) => klass.sources.some((s) => coreSourceIds.has(s.sourceId)))
        .filter((klass) => {
          const is2014 = klass.sources.every((s) => DDBSources.is2014Source(s));
          return rulesVersion === "2014" ? is2014 : !is2014;
        })
        .map((klass) => klass.id);
      const existing = utils.getSetting<number[]>("munching-policy-character-classes")
        .map((id) => parseInt(String(id)));
      const merged = Array.from(new Set([...existing, ...coreClassIds]));
      logger.info(`Select Core Classes: selecting ${coreClassIds.length} classes for ${rulesVersion}`, { coreClassIds, merged });
      await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-classes", merged);
      await this.render();
    });

    // shared by the class and species rules-version toggles (same setting)
    this.element.querySelectorAll(".muncher-rules-toggle").forEach((el) => {
      el.addEventListener("click", async (event) => {
        event.preventDefault();
        const current = utils.getSetting<string>("munching-policy-character-class-rules-version") ?? "2024";
        const next = current === "2024" ? "2014" : "2024";
        const systemIsModern = utils.getSetting<string>("rulesVersion", "dnd5e") === "modern";
        if (next === "2014" && systemIsModern) {
          const proceed = await foundry.applications.api.DialogV2.confirm({
            rejectClose: false,
            window: { title: "Rules Version Warning" },
            content: `<p>You are switching to importing 2014 classes, subclasses and species, but your 5e system is set to modern/2024 rules. DDB now provides 2024 versions of the 2014 subclasses. Please be warned that importing a mix of 2014/2024 content into compendiums may result in odd behaviour.</p>`,
          });
          if (!proceed) return;
        }
        if (next === "2024" && !systemIsModern) {
          const proceed = await foundry.applications.api.DialogV2.confirm({
            rejectClose: false,
            window: { title: "Rules Version Warning" },
            content: `<p>You are switching to importing 2024/5.5e classes, subclasses and species, but your 5e system is set to 2014/classic. Please be warned these might not work properly in your system.</p>`,
          });
          if (!proceed) return;
        }
        await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-class-rules-version", next);
        await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-classes", []);
        await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-subclasses", {});
        await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-species", []);
        this.subClassMap = {};
        await this.render();
      });
    });

    this.element.querySelector("#muncher-open-sources-settings")?.addEventListener("click", (event) => {
      event.preventDefault();
      this.changeTab("settings", "sheet", {});
      this.changeTab("sources", "settings", {});
    });

    this.element.querySelectorAll(".ddb-subclass-select").forEach((el) => {
      el.addEventListener("change", async (event) => {
        const el = event.currentTarget as HTMLElement | null;
        const classId = parseInt(el?.dataset.classId ?? "0");
        const selectedSubIds = DDBAppV2.getMultiSelectValues(event).map((id) => parseInt(id));
        const currentMap = utils.getSetting<Record<string, string[]>>("munching-policy-character-subclasses") ?? {};
        const nextMap = { ...currentMap, [classId]: selectedSubIds };
        await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-subclasses", nextMap);
        await this.render();
      });
    });

    this.element.querySelector("#monster-munch-filter")?.addEventListener("change", async (event) => {
      this.searchTermMonster = (event.target as HTMLInputElement).value ?? "";
    });

    this.element.querySelector("#item-munch-filter")?.addEventListener("change", async (event) => {
      this.searchTermItem = (event.target as HTMLInputElement).value ?? "";
    });

    this.element.querySelector("#spell-munch-filter")?.addEventListener("change", async (event) => {
      this.searchTermSpell = (event.target as HTMLInputElement).value ?? "";
    });

    this.element.querySelectorAll("[id^='munching-selection-compendium-folders-'")?.forEach((folder) => {
      folder.addEventListener("change", async (event) => {
        await game.settings.set(SETTINGS.MODULE_ID, folder.id as any, (event.target as HTMLInputElement).value);
      });
    });

    this.element.querySelector("#encounter-campaign-select")?.addEventListener("change", async (event) => {
      if (!context.tiers.supporter) return;
      const campaignId = (event.target as EventTarget & { _value?: string })._value ?? undefined;
      const encounters = await this.encounterFactory.filterEncounters(campaignId);
      const campaignSelected = campaignId && campaignId !== "";
      let encounterList = `<option value=""></option>`;
      encounters.forEach((encounter) => {
        encounterList += `<option value="${encounter.id}">${encounter.name}${
          campaignSelected || !encounter.campaign ? "" : ` (${encounter.campaign.name})`
        }</option>\n`;
      });
      const list = this.element.querySelector("#encounter-select");
      if (!list) return;
      list.innerHTML = encounterList;
      this.resetEncounter();
    });

    this.element.querySelector("#encounter-select")?.addEventListener("change", async (event) => {
      this.encounterId = (event.target as HTMLSelectElement).value ?? undefined;
      await this.render();
    });

    // watch the change of the muncher-policy-selector checkboxes
    this.element.querySelectorAll("fieldset :is(dnd5e-checkbox)").forEach((checkbox) => {
      checkbox.addEventListener("change", async (event) => {
        await MuncherSettings.updateMuncherSettings(event);
        await this.render();
      });
    });

    this.element.querySelector("input[name=muncher-character-url]")?.addEventListener("input", async (event) => {
      await this.#handleURLUpdate(event);
    });

  }


  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritDoc */
  changeTab(tab: any, group: any, options: any) {
    super.changeTab(tab, group, options);
    if (["munch"].includes(group)) {
      this._toggleNestedTabs();
    }
  }

  async _prepareEncounterContext(context: IDDBMuncherContext): Promise<IDDBMuncherContext> {
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

    const goodCharacters = this.encounter.goodCharacterData.map((character: any) => `${character.name}`).join(", ");
    const goodMonsters = this.encounter.goodMonsterIds.map((monster: any) => `${monster.name}`).join(", ");
    const neededCharactersHTML = this.encounter.missingCharacters
      ? ` <span style="color: red"> Missing ${
        this.encounter.missingCharacterData.length
      }: ${this.encounter.missingCharacterData.map((character: any) => character.name).join(", ")}</span>`
      : "";
    const neededMonstersHTML = this.encounter.missingMonsters
      ? ` <span style="color: red"> Missing ${
        this.encounter.missingMonsterIds.length
      }. DDB Id's: ${this.encounter.missingMonsterIds.map((monster: any) => monster.ddbId).join(", ")}</span>`
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


  async _prepareCharacterContext(context: IDDBMuncherContext): Promise<IDDBMuncherContext> {
    const characterContext = await MuncherSettings.getCharacterMuncherSettings(this);
    context = foundry.utils.mergeObject(context, characterContext);
    return context;
  }

  async _prepareContext(options: any): Promise<IDDBMuncherContext> {
    let context: IDDBMuncherContext = MuncherSettings.getMuncherSettings() as IDDBMuncherContext;
    context = foundry.utils.mergeObject(context, MuncherSettings.getCharacterImportSettings());
    context = foundry.utils.mergeObject(context, MuncherSettings.getEncounterSettings());
    context = await this._prepareEncounterContext(context);
    context = await this._prepareCharacterContext(context);

    if (this.encounter) {
      context.encounterConfig = context.encounterConfig.map((setting) => {
        if (setting.name === "encounter-import-policy-use-ddb-save") setting.enabled = this.encounter.inProgress;
        return setting;
      });
    }
    context = foundry.utils.mergeObject(await super._prepareContext(options), context, { inplace: false }) as unknown as IDDBMuncherContext;
    context.searchTermMonster = this.searchTermMonster;
    context.searchTermItem = this.searchTermItem;
    context.searchTermSpell = this.searchTermSpell;
    context.muleURL = this.muleURL;
    context.characterId = this.characterId;
    context.useCharacterHomebrew = utils.getSetting<boolean>("munching-policy-character-fetch-homebrew");
    context.onlyCharacterHomebrew = utils.getSetting<boolean>("munching-policy-character-only-homebrew");
    context.characterOptionalClassFeatures = utils.getSetting<boolean>("munching-policy-character-optional-class-features");
    context.dontGrabExistingCharacterThings = utils.getSetting<boolean>("munching-policy-character-dont-grab-existing");
    logger.debug("Muncher: _prepareContext", context);
    return context;
  }

  /** @override */

  async _preparePartContext(partId: string, context: any) {
    switch (partId) {
      default: {
        context.tab = context.tabs[partId];
        break;
      }
    };
    return context;
  }


  _disableButtons() {
    const buttonSelectors = [
      "button[id^=\"adventure-config-start\"]",
      "button[id^=\"munch-\"]",
    ];
    buttonSelectors.forEach((selector) => {
      const buttons = this.element.querySelectorAll(selector) as NodeListOf<HTMLButtonElement>;
      buttons.forEach((button) => {
        button.disabled = true;
      });
    });
    const progressElement = this.element.querySelector(".ddb-overlay");
    if (progressElement) progressElement.classList.remove("munching-invalid");

    const detailsElement = this.element.querySelector(".ddb-muncher-details");
    if (detailsElement) detailsElement.classList.remove("munching-details-hidden");
    const okayButton = this.element.querySelector("#munch-details-okay");
    if (okayButton) okayButton.classList.add("munching-hidden");
    this._expandForDetails();
  }

  /**
   * Reserve enough window height for the import details overlay. The overlay is
   * absolutely positioned so it can't grow an auto-height window by itself, and
   * the short tabs (feats, backgrounds, species) are shorter than the dialog.
   */
  _expandForDetails() {
    if (!this.element) return;
    if (this.preMunchHeight === null) this.preMunchHeight = this.position.height;
    this.element.classList.add("munching-active");
    // re-run positioning so the frame picks up the reserved min-height and the
    // top offset is re-clamped against the viewport
    this.setPosition({ height: "auto" });
  }

  /** Drop the reserved height and put the window back to the size it had before munching. */
  _restoreAfterDetails() {
    if (!this.element) return;
    this.element.classList.remove("munching-active");
    const height = this.preMunchHeight ?? "auto";
    this.preMunchHeight = null;
    this.setPosition({ height });
  }

  _enableButtons() {
    const okayButton = this.element.querySelector("#munch-details-okay") as HTMLButtonElement | null;
    if (okayButton) {
      okayButton.classList.remove("munching-hidden");
      okayButton.disabled = false;
    }
    const progressElement = this.element.querySelector(".ddb-overlay");
    if (progressElement) progressElement.classList.add("munching-invalid");
  }

  static async closeDetails(this: DDBMuncher, _event: any, _target: any) {
    const detailsElement = this.element.querySelector(".ddb-muncher-details");
    if (detailsElement) detailsElement.classList.add("munching-details-hidden");
    this._restoreAfterDetails();
    this._doEnableButtons();
  }

  _doEnableButtons() {
    const cobalt = Secrets.getCobalt() != "";
    if (!cobalt) return;
    const tier = PatreonHelper.getPatreonTier();
    const tiers = PatreonHelper.calculateAccessMatrix(tier);

    const buttonSelectors = [
      "button[id^=\"adventure-config-start\"]",
      "button[id^=\"munch-spells-start\"]",
      "button[id^=\"munch-items-start\"]",
      "button[id^=\"munch-adventure-config-start\"]",
      "button[id^=\"munch-adventure-import-start\"]",
      "button[id^=\"munch-adventure-third-party-start\"]",
      "button[id^=\"munch-migrate-compendium-monster\"]",
      "button[id^=\"munch-migrate-compendium-spell\"]",
      "button[id^=\"munch-migrate-compendium-item\"]",
      "button[id^=\"munch-reset-images\"]",
      "button[id^=\"munch-xanathar-price\"]",
      "button[id^=\"munch-world-monster-update\"]",
      "button[id^=\"munch-world-monster-selective-update\"]",
      "button[id^=\"munch-regenerate-storage\"]",
      "button[id^=\"munch-open-core-setup\"]",
      "button[id^=\"munch-adventure-open\"]",
    ];

    if (tiers.all) {
      buttonSelectors.push("button[id^=\"munch-monsters-start\"]");
      buttonSelectors.push("button[id^=\"munch-source-select\"]");
      buttonSelectors.push("button[id^=\"munch-encounter-start\"]");
    }
    if (tiers.supporter) {
      buttonSelectors.push("button[id^=\"munch-frames-start\"]");
    }
    if (tiers.experimentalMid) {
      buttonSelectors.push("button[id^=\"munch-vehicles-start\"]");
      buttonSelectors.push("button[id^=\"munch-species-start\"]");
      buttonSelectors.push("button[id^=\"munch-feats-start\"]");
      buttonSelectors.push("button[id^=\"munch-classes-start\"]");
      buttonSelectors.push("button[id^=\"munch-backgrounds-start\"]");
      buttonSelectors.push("button[id^=\"munch-maps-open\"]");
      buttonSelectors.push("button[id^=\"munch-stickers-open\"]");
    }

    buttonSelectors.forEach((selector) => {
      const buttons = this.element.querySelectorAll(selector) as NodeListOf<HTMLButtonElement>;
      buttons.forEach((button) => {
        button.disabled = false;
      });
    });

    const progressElement = this.element.querySelector(".ddb-overlay");
    if (progressElement) progressElement.classList.add("munching-invalid");
  }

  static async parseMonsters(this: DDBMuncher, _event: any, _target: any) {
    try {
      logger.info("Munching monsters!");
      this._disableButtons();
      const monsterFactory = new DDBMonsterFactory({
        notifier: this.notifier.bind(this),
        notifierV2: this.notifierV2.bind(this),
      });
      const result = await monsterFactory.processIntoCompendium(undefined, this.searchTermMonster);
      this.notifier(`Finished importing ${result} monsters!`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) logger.error(error.stack);
    } finally {
      this.clearProgressBars();
      this._enableButtons();
    }
  }

  static async parseVehicles(this: DDBMuncher, _event: any, _target: any) {
    try {
      logger.info("Munching vehicles!");
      this._disableButtons();
      const vehicleFactory = new DDBVehicleFactory({
        notifier: this.notifier.bind(this),
        notifierV2: this.notifierV2.bind(this),
      });
      const result = await vehicleFactory.processIntoCompendium(undefined, this.searchTermMonster);
      this.notifier(`Finished importing ${result} vehicles!`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) logger.error(error.stack);
    } finally {
      this.clearProgressBars();
      this._enableButtons();
    }
  }

  static async parseSpells(this: DDBMuncher, _event: any, _target: any) {
    try {
      logger.info("Munching spells!");
      this._disableButtons();
      await parseSpells({
        notifier: this.notifier.bind(this),
        notifierV2: this.notifierV2.bind(this),
        searchFilter: this.searchTermSpell,
      });
      this.notifier(`Finished importing spells!`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }


  static async parseItems(this: DDBMuncher, _event: any, _target: any) {
    try {
      logger.info("Munching items!");
      this._disableButtons();
      await DDBItemsImporter.fetchAndImportItems({
        notifier: this.notifier.bind(this),
        notifierV2: this.notifierV2.bind(this),
        searchFilter: this.searchTermItem,
      });
      this.notifier(`Finished importing items!`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }


  static async parseFrames(this: DDBMuncher, _event: any, _target: any) {
    try {
      logger.info("Munching frames!");
      this._disableButtons();
      const result = await DDBFrameImporter.parseFrames(this.notifierV2.bind(this));
      this.notifierV2({
        section: "name",
        message: `Finished importing ${result} frames!`,
        progress: { current: result, total: result },
        clear: true,
      });
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  async #processClassMunching(options: IDDBMuleHandlerOptions) {
    const muleHandler = new DDBMuleHandler(options);

    try {
      await muleHandler.process();

      logger.debug(`Mule processed`, {
        muleHandler,
        options: foundry.utils.deepClone(options),
      });
    } catch (error) {
      this.processErrors.push({
        error: utils.errorMessage(error),
        isHomebrew: options.homebrew,
        classId: options.classId,
        message: `Class Mule failure see error messages for details`,
      });
      throw error;
    }
  }

  async #parseHomebrewClassesWithMule({ baseOptions, classList, onlyHomebrew, dontGrabExisting = false, existingSubclassIds = new Set<number>() }: {
    baseOptions: IDDBMuleHandlerOptions;
    classList: IDDBMuleClassDefinition[];
    onlyHomebrew?: boolean;
    dontGrabExisting?: boolean;
    existingSubclassIds?: Set<number>;
  }) {
    logger.info(`Processing ${this.homebrewClasses.size} classes with homebrew subclasses`, {
      homebrewClasses: Array.from(this.homebrewClasses),
    });
    const options = foundry.utils.deepClone(baseOptions);
    for (const classId of this.homebrewClasses) {
      const klass = classList.find((c) => c.id === classId);
      if (!klass) {
        logger.warn(`Homebrew class ${classId} not found in class list, skipping`, { classList });
        continue;
      }
      const version = klass.sources.every((s) => DDBSources.is2014Source(s)) ? "2014" : "2024";
      logger.debug("Munching homebrew subclasses for class", {
        classId,
        klass,
        homebrewClasses: Array.from(this.homebrewClasses),
        classList,
        version,
      });
      options.homebrew = true;
      options.onlyHomebrew = onlyHomebrew;
      options.classId = klass.id;
      this.autoRotateMessage("class", klass.name.toLowerCase());
      logger.info(`Munching class ${klass.name} (${klass.id}) Homebrew subclasses`);

      const subClasses = this.subClassMap[klass.id]
        .filter((subKlass) => subKlass.isHomebrew)
        .filter((subKlass) => !(dontGrabExisting && existingSubclassIds.has(parseInt(String(subKlass.id)))));

      if (dontGrabExisting && subClasses.length === 0) {
        logger.info(`Skipping homebrew subclasses for class ${klass.name} (${klass.id}): all already exist`);
        continue;
      }

      const sliceSize = 3;
      for (let i = 0; i < subClasses.length; i += sliceSize) {
        const filterIds = subClasses.slice(i, i + sliceSize).map((sc) => sc.id);
        options.filterIds = filterIds;

        logger.debug("Munching homebrew subclasses for class with filter", {
          classId,
          klass,
          version,
          filterIds,
          start: i,
          end: i + filterIds.length,
          subClasses,
        });

        this.notifierV2({
          section: "name",
          message: `Munching for ${klass.name} from ${i}-${i + filterIds.length} homebrew subclasses...`,
        });
        try {
          await this.#processClassMunching(options);
          logger.debug(`Munch Complete for class ${klass.name} for homebrew`, {
            options: foundry.utils.deepClone(options),
          });
        } catch (error) {
          logger.error(error);
          if (error instanceof Error) logger.error(error.stack);
          this.processErrors.push({
            className: klass.name,
            classId: klass.id,
            filterIds,
            category: "Homebrew",
            error: utils.errorMessage(error),
            message: `Class ${klass.name} (${klass.id} from ${i}-${i + filterIds.length}) for homebrew subclasses`,
          });
        }
      }
    }
  }

  async #parseOfficialClassesWithMule({ sourceIdArrays, baseOptions, classList, subclassSelections, dontGrabExisting = false, existingSubclassIds = new Set<number>() }: {
    sourceIdArrays: { categoryId: number; sourceIds: number[] }[];
    baseOptions: IDDBMuleHandlerOptions;
    classList: IDDBMuleClassDefinition[];
    subclassSelections?: Record<string, number[]>;
    dontGrabExisting?: boolean;
    existingSubclassIds?: Set<number>;
  }) {
    for (const sourceIdArray of sourceIdArrays) {
      const category = CONFIG.DDB.sourceCategories.find((c) => c.id === sourceIdArray.categoryId);
      const options = foundry.utils.deepClone(baseOptions);

      for (const klass of classList) {
        this.autoRotateMessage("class", klass.name.toLowerCase());
        logger.info(`Munching class ${klass.name} (${klass.id}) in ${category?.name ?? sourceIdArray.categoryId}`);
        options.classId = klass.id;
        const selections = subclassSelections ?? {};
        const selectedSubIds = (selections[klass.id] ?? selections[String(klass.id)] ?? [])
          .map((id) => parseInt(String(id)));
        options.filterIds = selectedSubIds;

        if (dontGrabExisting) {
          // build an explicit list of only the missing subclasses (empty filterIds would mean "all")
          const allSubIds = (this.subClassMap[klass.id] ?? []).map((sc) => parseInt(String(sc.id)));
          const baseSubIds = selectedSubIds.length > 0 ? selectedSubIds : allSubIds;
          const missingSubIds = baseSubIds.filter((id) => !existingSubclassIds.has(id));
          if (missingSubIds.length === 0) {
            logger.info(`Skipping class ${klass.name} (${klass.id}): all in-scope subclasses already exist`);
            continue;
          }
          options.filterIds = missingSubIds;
        }

        const version = klass.sources.every((s) => DDBSources.is2014Source(s)) ? "2014" : "2024";
        const subClasses = this.subClassMap[klass.id];
        const subClassSources = new Set(subClasses.map((subKlass) => subKlass.sources.map((s) => s.sourceId)).flat());
        const sources = foundry.utils.deepClone(sourceIdArray.sourceIds)
          .filter((sourceId) => subClassSources.has(sourceId));

        if (sources.length === 0) {
          logger.info(`No subclasses in selected sources for class ${klass.name} (${klass.id} - ${version}) in ${category?.name ?? sourceIdArray.categoryId}, skipping`, {
            sources,
            subClassSources,
            allowHomebrew: options.homebrew,
            onlyHomebrew: options.onlyHomebrew,
            homebrewClasses: this.homebrewClasses,
            subClasses,
            subClassMap: this.subClassMap,
            version,
            klass,
            originalSources: sourceIdArray.sourceIds,
          });
          continue;
        }

        options.sources = sources;

        this.notifierV2({
          section: "name",
          message: `Munching for ${klass.name} from ${sources.length} sources in the ${category?.name ?? sourceIdArray.categoryId} category...`,
        });
        try {
          await this.#processClassMunching(options);
          logger.debug(`Munch Complete for class ${klass.name} in ${category?.name ?? sourceIdArray.categoryId}`, {
            sourceIdArray,
            options: foundry.utils.deepClone(options),
          });
        } catch (error) {
          logger.error(error);
          if (error instanceof Error) logger.error(error.stack);
          this.processErrors.push({
            className: klass.name,
            classId: klass.id,
            category: category?.name ?? sourceIdArray.categoryId,
            error: utils.errorMessage(error),
            message: `Class ${klass.name} (${klass.id}) in ${category?.name ?? sourceIdArray.categoryId}`,
          });
        }
      }
    }
  }


  async _parseClassesWithMule() {
    // callers check this, guard here so the id stays narrowed across awaits
    const characterId = this.characterId;
    if (!characterId) {
      ui.notifications.error("You must enter a valid D&D Beyond character URL to import classes.");
      return;
    }
    this.autoRotateMessage("class");
    // prepare sources to munch from
    const allowHomebrew = utils.getSetting<boolean>("munching-policy-character-fetch-homebrew");
    const onlyHomebrew = utils.getSetting<boolean>("munching-policy-character-only-homebrew");
    const sourceIdArrays = DDBSources.getChosenCategoriesAndBooks();
    // union of every chosen book (plus core), used to filter content that is not
    // partitioned per category run, e.g. optional class features
    const allSourceIds = DDBSources.getChosenSourceIdSet();

    const baseOptions: IDDBMuleHandlerOptions = {
      characterId,
      homebrew: false,
      onlyHomebrew: false,
      type: "class",
      ddbMuncher: this,
      optionalClassFeatures: utils.getSetting<boolean>("munching-policy-character-optional-class-features"),
      optionSourceIds: Array.from(allSourceIds),
    };

    const allowedClassIds = utils.getSetting<number[]>("munching-policy-character-classes")
      .map((id) => parseInt(String(id)));

    if (allowedClassIds.length === 0) {
      this.notifier("Select at least one class to munch.", { nameField: true });
      this.stopAutoRotateMessage();
      return;
    }

    const subclassSelections = utils.getSetting<Record<string, number[]>>("munching-policy-character-subclasses") ?? {};

    // "Don't grab existing things": build the set of subclass ids already in the compendium (current rules version)
    const dontGrabExisting = utils.getSetting<boolean>("munching-policy-character-dont-grab-existing");
    const rulesVersion = DDBMuncher.getSelectedRulesVersion();
    const existingSubclassIds = dontGrabExisting
      ? await DDBMuleHandler.getExistingSubclassIds(rulesVersion)
      : new Set<number>();

    // determine classes to parse
    const classList = (await DDBMuleHandler.getList<IDDBMuleClassDefinition>("class", Array.from(allSourceIds)))
      .filter((c) => allowedClassIds.includes(c.id));

    logger.info(`Found ${classList.length} classes to munch`, {
      classList,
      allSourceIds,
      allowedClassIds,
      baseOptions,
    });

    this.processErrors = [];
    // reset homebrew tracking; keep subclass cache populated during render
    this.homebrewClasses = new Set();

    try {
      // determine campaign id for the character to fetch appropriate subclass list
      const slimData = await DDBMuleHandler.getSlimCharacters([characterId]);
      const campaignId = slimData && slimData.length > 0 ? slimData[0]?.campaign?.id : null;

      // generate subclasses to parse (parallel, using the cached helper)
      await Promise.all(classList.map(async (klass) => {
        const version = klass.sources.every((s) => DDBSources.is2014Source(s))
          ? "2014"
          : "2024";
        if (!this.subClassMap[klass.id]) {
          this.subClassMap[klass.id] = await DDBMuleHandler.getSubclassesCached({
            className: klass.name,
            classId: klass.id,
            rulesVersion: version,
            includeHomebrew: true,
            campaignId,
          });
        }
        if (this.subClassMap[klass.id].some((subKlass) => subKlass.isHomebrew)) {
          this.homebrewClasses.add(klass.id);
        }
      }));

      if (!onlyHomebrew) {
        await this.#parseOfficialClassesWithMule({ sourceIdArrays, baseOptions, classList, subclassSelections, dontGrabExisting, existingSubclassIds });
      }

      if (allowHomebrew && this.homebrewClasses.size > 0) {
        await this.#parseHomebrewClassesWithMule({ baseOptions, classList, onlyHomebrew, dontGrabExisting, existingSubclassIds });
      }
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) logger.error(error.stack);
      this.notifier(`Error during munching: ${utils.errorMessage(error)}`, { nameField: true });
    } finally {
      this.stopAutoRotateMessage();
      if (this.processErrors.length > 0) {
        this.notifier(`Errors during munching: ${this.processErrors.length}`, { nameField: true });
        this.notifier(this.processErrors.map((e) => e.message).join(" & "), { message: true });
        logger.error("Process Errors:", {
          processErrors: this.processErrors,
          this: this,
        });
      }
    }
  }

  async _parseWithMule(type: "feat" | "background" | "species") {
    this.autoRotateMessage(type);
    const homebrew = utils.getSetting<boolean>("munching-policy-character-fetch-homebrew");
    const onlyHomebrew = utils.getSetting<boolean>("munching-policy-character-only-homebrew");
    const baseOptions: IDDBMuleHandlerOptions = {
      characterId: this.characterId,
      homebrew: false,
      onlyHomebrew: false,
      type,
      ddbMuncher: this,
    };
    const sourceIdArrays = DDBSources.getChosenCategoriesAndBooks();

    // species supports per-item filtering: pass explicit entityRaceIds as filterIds (empty = all)
    const dontGrabExisting = utils.getSetting<boolean>("munching-policy-character-dont-grab-existing");
    const selectedSpeciesIds = type === "species"
      ? utils.getSetting<number[]>("munching-policy-character-species").map((id) => parseInt(String(id)))
      : [];
    // active when the user picked a subset, or "don't grab existing" is on and we must build an explicit list
    const speciesFilterActive = type === "species" && (selectedSpeciesIds.length > 0 || dontGrabExisting);
    // full race list (the /proxy/races endpoint ignores sources) + existing ids, fetched once when filtering
    let speciesList: IDDBMuleSpeciesDefinition[] = [];
    let existingSpeciesIds = new Set<number>();
    if (speciesFilterActive) {
      try {
        speciesList = await DDBMuleHandler.getList<IDDBMuleSpeciesDefinition>("species", null);
      } catch (error) {
        logger.warn("Failed to fetch species list for filtering", error);
      }
      if (dontGrabExisting) {
        // version-agnostic: species munch grabs both rules versions, so exclude any existing entityRaceId
        existingSpeciesIds = await DDBMuleHandler.getExistingSpeciesIds(null);
      }
    }

    // feats and backgrounds are filtered to the selected rules version, and (optionally) to
    // whatever is not already in the compendium. Both mule flows filter on the catalog entry id.
    let featBgActive = type === "feat" || type === "background";
    let catalog: IDDBMuleFeatDefinition[] = [];
    let existingFeatBgIds = new Set<number>();
    const rulesVersion = DDBMuncher.getSelectedRulesVersion();
    if (featBgActive) {
      try {
        // the /proxy/feats and /proxy/backgrounds endpoints ignore sources and return the full catalog
        catalog = await DDBMuleHandler.getList<IDDBMuleFeatDefinition>(type, null);
      } catch (error) {
        logger.warn(`Failed to fetch ${type} list for filtering, munching everything instead`, error);
        featBgActive = false;
      }
      if (featBgActive && dontGrabExisting) {
        existingFeatBgIds = type === "feat"
          ? await DDBMuleHandler.getExistingFeatIds(rulesVersion)
          : await DDBMuleHandler.getExistingBackgroundIds(rulesVersion);
      }
    }
    const isDefinition2014 = (definition: IDDBMuleFeatDefinition) =>
      definition.sources.length > 0 && definition.sources.every((s) => DDBSources.is2014Source(s));
    const matchesRulesVersion = (definition: IDDBMuleFeatDefinition) =>
      (rulesVersion === "2014" ? isDefinition2014(definition) : !isDefinition2014(definition));

    const processErrors = [];

    try {
      for (const sourceIdArray of sourceIdArrays) {
        if (onlyHomebrew) continue;
        const category = CONFIG.DDB.sourceCategories.find((c) => c.id === sourceIdArray.categoryId);
        const options: IDDBMuleHandlerOptions = foundry.utils.deepClone(baseOptions);

        const sliceSize = type === "species" ? 5 : 10;
        for (let i = 0; i < sourceIdArray.sourceIds.length; i += sliceSize) {
          const chunkedIds = sourceIdArray.sourceIds.slice(i, i + sliceSize);

          options.sources = chunkedIds;

          if (speciesFilterActive) {
            const chunkSet = new Set(chunkedIds);
            // base id list: explicit selection if any, otherwise every species in this chunk's sources
            let chunkSpeciesIds: number[];
            if (selectedSpeciesIds.length > 0) {
              chunkSpeciesIds = speciesList.length === 0
                ? selectedSpeciesIds
                : selectedSpeciesIds.filter((raceId) => {
                  const sp = speciesList.find((s) => s.entityRaceId === raceId);
                  return sp ? sp.sources.some((s) => chunkSet.has(s.sourceId)) : true;
                });
            } else {
              // no explicit selection: dontGrabExisting is on (speciesFilterActive guarantees it)
              chunkSpeciesIds = speciesList
                .filter((sp) => sp.sources.some((s) => chunkSet.has(s.sourceId)))
                .map((sp) => sp.entityRaceId);
            }
            if (dontGrabExisting) {
              chunkSpeciesIds = chunkSpeciesIds.filter((raceId) => !existingSpeciesIds.has(raceId));
            }
            if (chunkSpeciesIds.length === 0) continue;
            options.filterIds = chunkSpeciesIds;
          }

          if (featBgActive) {
            const chunkSet = new Set(chunkedIds);
            let chunkIds = catalog
              .filter((definition) => matchesRulesVersion(definition))
              .filter((definition) => definition.sources.some((s) => chunkSet.has(s.sourceId)))
              .map((definition) => definition.id);
            if (dontGrabExisting) {
              chunkIds = chunkIds.filter((id) => !existingFeatBgIds.has(id));
            }
            // an empty filterIds would mean "everything" to the proxy, so skip the chunk instead
            if (chunkIds.length === 0) continue;
            options.filterIds = chunkIds;
          }

          const muleHandler = new DDBMuleHandler(options);
          this.notifierV2({
            section: "name",
            message: `Munching from ${i}-${i + chunkedIds.length} (of ${sourceIdArray.sourceIds.length}) sources in the ${category?.name ?? sourceIdArray.categoryId} category...`,
          });
          try {
            await muleHandler.process();

            logger.debug(`Partial Munch Complete for ${type} in ${category?.name ?? sourceIdArray.categoryId}`, {
              muleHandler,
              sources: chunkedIds,
              options: foundry.utils.deepClone(options),
            });
          } catch (error) {
            logger.error(error);
            if (error instanceof Error) logger.error(error.stack);
            processErrors.push({
              type,
              category: category?.name ?? sourceIdArray.categoryId,
              error: utils.errorMessage(error),
              chunkedIds,
              message: `${type} in ${category?.name ?? sourceIdArray.categoryId}, with sourceIds ${chunkedIds.join(", ")}`,
            });
          }
        }

        logger.debug(`Munch Complete for ${type} in ${category?.name ?? sourceIdArray.categoryId}`, {
          sourceIdArray,
          options: foundry.utils.deepClone(options),
        });

      }

      let runHomebrew = homebrew || onlyHomebrew;
      let homebrewSpeciesIds: number[] = [];
      if (runHomebrew && speciesFilterActive) {
        // explicit selection, else all homebrew species; then drop existing when the flag is on
        homebrewSpeciesIds = selectedSpeciesIds.length > 0
          ? selectedSpeciesIds
          : speciesList.filter((sp) => sp.isHomebrew).map((sp) => sp.entityRaceId);
        if (dontGrabExisting) {
          homebrewSpeciesIds = homebrewSpeciesIds.filter((raceId) => !existingSpeciesIds.has(raceId));
        }
        // empty explicit list would mean "all" to the proxy; skip the homebrew pass instead
        if (homebrewSpeciesIds.length === 0) {
          logger.debug("Skipping homebrew species pass: nothing new to munch");
          runHomebrew = false;
        }
      }

      let homebrewFeatBgIds: number[] = [];
      if (runHomebrew && featBgActive) {
        homebrewFeatBgIds = catalog
          .filter((definition) => definition.isHomebrew)
          .filter((definition) => matchesRulesVersion(definition))
          .map((definition) => definition.id);
        if (dontGrabExisting) {
          homebrewFeatBgIds = homebrewFeatBgIds.filter((id) => !existingFeatBgIds.has(id));
        }
        if (homebrewFeatBgIds.length === 0) {
          logger.debug(`Skipping homebrew ${type} pass: nothing new to munch`);
          runHomebrew = false;
        }
      }

      if (runHomebrew) {
        const options: IDDBMuleHandlerOptions = foundry.utils.deepClone(baseOptions);
        options.homebrew = true;
        options.onlyHomebrew = onlyHomebrew;
        if (speciesFilterActive && homebrewSpeciesIds.length > 0) {
          options.filterIds = homebrewSpeciesIds;
        }
        if (featBgActive && homebrewFeatBgIds.length > 0) {
          options.filterIds = homebrewFeatBgIds;
        }
        const muleHandler = new DDBMuleHandler(options);
        this.notifierV2({
          section: "name",
          message: `Munching from Homebrew category for ${type}...`,
        });
        try {
          await muleHandler.process();

          logger.debug(`Munch Complete for ${type} in Homebrew`, {
            muleHandler,
            homebrew,
            onlyHomebrew,
            options: foundry.utils.deepClone(options),
          });
        } catch (error) {
          logger.error(error);
          if (error instanceof Error) logger.error(error.stack);
          processErrors.push({
            type,
            category: "Homebrew",
            error: utils.errorMessage(error),
            message: `${type} in Homebrew`,
          });
        }
      }
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) logger.error(error.stack);
      this.notifier(`Error during munching: ${utils.errorMessage(error)}`, { nameField: true });
    } finally {
      this.stopAutoRotateMessage();
      if (processErrors.length > 0) {
        this.notifier(`Errors during munching: ${processErrors.length}`, { nameField: true });
        this.notifier(processErrors.map((e) => e.message).join(" & "), { message: true });
        logger.error("Process Errors:", processErrors);
      }
    }
  }

  static async parseFeats(this: DDBMuncher, _event: any, _target: any) {
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
      if (error instanceof Error) logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async parseBackgrounds(this: DDBMuncher, _event: any, _target: any) {
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
      if (error instanceof Error) logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async parseClasses(this: DDBMuncher, _event: any, _target: any) {
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
      if (error instanceof Error) logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async parseSpecies(this: DDBMuncher, _event: any, _target: any) {
    if (!this.characterId) {
      ui.notifications.error("You must enter a valid D&D Beyond character URL to import species.");
      return;
    }
    try {
      logger.info("Munching species!");
      this._disableButtons();
      await this._parseWithMule("species");
      this.notifier(`Finished importing species!`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async generateAdventureConfig(this: DDBMuncher, _event: any, _target: any) {
    try {
      logger.info("Generating adventure config!");
      await downloadAdventureConfig();
      this.notifier(`Downloading config file`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) logger.error(error.stack);
    }
  }

  static async importAdventure(this: DDBMuncher, _event: any, _target: any) {
    try {
      logger.info("Generating adventure config!");
      this._disableButtons();

      const importFile = this.element.querySelector<HTMLInputElement>(`#munch-adventure-file`)?.files?.[0];
      if (!importFile) {
        throw new Error("No adventure file selected");
      }

      const adventureMuncher = new AdventureMunch({
        importFile,
        notifierV2: this.notifierV2.bind(this),
      });

      await adventureMuncher.importAdventure();

    } catch (error) {
      logger.error(error);
      if (error instanceof Error) logger.error(error.stack);
    } finally {
      this.notifierV2({ progress: { current: 1, total: 1 }, message: "", progressBar: "primary", clear: true });
      this._enableButtons();
    }
  }

  static async importThirdParty(this: DDBMuncher, _event: any, _target: any) {
    new ThirdPartyMunch().render(true);
  }

  static async openMapBrowser(this: DDBMuncher, _event: any, _target: any) {
    new DDBMapBrowser().render({ force: true });
  }

  static async openStickerBrowser(this: DDBMuncher, _event: any, _target: any) {
    new DDBStickerBrowser().render({ force: true });
  }

  static async openAdventureBrowser(this: DDBMuncher, _event: any, _target: any) {
    new DDBAdventureBrowser().render({ force: true });
  }

  static async updateWorldMonsters(this: DDBMuncher, _event: any, _target: any) {
    try {
      logger.info("Updating world monsters!");
      this._disableButtons();
      await updateWorldMonsters();
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async selectiveUpdateWorldMonsters(_event: any, _target: any) {
    new DDBSelectiveMonsterUpdate().render({ force: true });
  }

  static async migrateCompendiumFolders(this: DDBMuncher, _event: any, target: any) {
    let type = null as TCompendiumTypes | null;
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
      this.notifier(`Migrating complete.`, true as unknown as NotifierV1Props);
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async resetCompendiumActorImages(this: DDBMuncher, _event: any, _target: any) {
    try {
      logger.info("Resetting compendium actor images");
      this._disableButtons();
      const results = await resetCompendiumActorImages();
      const notifyString = `Reset ${results.length} compendium actors.`;
      this.notifier(notifyString, { nameField: true });
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async addItemPrices(this: DDBMuncher, _event: any, _target: any) {
    try {
      logger.info("Checking to see if items need prices...");
      this._disableButtons();
      const results = await updateItemPrices();
      const notifyString = `Added ${results.length} prices to items.`;
      this.notifier(notifyString, { nameField: true });
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  resetEncounter() {
    // encounter elements are only present when the encounter tab has rendered
    const setHtml = (selector: string, html: string) => {
      const element = this.element.querySelector(selector);
      if (element) element.innerHTML = html;
    };

    setHtml("#ddb-encounter-name", `<p id="ddb-encounter-name"><i class='fas fa-question'></i> <b>Encounter:</b></p>`);
    setHtml("#ddb-encounter-summary", `<p id="ddb-encounter-summary"><i class='fas fa-question'></i> <b>Summary:</b></p>`);
    setHtml("#ddb-encounter-characters", `<p id="ddb-encounter-characters"><i class='fas fa-question'></i> <b>Characters:</b></p>`);
    setHtml("#ddb-encounter-monsters", `<p id="ddb-encounter-monsters"><i class='fas fa-question'></i> <b>Monsters:</b></p>`);
    setHtml("#ddb-encounter-difficulty", `<p id="ddb-encounter-difficulty"><i class='fas fa-question'></i> <b>Difficulty:</b></p>`);
    setHtml("#ddb-encounter-rewards", `<p id="ddb-encounter-rewards"><i class='fas fa-question'></i> <b>Rewards:</b></p>`);
    setHtml("#ddb-encounter-progress", `<p id="ddb-encounter-progress"><i class='fas fa-question'></i> <b>In Progress:</b></p>`);

    const importButton = this.element.querySelector<HTMLButtonElement>("#encounter-button");
    if (importButton) {
      importButton.disabled = true;
      importButton.innerText = "Import Encounter";
    }

    // $("#ddb-importer-encounters").css("height", "auto");
    const useDDBSave = this.element.querySelector<HTMLInputElement>("#encounter-import-policy-use-ddb-save");
    if (useDDBSave) useDDBSave.disabled = true;

    this.encounterFactory.resetEncounters();
  }

  static async importEncounter(this: DDBMuncher, _event: any, _target: any) {

    const imgSelect = this.element.querySelector<HTMLSelectElement>("#encounter-scene-img-select");
    const sceneSelect = this.element.querySelector<HTMLSelectElement>("#encounter-scene-select");
    const encounterSelect = this.element.querySelector<HTMLSelectElement>("#encounter-select");
    if (!imgSelect || !sceneSelect || !encounterSelect) {
      logger.warn("DDBMuncher: encounter import selectors missing, aborting import");
      return;
    }
    const img = imgSelect.value;
    const sceneId = sceneSelect.value;
    const id = encounterSelect.value;

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
      const campaignFluff = this.encounter.campaign?.name && this.encounter.campaign.name.trim() !== ""
        ? ` of ${this.encounter.name}`
        : "";
      ui.notifications.warn(`Prepare to battle heroes${campaignFluff}, your doom awaits in ${this.encounter.name}!`);

      this.notifier("Encounter munched!", { nameField: true });
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) logger.error(error.stack);
    } finally {
      this._enableButtons();
    }

  }

  static openDebug(this: DDBMuncher, _event: any, _target: any) {
    new DDBDebugger({ actor: this.actor }).render({ force: true });
  }

  static openCoreSetup(this: DDBMuncher, _event: any, _target: any) {
    new DDBSetup({ callMuncher: true }).render({ force: true });
  }

  static openSourcePruner(this: DDBMuncher, _event: any, _target: any) {
    new DDBSourcePruner().render({ force: true });
  }

  static async regenerateStorage(this: DDBMuncher, _event: any, _target: any) {
    await DDBImporter.createStorage();
  }

  getCharacterId(URL: string) {
    const characterId = DDBCharacter.getCharacterId(URL);
    this.muleURL = URL;
    this.characterId = characterId;
  }

  async #handleURLUpdate(this: DDBMuncher, event: any) {
    const URL = event.currentTarget.value;
    this.getCharacterId(URL);

    const status = this.element.querySelector<HTMLElement>(".ddb-muncher .dndbeyond-url-status i");
    if (!status) return;

    if (URL === "") {
      status.classList.remove("fa-exclamation-triangle");
      status.classList.remove("fa-check-circle");
      status.classList.remove("fas");
      status.style.color = "";
    } else if (this.characterId) {
      status.classList.add("fas");
      status.classList.remove("fa-exclamation-triangle");
      status.classList.add("fa-check-circle");
      status.style.color = "green";
      await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-url", URL);
    } else {
      this.notifier("URL format incorrect", { message: "That seems not to be the URL we expected...", isError: true });
      status.classList.add("fa-exclamation-triangle");
      status.classList.remove("fa-check-circle");
      status.style.color = "red";
    }
  }

}

