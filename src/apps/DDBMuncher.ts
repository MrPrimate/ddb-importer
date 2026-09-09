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


interface IDDBMuncherContext extends
  DeepPartial<foundry.applications.api.Application.RenderContext>,
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
  rulesVersion: "2014" | "2024";
  otherRulesVersion: "2014" | "2024";
  classFilterEnabled: boolean;
  classMunchEnabled: boolean;

  // explicit assignments in _prepareContext
  searchTermMonster: string;
  searchTermItem: string;
  searchTermSpell: string;
  muleURL: string;
  characterId: string | null;
  useCharacterHomebrew: boolean;
  onlyCharacterHomebrew: boolean;
}

import DDBCookie from "./DDBCookie";
import DDBMuncherLoader, { DDBMuncherLoadCancelled } from "./DDBMuncherLoader";
import DDBSourceBookBrowser from "./DDBSourceBookBrowser";
import SourceSelectionPreview from "./lib/SourceSelectionPreview";


/**
 * Disable every munch/import start button in the muncher window.
 * Kept outside the class so it can run from a render as well as from a munch start: a re-render
 * mid-munch rebuilds the DOM with live buttons, and a second click then runs a second munch
 * concurrently against the same compendiums.
 */
function disableMunchButtons(element: HTMLElement): void {
  const buttonSelectors = [
    "button[id^=\"adventure-config-start\"]",
    "button[id^=\"munch-\"]",
  ];
  for (const selector of buttonSelectors) {
    for (const button of element.querySelectorAll<HTMLButtonElement>(selector)) {
      button.disabled = true;
    }
  }
}

export default class DDBMuncher extends DDBAppV2 {

  processErrors = [];

  // hover preview for the Source Selection buttons, built on first render and torn down on close
  #sourcePreview: SourceSelectionPreview | null = null;

  // a munch is between _disableButtons and _enableButtons; held here rather than read back off the
  // buttons because a re-render replaces them with live ones
  munching = false;
  detailsOpen = false;
  preMunchHeight: number | "auto" | null = null;
  subClassMap = {};
  // caption for the overall (third) progress bar per mule munch type
  static MULE_OVERALL_LABELS: Record<string, string> = {
    feat: "Feats",
    background: "Backgrounds",
    species: "Species",
    class: "Classes",
  };

  // Overall (third) progress bar state for mule runs, which span many
  // DDBMuleHandler invocations. The handler drives the primary and secondary
  // bars per invocation; this tracks the whole run across all sources.
  #muleOverall = { label: "", current: 0, total: 0 };

  homebrewClasses = new Set();
  encounterId = null;
  encounter = null;
  searchTermMonster = "";
  searchTermItem = "";
  searchTermSpell = "";
  muleURL = "";
  characterId = null;
  actor: Actor.Implementation | null = null;
  encounterFactory: DDBEncounterFactory;

  // the loading dialog reporting first-render progress; null once the window is up, so the
  // re-renders that setting changes trigger report nothing
  loader: DDBMuncherLoader | null = null;

  // steps reported to the loader: cookie check, Patreon check, then the four _prepareContext blocks
  static LOAD_STEPS = 6;

  // the open() in flight, so a second click while loading joins it rather than starting another
  static #opening: Promise<DDBMuncher | null> | null = null;


  constructor({ loader = null }: { loader?: DDBMuncherLoader | null } = {}) {
    super();
    this.loader = loader;
    this.encounterFactory = new DDBEncounterFactory({
      notifier: this.notifier.bind(this),
    });

    const URL = utils.getSetting<string>("munching-policy-character-url");
    this.getCharacterId(URL);
  }

  /**
   * Open the muncher behind a loading dialog. Runs the cookie and Patreon checks, then the first
   * render, reporting each step to the dialog; a cancel from the dialog stops the sequence before
   * the window exists. An already-open muncher is brought to the front instead, and a call made
   * while one is loading joins that load.
   * @returns {Promise<DDBMuncher | null>}  The open muncher, or null when the sequence stopped
   *                                        (cancelled, failed a check, or errored).
   */
  static async open(): Promise<DDBMuncher | null> {
    const existing = foundry.applications.instances.get(DDBMuncher.DEFAULT_OPTIONS.id);
    if (existing instanceof DDBMuncher && existing.rendered) {
      existing.bringToFront();
      return existing;
    }
    if (DDBMuncher.#opening) return DDBMuncher.#opening;
    DDBMuncher.#opening = DDBMuncher.#openWithLoader().finally(() => {
      DDBMuncher.#opening = null;
    });
    return DDBMuncher.#opening;
  }

  static async #openWithLoader(): Promise<DDBMuncher | null> {
    const loader = await DDBMuncherLoader.open(DDBMuncher.LOAD_STEPS);
    try {
      loader.step("Checking your D&D Beyond cookie...");
      const cobaltStatus = await Secrets.checkCobalt();
      loader.checkCancelled();
      if (!cobaltStatus.success) {
        new DDBCookie({ callMuncher: true }).render(true);
        return null;
      }

      loader.step("Checking your Patreon key...");
      // opens the key change dialog itself (with callMuncher) when the key is bad
      const validKey = await PatreonHelper.isValidKey();
      loader.checkCancelled();
      if (!validKey) return null;

      const muncher = new DDBMuncher({ loader });
      // rejects with DDBMuncherLoadCancelled if the user cancels during _prepareContext
      await muncher.render({ force: true });
      muncher.loader = null;
      return muncher;
    } catch (err) {
      if (err instanceof DDBMuncherLoadCancelled) {
        logger.debug("DDB Muncher load cancelled");
        return null;
      }
      logger.error("DDB Muncher failed to open", err);
      ui.notifications.error("DDB Muncher failed to open, see the console for details.");
      return null;
    } finally {
      // a no-op when Cancel or the window close already removed it
      await loader.close();
    }
  }

  /**
   * Report a first-render step to the loading dialog, stopping the render if the user cancelled.
   * @param {string} message  What the next await is waiting on.
   */
  #loadStep(message: string): void {
    if (!this.loader) return;
    this.loader.checkCancelled();
    this.loader.step(message);
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
      openSourceBookBrowser: DDBMuncher.openSourceBookBrowser,
      closeDetails: DDBMuncher.closeDetails,
      toggleSourceBookView: DDBMuncher.toggleSourceBookView,
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
        "modules/ddb-importer/handlebars/muncher/munch/maps.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/encounters.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/characters.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/characters/settings.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/characters/feat.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/characters/backgrounds.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/characters/species.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/characters/class.hbs",
        "modules/ddb-importer/handlebars/muncher/munch/source-selection.hbs",
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
        ".tab.active[data-tab=\"monsters\"], .tab.active[data-tab=\"characters\"]",
      );
      munch.classList.toggle("nested-tabs", !!hasNested);
    }
    super._toggleNestedTabs();
  }

  /* -------------------------------------------- */
  /*  Life-Cycle Handlers                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  _onClose(options) {
    super._onClose(options);
    this.#sourcePreview?.destroy();
    this.#sourcePreview = null;
  }

  /** Preserve the live progress and completion summary through a direct render. */
  _preSyncPartState(partId, newElement, priorElement, state) {
    super._preSyncPartState(partId, newElement, priorElement, state);
    if (partId === "details" && this.detailsOpen) {
      newElement.innerHTML = priorElement.innerHTML;
      newElement.classList.remove("munching-details-hidden");
    }
  }

  /** @inheritDoc */
  async _onRender(context: IDDBMuncherContext, options: foundry.applications.api.Application.RenderOptions) {
    await super._onRender(context, options);

    // a re-render mid-munch must not hand back live start buttons while the previous run is still
    // writing to the compendiums
    if (this.munching || this.detailsOpen) {
      disableMunchButtons(this.element);
      if (!this.munching) {
        const okayButton = this.element.querySelector<HTMLButtonElement>("#munch-details-okay");
        if (okayButton) okayButton.disabled = false;
      }
    }

    this.#sourcePreview?.hide();
    this.#sourcePreview ??= new SourceSelectionPreview(() => MuncherSettings.getEffectiveSourceSelection());
    for (const button of this.element.querySelectorAll(".ddb-munch-sources-button")) {
      this.#sourcePreview.attach(button as HTMLElement);
    }

    // custom listeners
    // multi-selects
    this.element.querySelector("#muncher-included-source-categories")?.addEventListener("change", (event) => {
      const categoryIds = DDBMuncher.getMultiSelectValues(event);
      this.queueSettingUpdate(async () => {
        await DDBSources.updateIncludedCategories(categoryIds);
        const sourceBookBrowser = foundry.applications.instances.get(DDBSourceBookBrowser.DEFAULT_OPTIONS.id);
        if (sourceBookBrowser instanceof DDBSourceBookBrowser && sourceBookBrowser.rendered) {
          await sourceBookBrowser.render();
        }
      }, {
        key: "munching-policy-muncher-included-source-categories",
      });
    });

    this.element.querySelector("#muncher-source-select")?.addEventListener("change", async (event) => {
      await DDBSources.updateSelectedSources(DDBMuncher.getMultiSelectValues(event));
    });

    this.element.querySelector("#muncher-monster-types-select")?.addEventListener("change", async (event) => {
      await DDBSources.updateSelectedMonsterTypes(DDBMuncher.getMultiSelectValues(event));
    });

    this.element.querySelector("#muncher-class-source-select")?.addEventListener("change", async (event) => {
      const newClassIds = DDBMuncher.getMultiSelectValues(event).map((id) => parseInt(id));
      await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-classes", newClassIds);
      const currentSubclassMap = utils.getSetting<Record<string, string[]>>("munching-policy-character-subclasses") ?? {};
      const prunedSubclassMap = {};
      for (const classId of newClassIds) {
        if (currentSubclassMap[classId]) prunedSubclassMap[classId] = currentSubclassMap[classId];
      }
      await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-subclasses", prunedSubclassMap);
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
      const classes = await DDBMuleHandler.getList("class", Array.from(coreSourceIds));
      const coreClassIds = classes
        .filter((klass) => klass.sources.some((s) => coreSourceIds.has(s.sourceId)))
        .filter((klass) => {
          const is2014 = klass.sources.every((s) => DDBSources.is2014Source(s));
          return rulesVersion === "2014" ? is2014 : !is2014;
        })
        .map((klass) => parseInt(klass.id));
      const existing = utils.getSetting<string[]>("munching-policy-character-classes")
        .map((id) => parseInt(id));
      const merged = Array.from(new Set([...existing, ...coreClassIds]));
      logger.info(`Select Core Classes: selecting ${coreClassIds.length} classes for ${rulesVersion}`, { coreClassIds, merged });
      await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-classes", merged);
      await this.render();
    });

    this.element.querySelector("#muncher-class-rules-toggle")?.addEventListener("click", async (event) => {
      event.preventDefault();
      const current = utils.getSetting<string>("munching-policy-character-class-rules-version") ?? "2024";
      const next = current === "2024" ? "2014" : "2024";
      const systemIsModern = utils.getSetting<string>("rulesVersion", "dnd5e") === "modern";
      if (next === "2014" && systemIsModern) {
        const proceed = await foundry.applications.api.DialogV2.confirm({
          rejectClose: false,
          window: { title: "Rules Version Warning" },
          content: `<p>You are switching to importing 2014 classes and subclasses, but your 5e system is set to modern/2024 rules. DDB now provides 2024 versions of the 2014 subclasses. Please be warned that importing a mix of 2014/2024 subclasses into compendiums may result in odd behaviour.</p>`,
        });
        if (!proceed) return;
      }
      if (next === "2024" && !systemIsModern) {
        const proceed = await foundry.applications.api.DialogV2.confirm({
          rejectClose: false,
          window: { title: "Rules Version Warning" },
          content: `<p>You are switching to importing 2024/5.5e Classes and Subclasses, but your 5e system is set to 2014/classic. Please be warned these might not work properly in your system.</p>`,
        });
        if (!proceed) return;
      }
      await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-class-rules-version", next);
      await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-classes", []);
      await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-character-subclasses", {});
      this.subClassMap = {};
      await this.render();
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
  changeTab(tab, group, options) {
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


  async _prepareCharacterContext(context: IDDBMuncherContext): Promise<IDDBMuncherContext> {
    const characterContext = await MuncherSettings.getCharacterMuncherSettings(this);
    context = foundry.utils.mergeObject(context, characterContext);
    return context;
  }

  async _prepareContext(options): Promise<IDDBMuncherContext> {
    let context: IDDBMuncherContext = MuncherSettings.getMuncherSettings() as IDDBMuncherContext;
    context = foundry.utils.mergeObject(context, MuncherSettings.getCharacterImportSettings());
    context = foundry.utils.mergeObject(context, MuncherSettings.getEncounterSettings());
    this.#loadStep("Loading campaigns and encounters...");
    context = await this._prepareEncounterContext(context);
    this.#loadStep("Loading class and species lists...");
    context = await this._prepareCharacterContext(context);

    if (this.encounter) {
      context.encounterConfig = context.encounterConfig.map((setting) => {
        if (setting.name === "encounter-import-policy-use-ddb-save") setting.enabled = this.encounter.inProgress;
        return setting;
      });
    }
    this.#loadStep("Loading compendium indexes...");
    context = foundry.utils.mergeObject(await super._prepareContext(options), context, { inplace: false });
    this.#loadStep("Building the muncher window...");
    context.searchTermMonster = this.searchTermMonster;
    context.searchTermItem = this.searchTermItem;
    context.searchTermSpell = this.searchTermSpell;
    context.muleURL = this.muleURL;
    context.characterId = this.characterId;
    context.useCharacterHomebrew = utils.getSetting<boolean>("munching-policy-character-fetch-homebrew");
    context.onlyCharacterHomebrew = utils.getSetting<boolean>("munching-policy-character-only-homebrew");
    logger.debug("Muncher: _prepareContext", context);
    return context;
  }

  /** @override */

  async _preparePartContext(partId, context) {
    switch (partId) {
      default: {
        context.tab = context.tabs[partId];
        break;
      }
    };
    return context;
  }


  /** A munch is running: its buttons are disabled and its progress overlay is showing. */
  get isMunching(): boolean {
    return this.munching;
  }

  /**
   * A render replaces the part's DOM, which takes the progress overlay with it while the import
   * carries on underneath. Renders queued behind setting writes (a checkbox, a category change
   * from the source selection window) therefore wait until the completion details are dismissed.
   */
  protected canRunQueuedRender(): boolean {
    if (this.isMunching || this.detailsOpen) return false;
    return super.canRunQueuedRender();
  }

  _disableButtons() {
    this.munching = true;
    this.detailsOpen = true;
    disableMunchButtons(this.element);
    const progressElement = this.element.querySelector(".ddb-overlay");
    if (progressElement) progressElement.classList.remove("munching-invalid");
    // a previous run's status text and bar positions are still in the pane, and rows this
    // run never writes to would keep showing them
    this.clearDetails();
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
    this.munching = false;
    this.stopAutoRotateMessage();
    this.clearProgressBars();
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
    this.clearDetails();
    this._restoreAfterDetails();
    this.detailsOpen = false;
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
      ".ddb-munch-sources-button",
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

  static async parseMonsters(this: DDBMuncher, _event, _target) {
    try {
      logger.info("Munching monsters!");
      this._disableButtons();
      await this.awaitSettingUpdates();
      const monsterFactory = new DDBMonsterFactory({
        notifier: this.notifier.bind(this),
        notifierV2: this.notifierV2.bind(this),
      });
      const result = await monsterFactory.processIntoCompendium(null, this.searchTermMonster);
      this.notifier(`Finished importing ${result} monsters!`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
      const message = `Monster import failed: ${utils.errorMessage(error)}`;
      ui.notifications.error(message);
      this.notifier(message, { nameField: true });
    } finally {
      this._enableButtons();
    }
  }

  static async parseVehicles(this: DDBMuncher, _event, _target) {
    try {
      logger.info("Munching vehicles!");
      this._disableButtons();
      await this.awaitSettingUpdates();
      const vehicleFactory = new DDBVehicleFactory({
        notifier: this.notifier.bind(this),
        notifierV2: this.notifierV2.bind(this),
      });
      const result = await vehicleFactory.processIntoCompendium(null, this.searchTermMonster);
      this.notifier(`Finished importing ${result} vehicles!`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
      const message = `Vehicle import failed: ${utils.errorMessage(error)}`;
      ui.notifications.error(message);
      this.notifier(message, { nameField: true });
    } finally {
      this._enableButtons();
    }
  }

  static async parseSpells(this: DDBMuncher, _event, _target) {
    try {
      logger.info("Munching spells!");
      this._disableButtons();
      await this.awaitSettingUpdates();
      await parseSpells({
        notifier: this.notifier.bind(this),
        notifierV2: this.notifierV2.bind(this),
        searchFilter: this.searchTermSpell,
      });
      this.notifier(`Finished importing spells!`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
      const message = `Spell import failed: ${utils.errorMessage(error)}`;
      ui.notifications.error(message);
      this.notifier(message, { nameField: true });
    } finally {
      this._enableButtons();
    }
  }


  static async parseItems(this: DDBMuncher, _event, _target) {
    try {
      logger.info("Munching items!");
      this._disableButtons();
      await this.awaitSettingUpdates();
      await DDBItemsImporter.fetchAndImportItems({
        notifier: this.notifier.bind(this),
        notifierV2: this.notifierV2.bind(this),
        searchFilter: this.searchTermItem,
      });
      this.notifier(`Finished importing items!`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
      const message = `Item import failed: ${utils.errorMessage(error)}`;
      ui.notifications.error(message);
      this.notifier(message, { nameField: true });
    } finally {
      this._enableButtons();
    }
  }


  static async parseFrames(this: DDBMuncher, _event, _target) {
    try {
      logger.info("Munching frames!");
      this._disableButtons();
      await this.awaitSettingUpdates();
      const result = await DDBFrameImporter.parseFrames(this.notifierV2.bind(this));
      this.notifierV2({
        section: "name",
        message: `Finished importing ${result} frames!`,
        progress: { current: result, total: result },
        clear: true,
      });
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
      const message = `Frame import failed: ${utils.errorMessage(error)}`;
      ui.notifications.error(message);
      this.notifier(message, { nameField: true });
    } finally {
      this._enableButtons();
    }
  }

  #startMuleOverallProgress(label: string, total: number) {
    this.#muleOverall = { label, current: 0, total };
    this.#notifyMuleOverallProgress();
  }

  // homebrew work is only sized after the subclass maps load, so the total can grow mid-run
  #addMuleOverallProgressTotal(count: number) {
    this.#muleOverall.total += count;
    this.#notifyMuleOverallProgress();
  }

  #advanceMuleOverallProgress(detail = "") {
    this.#muleOverall.current = Math.min(this.#muleOverall.current + 1, this.#muleOverall.total);
    this.#notifyMuleOverallProgress(detail);
  }

  #notifyMuleOverallProgress(detail = "") {
    const { label, current, total } = this.#muleOverall;
    if (total <= 0) return;
    this.notifierV2({
      progress: { current, total },
      section: "overall",
      message: detail ? `${label}: ${detail}` : label,
      progressBar: "overall",
      suppress: true,
    });
  }

  async #processClassMunching(options) {
    const muleHandler = new DDBMuleHandler(options);

    try {
      await muleHandler.process();

      logger.debug(`Mule processed`, {
        muleHandler,
        options: foundry.utils.deepClone(options),
      });
    } catch (error) {
      this.processErrors.push({
        error: error.message,
        isHomebrew: options.homebrew,
        classId: options.classId,
        message: `Class Mule failure see error messages for details`,
      });
      throw error;
    }
  }

  async #parseHomebrewClassesWithMule({ baseOptions, classList } = {}) {
    logger.info(`Processing ${this.homebrewClasses.size} classes with homebrew subclasses`, {
      homebrewClasses: Array.from(this.homebrewClasses),
    });
    const sliceSize = 3;
    const homebrewChunkCount = Array.from(this.homebrewClasses).reduce<number>((count, classId) => {
      const subClasses = this.subClassMap[String(classId)] ?? [];
      return count + Math.ceil(subClasses.filter((subKlass) => subKlass.isHomebrew).length / sliceSize);
    }, 0);
    this.#addMuleOverallProgressTotal(homebrewChunkCount);
    const options = foundry.utils.deepClone(baseOptions);
    for (const classId of this.homebrewClasses) {
      const klass = classList.find((c) => c.id === classId);
      const version = klass.sources.every((s) => DDBSources.is2014Source(s)) ? "2014" : "2024";
      logger.debug("Munching homebrew subclasses for class", {
        classId,
        klass,
        homebrewClasses: Array.from(this.homebrewClasses),
        classList,
        version,
      });
      options.homebrew = true;
      options.onlyHomebrew = true;
      options.classId = klass.id;
      this.autoRotateMessage("class", klass.name.toLowerCase());
      logger.info(`Munching class ${klass.name} (${klass.id}) Homebrew subclasses`);

      const subClasses = this.subClassMap[klass.id]
        .filter((subKlass) => subKlass.isHomebrew);

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
          logger.error(error.stack);
          this.processErrors.push({
            className: klass.name,
            classId: klass.id,
            filterIds,
            category: "Homebrew",
            error: error.message,
            message: `Class ${klass.name} (${klass.id} from ${i}-${i + filterIds.length}) for homebrew subclasses`,
          });
        }
        this.#advanceMuleOverallProgress(`${klass.name} (Homebrew)`);
      }
    }
  }

  async #parseOfficialClassesWithMule({ sourceIdArrays, baseOptions, classList, subclassSelections } = {}) {
    for (const sourceIdArray of sourceIdArrays) {
      const category = CONFIG.DDB.sourceCategories.find((c) => c.id === sourceIdArray.categoryId);
      const options = foundry.utils.deepClone(baseOptions);

      for (const klass of classList) {
        this.autoRotateMessage("class", klass.name.toLowerCase());
        logger.info(`Munching class ${klass.name} (${klass.id}) in ${category?.name ?? sourceIdArray.categoryId}`);
        options.classId = klass.id;
        const selections = subclassSelections ?? {};
        const selectedSubIds = (selections[klass.id] ?? selections[String(klass.id)] ?? [])
          .map((id) => parseInt(id));
        options.filterIds = selectedSubIds;

        const version = klass.sources.every((s) => DDBSources.is2014Source(s)) ? "2014" : "2024";
        const subClasses = this.subClassMap[klass.id];
        const subClassSources = new Set(subClasses.map((subKlass) => subKlass.sources.map((s) => s.sourceId)).flat());
        const sources = foundry.utils.deepClone(sourceIdArray.sourceIds)
          .filter((sourceId) => subClassSources.has(sourceId));

        if (sources.length === 0) {
          logger.info(`No subclasses in selected sources for class ${klass.name} (${klass.id} - ${version}) in ${category?.name ?? sourceIdArray.categoryId}, skipping`, {
            sources,
            subClassSources,
            allowHomebrew: options.allowHomebrew,
            onlyHomebrew: options.onlyHomebrew,
            homebrewClasses: this.homebrewClasses,
            subClasses,
            subClassMap: this.subClassMap,
            version,
            klass,
            originalSources: sourceIdArray.sourceIds,
          });
          this.#advanceMuleOverallProgress(`${klass.name} (${category?.name ?? sourceIdArray.categoryId}, skipped)`);
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
          logger.error(error.stack);
          this.processErrors.push({
            className: klass.name,
            classId: klass.id,
            category: category?.name ?? sourceIdArray.categoryId,
            error: error.message,
            message: `Class ${klass.name} (${klass.id}) in ${category?.name ?? sourceIdArray.categoryId}`,
          });
        }
        this.#advanceMuleOverallProgress(`${klass.name} (${category?.name ?? sourceIdArray.categoryId})`);
      }
    }
  }


  async _parseClassesWithMule() {
    this.autoRotateMessage("class");
    // prepare sources to munch from
    const allowHomebrew = utils.getSetting<boolean>("munching-policy-character-fetch-homebrew");
    const onlyHomebrew = utils.getSetting<boolean>("munching-policy-character-only-homebrew");
    const baseOptions = {
      characterId: this.characterId,
      homebrew: false,
      onlyHomebrew: false,
      type: "class",
      ddbMuncher: this,
    };
    const sourceIdArrays = DDBSources.getChosenCategoriesAndBooks();

    const allowedClassIds = utils.getSetting<string[]>("munching-policy-character-classes")
      .map((id) => parseInt(id));

    if (allowedClassIds.length === 0) {
      this.notifier("Select at least one class to munch.", { nameField: true });
      this.stopAutoRotateMessage();
      return;
    }

    const subclassSelections = utils.getSetting<Record<string, string[]>>("munching-policy-character-subclasses") ?? {};

    const allSourceIds = sourceIdArrays.reduce((acc, curr) => {
      for (const sourceId of curr.sourceIds) {
        acc.add(sourceId);
      }
      return acc;
    }, new Set([1, 2, 148, 145]));

    // determine classes to parse
    const classList = (await DDBMuleHandler.getList("class", Array.from(allSourceIds)))
      .filter((c) => allowedClassIds.includes(parseInt(c.id)));

    logger.info(`Found ${classList.length} classes to munch`, {
      classList,
      allSourceIds,
      allowedClassIds,
      baseOptions,
    });

    this.processErrors = [];
    // reset homebrew tracking; keep subclass cache populated during render
    this.homebrewClasses = new Set();
    this.#startMuleOverallProgress(
      DDBMuncher.MULE_OVERALL_LABELS.class,
      onlyHomebrew ? 0 : sourceIdArrays.length * classList.length,
    );

    try {
      // determine campaign id for the character to fetch appropriate subclass list
      const slimData = await DDBMuleHandler.getSlimCharacters([this.characterId]);
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
        await this.#parseOfficialClassesWithMule({ sourceIdArrays, baseOptions, classList, subclassSelections });
      }

      if (allowHomebrew && this.homebrewClasses.size > 0) {
        await this.#parseHomebrewClassesWithMule({ baseOptions, classList });
      }
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
      this.notifier(`Error during munching: ${error.message}`, { nameField: true });
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

  async _parseWithMule(type) {
    this.autoRotateMessage(type);
    const homebrew = utils.getSetting<boolean>("munching-policy-character-fetch-homebrew");
    const onlyHomebrew = utils.getSetting<boolean>("munching-policy-character-only-homebrew");
    const baseOptions = {
      characterId: this.characterId,
      homebrew: false,
      onlyHomebrew: false,
      type,
      ddbMuncher: this,
    };
    const sourceIdArrays = DDBSources.getChosenCategoriesAndBooks();

    const processErrors = [];
    // This branch imports source books in chunks, so count each chunk as one unit.
    const sliceSize = type === "species" ? 5 : 10;
    const plannedChunks = onlyHomebrew ? 0 : sourceIdArrays.reduce(
      (count, group) => count + Math.ceil(group.sourceIds.length / sliceSize), 0,
    );
    this.#startMuleOverallProgress(
      DDBMuncher.MULE_OVERALL_LABELS[type],
      plannedChunks + (homebrew || onlyHomebrew ? 1 : 0),
    );

    try {
      for (const sourceIdArray of sourceIdArrays) {
        if (onlyHomebrew) continue;
        const category = CONFIG.DDB.sourceCategories.find((c) => c.id === sourceIdArray.categoryId);
        const options = foundry.utils.deepClone(baseOptions);

        for (let i = 0; i < sourceIdArray.sourceIds.length; i += sliceSize) {
          const chunkedIds = sourceIdArray.sourceIds.slice(i, i + sliceSize);

          options.sources = chunkedIds;
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
            logger.error(error.stack);
            processErrors.push({
              type,
              category: category?.name ?? sourceIdArray.categoryId,
              error: error.message,
              chunkedIds,
              message: `${type} in ${category?.name ?? sourceIdArray.categoryId}, with sourceIds ${chunkedIds.join(", ")}`,
            });
          }
          this.#advanceMuleOverallProgress(`${category?.name ?? sourceIdArray.categoryId}: sources ${i + 1}-${i + chunkedIds.length}`);
        }

        logger.debug(`Munch Complete for ${type} in ${category?.name ?? sourceIdArray.categoryId}`, {
          sourceIdArray,
          options: foundry.utils.deepClone(options),
        });

      }

      if (homebrew || onlyHomebrew) {
        const options = foundry.utils.deepClone(baseOptions);
        options.homebrew = true;
        options.onlyHomebrew = onlyHomebrew;
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
          logger.error(error.stack);
          processErrors.push({
            type,
            category: "Homebrew",
            error: error.message,
            message: `${type} in Homebrew`,
          });
        }
        this.#advanceMuleOverallProgress("Homebrew");
      }
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
      this.notifier(`Error during munching: ${error.message}`, { nameField: true });
    } finally {
      this.stopAutoRotateMessage();
      if (processErrors.length > 0) {
        this.notifier(`Errors during munching: ${processErrors.length}`, { nameField: true });
        this.notifier(processErrors.map((e) => e.message).join(" & "), { message: true });
        logger.error("Process Errors:", processErrors);
      }
    }
  }

  static async parseFeats(this: DDBMuncher, _event, _target) {
    if (!this.characterId) {
      ui.notifications.error("You must enter a valid D&D Beyond character URL to import feats.");
      return;
    }
    try {
      logger.info("Munching feats!");
      this._disableButtons();
      await this.awaitSettingUpdates();
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

  static async parseBackgrounds(this: DDBMuncher, _event, _target) {
    if (!this.characterId) {
      ui.notifications.error("You must enter a valid D&D Beyond character URL to import backgrounds.");
      return;
    }
    try {
      logger.info("Munching backgrounds!");
      this._disableButtons();
      await this.awaitSettingUpdates();
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

  static async parseClasses(this: DDBMuncher, _event, _target) {
    if (!this.characterId) {
      ui.notifications.error("You must enter a valid D&D Beyond character URL to import classes.");
      return;
    }
    try {
      logger.info("Munching classes!");
      this._disableButtons();
      await this.awaitSettingUpdates();
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

  static async parseSpecies(this: DDBMuncher, _event, _target) {
    if (!this.characterId) {
      ui.notifications.error("You must enter a valid D&D Beyond character URL to import species.");
      return;
    }
    try {
      logger.info("Munching species!");
      this._disableButtons();
      await this.awaitSettingUpdates();
      await this._parseWithMule("species");
      this.notifier(`Finished importing species!`, { nameField: true });
      this.notifier("");
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async generateAdventureConfig(this: DDBMuncher, _event, _target) {
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

  static async importAdventure(this: DDBMuncher, _event, _target) {
    const progressElement = this.element.querySelector(".import-progress");
    try {
      logger.info("Generating adventure config!");
      this._disableButtons();
      await this.awaitSettingUpdates();
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

  static async importThirdParty(this: DDBMuncher, _event, _target) {
    new ThirdPartyMunch().render(true);
  }

  static async openMapBrowser(this: DDBMuncher, _event, _target) {
    new DDBMapBrowser().render(true);
  }

  static async openStickerBrowser(this: DDBMuncher, _event, _target) {
    new DDBStickerBrowser().render(true);
  }

  static async updateWorldMonsters(this: DDBMuncher, _event, _target) {
    try {
      logger.info("Updating world monsters!");
      this._disableButtons();
      await this.awaitSettingUpdates();
      await updateWorldMonsters();
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }
  }

  static async selectiveUpdateWorldMonsters(_event, _target) {
    new DDBSelectiveMonsterUpdate().render(true);
  }

  static async migrateCompendiumFolders(this: DDBMuncher, _event, target) {
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
      await this.awaitSettingUpdates();
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

  static async resetCompendiumActorImages(this: DDBMuncher, _event, _target) {
    try {
      logger.info("Resetting compendium actor images");
      this._disableButtons();
      await this.awaitSettingUpdates();
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

  static async addItemPrices(this: DDBMuncher, _event, _target) {
    try {
      logger.info("Checking to see if items need prices...");
      this._disableButtons();
      await this.awaitSettingUpdates();
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

  static async importEncounter(this: DDBMuncher, _event, _target) {

    const img = (this.element.querySelector("#encounter-scene-img-select") as HTMLSelectElement).value;
    const sceneId = (this.element.querySelector("#encounter-scene-select") as HTMLSelectElement).value;
    const id = (this.element.querySelector("#encounter-select") as HTMLSelectElement).value;

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
      await this.awaitSettingUpdates();
      await this.encounterFactory.importEncounter(id, { img, sceneId });
      // the factory holds no `data`; the parsed encounter for the selected id is cached on the app by _prepareEncounterContext
      const campaignFluff = this.encounter?.campaign?.name && this.encounter.campaign.name.trim() !== ""
        ? ` of ${this.encounter.name}`
        : "";
      ui.notifications.warn(`Prepare to battle heroes${campaignFluff}, your doom awaits in ${this.encounter?.name ?? "the encounter"}!`);

      this.notifier("Encounter munched!", { nameField: true });
    } catch (error) {
      logger.error(error);
      logger.error(error.stack);
    } finally {
      this._enableButtons();
    }

  }

  static openDebug(this: DDBMuncher, _event, _target) {
    new DDBDebugger({ actor: this.actor }).render(true);
  }

  static async openSourceBookBrowser(this: DDBMuncher, _event: Event, _target: HTMLElement): Promise<void> {
    await DDBSourceBookBrowser.open({
      // the muncher is resolved when the write happens rather than captured here: this window may
      // have been closed and reopened by then, and queueing against the dead instance would leave
      // the live one showing categories it no longer has
      queueCategoryUpdate: async (update) => {
        const muncher = foundry.applications.instances.get(DDBMuncher.DEFAULT_OPTIONS.id);
        if (!(muncher instanceof DDBMuncher) || !muncher.rendered) return false;
        // sharing the muncher's queue keeps both windows' writes to this setting in one order
        await muncher.queueSettingUpdate(update, {
          key: "munching-policy-muncher-included-source-categories",
        });
        return true;
      },
    });
  }

  static async toggleSourceBookView(this: DDBMuncher, _event: Event, _target: HTMLElement): Promise<void> {
    const showCovers = utils.getSetting<boolean>("muncher-show-source-book-covers");
    await game.settings.set(SETTINGS.MODULE_ID, "muncher-show-source-book-covers", !showCovers);
    await this.render();
  }

  static openCoreSetup(this: DDBMuncher, _event, _target) {
    new DDBSetup({ callMuncher: true }).render(true);
  }

  static openSourcePruner(this: DDBMuncher, _event, _target) {
    new DDBSourcePruner().render(true);
  }

  static async regenerateStorage(this: DDBMuncher, _event, _target) {
    await DDBImporter.createStorage();
  }

  getCharacterId(URL) {
    const characterId = DDBCharacter.getCharacterId(URL);
    this.muleURL = URL;
    this.characterId = characterId;
  }

  async #handleURLUpdate(this: DDBMuncher, event) {
    const URL = event.currentTarget.value;
    this.getCharacterId(URL);

    const status = this.element.querySelector(".ddb-muncher .dndbeyond-url-status i");

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
