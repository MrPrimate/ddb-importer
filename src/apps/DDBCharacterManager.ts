import {
  logger,
  FileHelper,
  CompendiumHelper,
  MuncherSettings,
  PatreonHelper,
  Secrets,
  utils,
  DDBRunContext,
} from "../lib/_module";
import DDBCharacter from "../parser/DDBCharacter";
import { updateDDBCharacter } from "../updater/character";
import { generateCharacterExtras } from "../parser/DDBExtras";
import { SETTINGS } from "../config/_module";
import DDBCookie from "../apps/DDBCookie";
import DDBAppV2 from "./DDBAppV2";
import DDBCharacterImporter from "../muncher/DDBCharacterImporter";
import DDBDebugger from "./DDBDebugger";
import DDBKeyChangeDialog from "./DDBKeyChangeDialog";
import type { DDBCharacterImportOptions } from "../parser/DDBCharacter";

export default class DDBCharacterManager extends DDBAppV2 {
  actor: TImporterActor;
  actorOriginal: I5ePCData;
  characterImporter: DDBCharacterImporter;
  ddbCharacter: DDBCharacter | null;
  private _debugContext: any;
  // assigned in _prepareContext before any render-driven read
  importSettings!: ICharacterImportSettings;
  dmSyncEnabled = false;
  playerSyncEnabled = false;
  result: Record<string, unknown>;
  settings: Record<string, unknown>;
  itemsMunched = false;
  actorSettings: Record<string, any> = {};

  constructor(actor: TImporterActor | I5ePCData, ddbCharacter: DDBCharacter | null = null) {
    super();
    const actorId = actor._id;
    if (!actorId) {
      throw new Error("DDBCharacterManager requires an actor with an id");
    }
    const worldActor = game.actors.get(actorId);
    if (!worldActor) {
      throw new Error(`DDBCharacterManager: actor "${actorId}" not found in world`);
    }
    this.actor = worldActor as TImporterActor;
    // I5ePCData is our own type definition
    this.actorOriginal = foundry.utils.duplicate(this.actor) as unknown as I5ePCData;
    logger.debug("Current Actor (Original):", this.actorOriginal);
    this.result = {};
    this.settings = {};
    this.ddbCharacter = ddbCharacter;
    this.characterImporter = new DDBCharacterImporter({
      actorId,
      ddbCharacter: this.ddbCharacter,
      notifier: this.showCurrentTask.bind(this),
    });
    this._debugContext = {};
  }

  static renderPopup(type: string, url: string) {
    if (SETTINGS.POPUPS[type] && !SETTINGS.POPUPS[type].close) {
      SETTINGS.POPUPS[type].focus();
      SETTINGS.POPUPS[type].location.href = url;
    } else {
      const ratio = window.innerWidth / window.innerHeight;
      const width = Math.round(window.innerWidth * 0.5);
      const height = Math.round(window.innerWidth * 0.5 * ratio);
      SETTINGS.POPUPS[type] = window.open(
        url,
        "ddb_sheet_popup",
        `resizeable,scrollbars,location=no,width=${width},height=${height},toolbar=1`,
      );
    }
    return true;
  }


  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    id: "ddb-importer-character",
    classes: ["sheet", "standard-form", "dnd5e2"],
    actions: {
      importCharacter: DDBCharacterManager.importCharacterClickEvent,
      importCompanions: DDBCharacterManager.importCompanionsClickEvent,
      updateCharacter: DDBCharacterManager.updateCharacterClickEvent,
      deleteLocalCobalt: DDBCharacterManager.deleteLocalCobaltClickEvent,
      setLocalCobalt: DDBCharacterManager.setLocalCobaltClickEvent,
      deleteLocalPatreonKey: DDBCharacterManager.deleteLocalPatreonKeyClickEvent,
      setLocalPatreonKey: DDBCharacterManager.setLocalPatreonKeyClickEvent,
      openDebug: DDBCharacterManager.openDebug,
    },
    position: {
      width: 900,
      height: "auto" as const,
    },
    window: {
      icon: "fab fa-d-and-d-beyond",
      resizable: true,
      minimizable: true,
      subtitle: "",
    },
  };

  get id() {
    return `ddb-importer-character-${this.actor.id}`;
  }

  /** @override */
  get title() {
    return `DDB Character Manager: ${this.actor.name}`;
  }


  static PARTS = {
    header: { template: "modules/ddb-importer/handlebars/character/header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    import: {
      template: "modules/ddb-importer/handlebars/character/import.hbs",
      templates: [
        "modules/ddb-importer/handlebars/character/import/main.hbs",
        "modules/ddb-importer/handlebars/character/import/options.hbs",
        "modules/ddb-importer/handlebars/character/import/sources.hbs",
        "modules/ddb-importer/handlebars/character/import/automation.hbs",
      ],
    },
    companions: { template: "modules/ddb-importer/handlebars/character/companions.hbs" },
    update: { template: "modules/ddb-importer/handlebars/character/update.hbs" },
    advanced: { template: "modules/ddb-importer/handlebars/character/advanced.hbs" },
    help: { template: "modules/ddb-importer/handlebars/character/help.hbs" },
    details: { template: "modules/ddb-importer/handlebars/character/details.hbs" },
    footer: { template: "modules/ddb-importer/handlebars/character/footer.hbs" },
  };

  /** @override */
  tabGroups = {
    sheet: "import",
    import: "main",
  };


  _getTabs(): IDDBTabs {
    const tabs = this._markTabs({
      import: {
        id: "import", group: "sheet", label: "Import Character", icon: "fas fa-arrow-alt-circle-down",
        tabs: {
          main: {
            id: "main", group: "import", label: "Import", icon: "fas fa-arrow-alt-circle-down",
          },
          options: {
            id: "options", group: "import", label: "Options", icon: "fas fa-cogs",
          },
          sources: {
            id: "sources", group: "import", label: "Sources", icon: "fas fa-book",
          },
          automation: {
            id: "automation", group: "import", label: "Automation", icon: "fas fa-robot",
          },
        },
      },
      companions: {
        id: "companions", group: "sheet", label: "Import Companions", icon: "fas fa-pastafarianism",
      },
      update: {
        id: "update", group: "sheet", label: "Update D&DBeyond", icon: "fas fa-arrow-alt-circle-up",
      },
      advanced: {
        id: "advanced", group: "sheet", label: "Advanced", icon: "fas fa-cogs",
      },
      help: {
        id: "help", group: "sheet", label: "Help", icon: "fas fa-question-circle",
      },
    });
    return tabs;
  }


  /* -------------------------------------------- */
  /*  Life-Cycle Handlers                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async _onRender(context: any, options: any) {
    await super._onRender(context, options);
    // custom listeners
    // watch the change of the muncher-policy-selector checkboxes
    this.element.querySelectorAll("fieldset :is(dnd5e-checkbox)").forEach((checkbox) => {
      checkbox.addEventListener("change", async (event) => {
        const currentTarget = event.currentTarget as HTMLInputElement;
        switch (currentTarget.dataset.section) {
          case "resource-selection": {
            const updateData = { flags: { ddbimporter: { resources: { ask: currentTarget.checked } } } };
            await this.actor.update(updateData as Actor.UpdateInput);
            break;
          }
          case "dndbeyond-character-dynamic-update": {
            const activeUpdateData = { flags: { ddbimporter: { activeUpdate: currentTarget.checked } } };
            await this.actor.update(activeUpdateData as Actor.UpdateInput);
            break;
          }
          default: {
            await MuncherSettings.updateActorSettings(this.element, event);
          }
        }

        await this.render();
      });
    });

    this.element.querySelector("input[name=dndbeyond-url]")?.addEventListener("input", async (event) => {
      await this.#handleURLUpdate(event);
    });


    this.element.querySelector("#open-dndbeyond-url")?.addEventListener("click", async () => {
      try {
        const characterUrl = this.actor.flags?.ddbimporter?.dndbeyond?.url;
        if (!characterUrl) throw new Error("No D&D Beyond URL set on actor");
        DDBCharacterManager.renderPopup("json", characterUrl);
      } catch (error) {
        this.showCurrentTaskError("Error opening JSON URL", { error, supressLog: true });
      }
    });


  }

  get debugContext() {
    return this._debugContext;
  }

  set debugContext(value) {
    const clone = foundry.utils.duplicate(value);
    delete clone.actor;
    delete clone.syncConfig;
    delete clone.importConfig;
    delete clone.effectImportConfig;
    delete clone.importPolicies;
    delete clone.sourcesConfig;
    delete clone.installedModulesText;
    delete clone.compendiumSourcesConfig;
    delete clone.extrasConfig;
    delete clone.devConfig;
    delete clone.tabs;
    this._debugContext = clone;
  }

  /** @override */
  async _prepareContext(options: any) {

    // loads settings for actor
    this.importSettings = MuncherSettings.getCharacterImportSettings();
    const useLocalPatreonKey = (this.actor.flags as IActorFlagConfig)?.ddbimporter?.useLocalPatreonKey;

    const characterId = (this.actor.flags as IActorFlagConfig)?.ddbimporter?.dndbeyond?.characterId;
    this.dmSyncEnabled = Boolean(characterId && this.importSettings.tiers.all);
    this.playerSyncEnabled = Boolean(characterId && useLocalPatreonKey);
    const syncEnabled = characterId && (this.importSettings.tiers.all || useLocalPatreonKey);

    const localPatreonValid = useLocalPatreonKey
      ? (await PatreonHelper.isValidKey(true, false))
      : true;

    const trustedUsersOnly = utils.getSetting<boolean>("restrict-to-trusted");
    const allowAllSync = utils.getSetting<boolean>("allow-all-sync");
    const syncOnly = trustedUsersOnly && allowAllSync && !game.user.isTrusted;

    const localCobalt = Secrets.isLocalCobalt(this.actor.id);
    const cobaltCookie = Secrets.getCobalt(this.actor.id ?? undefined);
    const cobaltSet = localCobalt && cobaltCookie && cobaltCookie != "";

    const dynamicSync = utils.getSetting<boolean>("dynamic-sync");
    const updateUser = utils.getSetting<string>("dynamic-sync-user");
    const gmSyncUser = game.user.isGM && game.user.id == updateUser;
    const dynamicUpdateAllowed = dynamicSync && gmSyncUser && this.importSettings.tiers.experimentalMid;
    const dynamicUpdateStatus = (this.actor.flags as IActorFlagConfig)?.ddbimporter?.activeUpdate;
    const resourceSelection = !foundry.utils.hasProperty(this.actor, "flags.ddbimporter.resources.ask")
      || foundry.utils.getProperty(this.actor, "flags.ddbimporter.resources.ask") === true;

    const itemCompendium = await CompendiumHelper.getCompendiumType("item", false);
    this.itemsMunched = itemCompendium ? (await itemCompendium.index.size) !== 0 : false;

    this.actorSettings = {
      actor: this.actor,
      localCobalt: localCobalt,
      cobaltSet: cobaltSet,
      syncEnabled: syncEnabled && this.itemsMunched,
      importAllowed: !syncOnly,
      itemsMunched: this.itemsMunched,
      dynamicSync,
      updateUser,
      gmSyncUser,
      dynamicUpdateAllowed,
      dynamicUpdateStatus,
      resourceSelection,
      useLocalPatreonKey,
      useLocalPatreonKeyAndItemsMunched: useLocalPatreonKey && this.itemsMunched,
      localPatreonValid,
    };

    let context = foundry.utils.mergeObject(this.importSettings, this.actorSettings);
    const parentContext = await super._prepareContext(options);
    context = foundry.utils.mergeObject(parentContext, context, { inplace: false });
    logger.debug("DDBCharacterManager: _prepareContext", context);
    this.debugContext = foundry.utils.duplicate(context);
    return context as unknown as DDBAppV2Context;
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

  showCurrentTask(title: string, { message = null, isError = false }: { message?: string | boolean | null; isError?: boolean } = {}) {
    logger.debug("DDBCharacterManager: showCurrentTask", { title, message, isError });
    const element = $(this.element).find(".task-name");
    element.html(`<h2 ${isError ? " style='color:red'" : ""}>${title}</h2>${message ? `<p>${message}</p>` : ""}`);
    $(this.element).parent().parent().css("height", "auto");
  }

  // TODO: supressLog is here as an option for the few places that didnt call logger.error for errors before, if
  // we always want errors to log we can remove this option.
  showCurrentTaskError(title: string, { error = null, supressLog = false }: { error: unknown; supressLog?: boolean }) {
    if (!supressLog) {
      logger.error(error);
    }

    let message = "Unknown Error";
    if (error && typeof error === "object") {
      if (!supressLog && "stack" in error && error.stack) {
        logger.error(error.stack);
      }
      // NOTE: we could use instanceOf, but this allows us to handle any error-like
      // object with a 'message' attribute. Great for custom errors and errors from
      // 3rd party sources that aren't properly constructed.
      if ("message" in error && error.message && typeof error.message == "string") {
        message = error.message;
      }
    } else if (error && typeof error === "string") {
      message = error;
    }
    this.showCurrentTask(title, { message, isError: true });
  }


  // static async itemsMunched() {
  //   const itemCompendium = await CompendiumHelper.getCompendiumType("item", false);
  //   const itemsMunched = itemCompendium ? (await itemCompendium.index.size) !== 0 : false;
  //   return itemsMunched;
  // }

  /* -------------------------------------------- */

  // DOM helpers: these elements can be absent depending on the rendered tab/state
  #setText(selector: string, text: string) {
    const element = this.element.querySelector(selector);
    if (element) element.textContent = text;
  }

  #setDisabled(selector: string, disabled: boolean) {
    const element = this.element.querySelector<HTMLButtonElement | HTMLInputElement>(selector);
    if (element) element.disabled = disabled;
  }

  async #handleURLUpdate(event: any) {
    const URL = event.currentTarget.value;
    const characterId = DDBCharacter.getCharacterId(URL);

    const status = this.element.querySelector<HTMLElement>(".dndbeyond-url-status i");
    if (!status) return;

    if (URL === "") {
      status.classList.remove("fa-exclamation-triangle");
      status.classList.remove("fa-check-circle");
      status.classList.remove("fas");
      status.style.color = "";
      this.#setText("span.dndbeyond-character-id", "");
      this.#setDisabled("#dndbeyond-character-import-start", true);
      this.#setDisabled("#open-dndbeyond-url", true);
      this.showCurrentTask("URL Cleared", { message: "", isError: false });
      await this.actor.update({
        "flags.ddbimporter.dndbeyond": {
          url: URL,
          characterId,
        },
      } as unknown as Actor.UpdateInput);
    } else if (characterId) {
      status.classList.add("fas");
      status.classList.remove("fa-exclamation-triangle");
      status.classList.add("fa-check-circle");
      status.style.color = "green";
      this.#setText("span.dndbeyond-character-id", characterId);
      this.#setDisabled("#dndbeyond-character-import-start", false);
      this.#setDisabled("#open-dndbeyond-url", false);
      this.showCurrentTask("", { message: "", isError: false });

      await this.actor.update({
        "flags.ddbimporter.dndbeyond": {
          url: URL,
          characterId,
        },
      } as unknown as Actor.UpdateInput);

    } else {
      this.showCurrentTask("URL format incorrect", { message: "That seems not to be the URL we expected...", isError: true });
      status.classList.add("fa-exclamation-triangle");
      status.classList.remove("fa-check-circle");
      status.style.color = "red";
    }
  }

  async setLocalPatreonKey() {
    await this.actor.update({ flags: { ddbimporter: { useLocalPatreonKey: true } } } as Actor.UpdateInput);
    this.#setDisabled("#delete-local-patreon-key", false);
    this.#setText("#set-local-patreon-key", "Update Patreon Key");
    if (this.itemsMunched) {
      this.#setDisabled("#dndbeyond-character-update", false);
      this.#setText("#dndbeyond-character-update", "Update D&D Beyond with changes");
    } else {
      this.#setText("#dndbeyond-character-update", "Your DM needs to import D&D Beyond items and spells into the DDB compendiums first.");
    }
  }

  static async setLocalPatreonKeyClickEvent(this: DDBCharacterManager, _event: any, _target: any) {
    try {
      const existingKey = await PatreonHelper.getPatreonKey(true);
      if (!(this.actor.flags as IActorFlagConfig).ddbimporter?.useLocalPatreonKey && existingKey && existingKey !== "") {
        await this.setLocalPatreonKey();
      } else {
        new DDBKeyChangeDialog({
          local: true,
          callback: this.setLocalPatreonKey.bind(this),
        }).render({ force: true });
      }
    } catch (error) {
      this.showCurrentTaskError("Error setting local patreon key", { error });
    }
  }

  static async deleteLocalPatreonKeyClickEvent(this: DDBCharacterManager, _event: any, _target: any) {
    try {
      await PatreonHelper.setPatreonKey(null, true);
      await this.actor.update({ flags: { ddbimporter: { useLocalPatreonKey: false } } } as Actor.UpdateInput);
      this.#setDisabled("#delete-local-patreon-key", true);
      this.#setText("#set-local-patreon-key", "Add Patreon Key");
      if (!this.dmSyncEnabled) {
        this.#setDisabled("#dndbeyond-character-update", true);
        this.#setText("#dndbeyond-character-update", "D&D Beyond Update Available to Patreon Supporters");
      }
    } catch (error) {
      this.showCurrentTaskError("Error deleting local cookie", { error });
    }
  }

  static async setLocalCobaltClickEvent(this: DDBCharacterManager, _event: any, _target: any) {
    try {
      new DDBCookie({
        actor: this.actor,
        localCobalt: true,
        callback: () => {
          this.#setDisabled("#delete-local-cobalt", false);
          this.#setText("#set-local-cobalt", "Update Cobalt Cookie");
        },
      }).render(true);
    } catch (error) {
      this.showCurrentTaskError("Error setting local cookie", { error });
    }
  }

  static async deleteLocalCobaltClickEvent(this: DDBCharacterManager, _event: any, _target: any) {
    try {
      Secrets.deleteLocalCobalt(this.actor.id);
      this.#setDisabled("#delete-local-cobalt", true);
      this.#setText("#set-local-cobalt", "Add Cobalt Cookie");
    } catch (error) {
      this.showCurrentTaskError("Error deleting local cookie", { error });
    }
  }

  static async updateCharacterClickEvent(this: DDBCharacterManager, _event: any, _target: any) {
    interface ISyncResult {
      message?: string;
      success?: boolean;
    }
    try {
      this.#setDisabled("#dndbeyond-character-update", true);
      await updateDDBCharacter(this.actor as TSyncCharacterActor).then((result: (ISyncResult | ISyncResult[] | undefined)[]) => {
        const flatResults = result.flat().filter((r): r is ISyncResult => r !== undefined);
        const updateNotes = flatResults.map((r) => r.message).join(" ");
        const failures = flatResults.filter((r) => r && r.success === false);
        logger.debug(updateNotes);
        if (failures.length > 0) {
          this.showCurrentTask(`Update completed with ${failures.length} failed update(s)`, { message: updateNotes, isError: true });
        } else {
          this.showCurrentTask("Update complete", { message: updateNotes, isError: false });
        }
        this.#setDisabled("#dndbeyond-character-update", false);
      });
    } catch (error) {
      this.showCurrentTaskError("Error updating character: ", { error });
    }
  }

  static async importCompanionsClickEvent(this: DDBCharacterManager, _event: any, _target: any) {
    try {
      this.#setDisabled("#dndbeyond-character-extras-start", true);
      this.showCurrentTask("Fetching character data");
      const characterId = (this.actor.flags as IActorFlagConfig).ddbimporter?.dndbeyond?.characterId;
      if (!characterId) {
        throw new Error("No D&D Beyond character id set on actor");
      }
      const ddbCharacterOptions: DDBCharacterImportOptions = {
        currentActor: this.actor,
        characterId,
        selectResources: false,
      };
      const getOptions = {
        syncId: null as string | null,
        localCobaltPostFix: this.actor.id ?? undefined,
      };
      await DDBRunContext.runWith({
        keyPostfix: this.actor.id,
        useLocal: foundry.utils.getProperty(this.actor, "flags.ddbimporter.useLocalPatreonKey") as boolean ?? false,
      }, async () => {
        const ddbCharacter = new DDBCharacter(ddbCharacterOptions);
        this.ddbCharacter = ddbCharacter;
        await ddbCharacter.getCharacterData(getOptions);
        await ddbCharacter.process();
        logger.debug("import.js getCharacterData result", ddbCharacter);
        const debugJson = utils.getSetting<boolean>("debug-json");
        if (debugJson) {
          FileHelper.download(JSON.stringify(ddbCharacter.source), `${characterId}.json`, "application/json");
        }
        if (ddbCharacter.source?.success) {
          await generateCharacterExtras(this.element, ddbCharacter, this.actor);
          this.showCurrentTask("Loading Extras", { message: "Done." });
          this.#setDisabled("#dndbeyond-character-extras-start", true);
          this.close();
        } else {
          this.showCurrentTask(ddbCharacter.source?.message ?? "Failed to fetch character data", { message: null, isError: true });
        }
      });
    } catch (error) {
      switch (utils.errorMessage(error)) {
        case "ImportFailure":
          logger.error("Failure");
          break;
        case "Forbidden":
          this.showCurrentTaskError("Error retrieving Character: ", { error, supressLog: true });
          break;
        default:
          this.showCurrentTaskError("Error processing Character: ", { error });
          break;
      }
      return;
    }
    return;
  }

  static async importCharacterClickEvent(this: DDBCharacterManager, _event: any, _target: any) {
    try {
      this.#setDisabled("#dndbeyond-character-import-start", true);

      this.showCurrentTask("Preparing Importer...");

      const result = await this.characterImporter.importCharacter();
      if (result === true) {
        this.close();
      }
    } catch (error) {
      switch (utils.errorMessage(error)) {
        case "ImportFailure":
          logger.error("Failure", { ddbCharacter: this.ddbCharacter, result: this.result });
          break;
        case "Forbidden":
          this.showCurrentTaskError("Error retrieving Character: ", { error, supressLog: true });
          break;
        default:
          this.showCurrentTaskError("Error processing Character: ", { error });
          logger.error("Failure", { ddbCharacter: this.ddbCharacter, result: this.result });
          break;
      }
      return;
    }

    this.#setDisabled("#dndbeyond-character-import-start", false);
    return;
  }

  static openDebug(this: DDBCharacterManager, _event: any, _target: any) {
    new DDBDebugger({ actor: this.actor, extra: this.debugContext }).render({ force: true });
  }

}
