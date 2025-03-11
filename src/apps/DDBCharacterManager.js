import {
  logger,
  FileHelper,
  CompendiumHelper,
  MuncherSettings,
  PatreonHelper,
  Secrets,
} from "../lib/_module.mjs";
import DDBCharacter from "../parser/DDBCharacter.js";
import { updateDDBCharacter } from "../updater/character.js";
import { generateCharacterExtras } from "../parser/DDBExtras.js";
import { SETTINGS } from "../config/_module.mjs";
import DDBCookie from "../apps/DDBCookie.js";
import { DDBKeyChange } from "../apps/DDBKeyChange.js";
import DDBAppV2 from "./DDBAppV2.js";
import DDBCharacterImporter from "../muncher/DDBCharacterImporter.mjs";


export default class DDBCharacterManager extends DDBAppV2 {
  constructor(options, actor, ddbCharacter = null) {
    super(options);
    this.actor = game.actors.get(actor._id);
    this.actorOriginal = foundry.utils.duplicate(this.actor);
    logger.debug("Current Actor (Original):", this.actorOriginal);
    this.result = {};
    this.nonMatchedItemIds = [];
    this.settings = {};
    this.ddbCharacter = ddbCharacter;
    this.characterImporter = new DDBCharacterImporter({
      actorId: actor._id,
      ddbCharacter: this.ddbCharacter,
      notifier: this.showCurrentTask.bind(this),
    });
  }

  static renderPopup(type, url) {
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
    },
    position: {
      width: "900",
      height: "auto",
    },
    window: {
      icon: 'fab fa-d-and-d-beyond',
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
    update: { template: "modules/ddb-importer/handlebars/character/update.hbs" },
    details: { template: "modules/ddb-importer/handlebars/character/details.hbs" },
    footer: { template: "modules/ddb-importer/handlebars/character/footer.hbs" },
  };

  /** @override */
  tabGroups = {
    sheet: "import",
    import: "main",
  };


  _getTabs() {
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
      update: {
        id: "update", group: "sheet", label: "Update D&DBeyond", icon: "fas fa-arrow-alt-circle-up",
      },
    });
    return tabs;
  }


  /* -------------------------------------------- */
  /*  Life-Cycle Handlers                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  _onRender(context, options) {
    super._onRender(context, options);
    // custom listeners
    // watch the change of the muncher-policy-selector checkboxes
    this.element.querySelectorAll("fieldset :is(dnd5e-checkbox)").forEach((checkbox) => {
      checkbox.addEventListener('change', async (event) => {
        switch (event.currentTarget.dataset.section) {
          case "resource-selection": {
            const updateData = { flags: { ddbimporter: { resources: { ask: event.currentTarget.checked } } } };
            await this.actor.update(updateData);
            break;
          }
          default: {
            await MuncherSettings.updateActorSettings(this.element, event);
          }
        }

        await this.render();
      });
    });

    this.element.querySelector("input[name=dndbeyond-url]").addEventListener('input', async (event) => {
      await this.#handleURLUpdate(event);
    });


    this.element.querySelector("#open-dndbeyond-url").addEventListener('click', async () => {
      try {
        const characterUrl = this.actor.flags.ddbimporter.dndbeyond.url;
        DDBCharacterManager.renderPopup("json", characterUrl);
      } catch (error) {
        this.showCurrentTask("Error opening JSON URL", error, true);
      }
    });


  }

  /** @override */
  async _prepareContext(options) {

    // loads settings for actor
    this.importSettings = MuncherSettings.getCharacterImportSettings();
    const useLocalPatreonKey = this.actor.flags?.ddbimporter?.useLocalPatreonKey;

    const characterId = this.actor.flags?.ddbimporter?.dndbeyond?.characterId;
    this.dmSyncEnabled = characterId && this.importSettings.tiers.all;
    this.playerSyncEnabled = characterId && useLocalPatreonKey;
    const syncEnabled = characterId && (this.importSettings.tiers.all || useLocalPatreonKey);

    const trustedUsersOnly = game.settings.get("ddb-importer", "restrict-to-trusted");
    const allowAllSync = game.settings.get("ddb-importer", "allow-all-sync");
    const syncOnly = trustedUsersOnly && allowAllSync && !game.user.isTrusted;

    const localCobalt = Secrets.isLocalCobalt(this.actor.id);
    const cobaltCookie = Secrets.getCobalt(this.actor.id);
    const cobaltSet = localCobalt && cobaltCookie && cobaltCookie != "";

    const dynamicSync = game.settings.get("ddb-importer", "dynamic-sync");
    const updateUser = game.settings.get("ddb-importer", "dynamic-sync-user");
    const gmSyncUser = game.user.isGM && game.user.id == updateUser;
    const dynamicUpdateAllowed = dynamicSync && gmSyncUser && this.importSettings.tiers.experimentalMid;
    const dynamicUpdateStatus = this.actor.flags?.ddbimporter?.activeUpdate;
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
      dynamicUpdateAllowed,
      dynamicUpdateStatus,
      resourceSelection,
      useLocalPatreonKey: useLocalPatreonKey && this.itemsMunched,
    };

    let context = foundry.utils.mergeObject(this.importSettings, this.actorSettings);
    const parentContext = await super._prepareContext(options);
    context = foundry.utils.mergeObject(parentContext, context, { inplace: false });
    logger.debug("DDBCharacterManager: _prepareContext", context);
    return context;
  }

  /** @override */
  // eslint-disable-next-line class-methods-use-this
  async _preparePartContext(partId, context) {
    switch (partId) {
      case "import": {
        context.tab = context.tabs[partId];
        break;
      }
      case "update": {
        context.tab = context.tabs.update;
        break;
      }
      // no default
    };
    return context;
  }


  showCurrentTask(title, message = null, isError = false) {
    let element = $(this.element).find(".task-name");
    element.html(`<h2 ${isError ? " style='color:red'" : ""}>${title}</h2>${message ? `<p>${message}</p>` : ""}`);
    $(this.element).parent().parent().css("height", "auto");
  }


  // static async itemsMunched() {
  //   const itemCompendium = await CompendiumHelper.getCompendiumType("item", false);
  //   const itemsMunched = itemCompendium ? (await itemCompendium.index.size) !== 0 : false;
  //   return itemsMunched;
  // }

  /* -------------------------------------------- */

  async #handleURLUpdate(event) {
    let URL = event.currentTarget.value;
    const characterId = DDBCharacter.getCharacterId(URL);

    const status = this.element.querySelector(".dndbeyond-url-status i");

    // console.warn("URL", {
    //   status,
    //   classList: status.classList,
    //   characterId,
    //   URL,
    // });

    if (URL === "") {
      status.classList.remove("fa-exclamation-triangle");
      status.classList.remove("fa-check-circle");
      status.classList.remove("fas");
      status.style.color = "";
      this.element.querySelector("span.dndbeyond-character-id").textContent = "";
      this.element.querySelector("#dndbeyond-character-import-start").disabled = true;
      this.element.querySelector("#open-dndbeyond-url").disabled = true;
      this.showCurrentTask("URL Cleared", "", false);
      await this.actor.update({
        "flags.ddbimporter.dndbeyond": {
          url: URL,
          characterId,
        },
      });
    } else if (characterId) {
      status.classList.add("fas");
      status.classList.remove("fa-exclamation-triangle");
      status.classList.add("fa-check-circle");
      status.style.color = "green";
      this.element.querySelector("span.dndbeyond-character-id").textContent = characterId;
      this.element.querySelector("#dndbeyond-character-import-start").disabled = false;
      this.element.querySelector("#open-dndbeyond-url").disabled = false;
      this.showCurrentTask("", "", false);

      await this.actor.update({
        "flags.ddbimporter.dndbeyond": {
          url: URL,
          characterId,
        },
      });

    } else {
      this.showCurrentTask("URL format incorrect", "That seems not to be the URL we expected...", true);
      status.classList.add("fa-exclamation-triangle");
      status.classList.remove("fa-check-circle");
      status.style.color = "red";
    }
  }

  activateListeners(html) {


    $(html)
      .find("#dndbeyond-character-dynamic-update")
      .on("change", async (event) => {
        const activeUpdateData = { flags: { ddbimporter: { activeUpdate: event.currentTarget.checked } } };
        await this.actor.update(activeUpdateData);
      });

    $(html)
      .find("#dndbeyond-character-update")
      .on("click", async () => {
        this.html = html;
        try {
          $(html).find("#dndbeyond-character-update").prop("disabled", true);
          await updateDDBCharacter(this.actor).then((result) => {
            const updateNotes = result
              .flat()
              .filter((r) => r !== undefined)
              .map((r) => r.message)
              .join(" ");
            logger.debug(updateNotes);
            this.showCurrentTask("Update complete", updateNotes);
            $(html).find("#dndbeyond-character-update").prop("disabled", false);
          });
        } catch (error) {
          logger.error(error);
          logger.error(error.stack);
          this.showCurrentTask("Error updating character", error, true);
        }
      });

    $(html)
      .find("#delete-local-cobalt")
      .on("click", async () => {
        this.html = html;
        try {
          Secrets.deleteLocalCobalt(this.actor.id);
          $(html).find("#delete-local-cobalt").prop("disabled", true);
          $(html).find("#set-local-cobalt").text("Add Cobalt Cookie");
        } catch (error) {
          logger.error(error);
          logger.error(error.stack);
          this.showCurrentTask("Error deleting local cookie", error, true);
        }
      });

    $(html)
      .find("#set-local-cobalt")
      .on("click", async () => {
        this.html = html;
        try {
          new DDBCookie({}, this.actor, true).render(true);
          $(html).find("#delete-local-cobalt").prop("disabled", false);
          $(html).find("#set-local-cobalt").text("Update Cobalt Cookie");
        } catch (error) {
          logger.error(error);
          logger.error(error.stack);
          this.showCurrentTask("Error setting local cookie", error, true);
        }
      });

    $(html)
      .find("#delete-local-patreon-key")
      .on("click", async () => {
        this.html = html;
        try {
          await PatreonHelper.setPatreonKey(null, true);
          await this.actor.update({ flags: { ddbimporter: { useLocalPatreonKey: false } } });
          $(html).find("#delete-local-patreon-key").prop("disabled", true);
          $(html).find("#set-local-patreon-key").text("Add Patreon Key");
          if (!this.dmSyncEnabled) {
            $(html).find("#dndbeyond-character-update").prop("disabled", true);
            $(html).find("#dndbeyond-character-update").text("D&D Beyond Update Available to Patreon Supporters");
          }
        } catch (error) {
          logger.error(error);
          logger.error(error.stack);
          this.showCurrentTask("Error deleting local cookie", error, true);
        }
      });

    $(html)
      .find("#set-local-patreon-key")
      .on("click", async () => {
        this.html = html;
        const updateActorState = async () => {
          await this.actor.update({ flags: { ddbimporter: { useLocalPatreonKey: true } } });
          $(html).find("#delete-local-patreon-key").prop("disabled", false);
          $(html).find("#set-local-patreon-key").text("Update Patreon Key");
          if (this.itemsMunched) {
            $(html).find("#dndbeyond-character-update").prop("disabled", false);
            $(html).find("#dndbeyond-character-update").text("Update D&D Beyond with changes");
          } else {
            $(html).find("#dndbeyond-character-update").text("Your DM needs to import D&D Beyond items and spells into the DDB compendiums first.");
          }
        };
        try {
          const existingKey = await PatreonHelper.getPatreonKey(true);
          if (!this.actor.flags.ddbimporter?.useLocalPatreonKey && existingKey && existingKey !== "") {
            await updateActorState();
          } else {
            new DDBKeyChange({
              local: true,
              success: updateActorState,
            }).render(true);
          }
        } catch (error) {
          logger.error(error);
          logger.error(error.stack);
          this.showCurrentTask("Error setting local patreon key", error, true);
        }
      });

    $(html)
      .find("#dndbeyond-character-extras-start")
      .on("click", async () => {
        this.html = html;
        try {
          $(html).find("#dndbeyond-character-extras-start").prop("disabled", true);
          this.showCurrentTask("Fetching character data");
          const characterId = this.actor.flags.ddbimporter.dndbeyond.characterId;
          const ddbCharacterOptions = {
            currentActor: this.actor,
            ddb: null,
            characterId,
            selectResources: false,
          };
          const getOptions = {
            syncId: null,
            localCobaltPostFix: this.actor.id,
          };
          this.ddbCharacter = new DDBCharacter(ddbCharacterOptions);
          await this.ddbCharacter.getCharacterData(getOptions);
          logger.debug("import.js getCharacterData result", this.ddbCharacter);
          const debugJson = game.settings.get("ddb-importer", "debug-json");
          if (debugJson) {
            FileHelper.download(JSON.stringify(this.ddbCharacter.source), `${characterId}.json`, "application/json");
          }
          if (this.ddbCharacter.source?.success) {
            await generateCharacterExtras(html, this.ddbCharacter, this.actor);
            this.showCurrentTask("Loading Extras", "Done.", false);
            $(html).find("#dndbeyond-character-extras-start").prop("disabled", true);
            this.close();
          } else {
            this.showCurrentTask(this.ddbCharacter.source.message, null, true);
            return false;
          }
        } catch (error) {
          switch (error.message) {
            case "ImportFailure":
              logger.error("Failure");
              break;
            case "Forbidden":
              this.showCurrentTask("Error retrieving Character: " + error, error, true);
              break;
            default:
              logger.error(error);
              logger.error(error.stack);
              this.showCurrentTask("Error processing Character: " + error, error, true);
              break;
          }
          return false;
        }
        return true;
      });
  }

  static async importCharacterClickEvent(_event, _target) {
    // retrieve the character data from the proxy
    // console.warn("Importing Character", {
    //   this: this,
    //   event: _event,
    //   target: _target,
    // });
    try {
      $(this.element).find("#dndbeyond-character-import-start").prop("disabled", true);

      this.showCurrentTask("Preparing Importer...");

      const result = await this.characterImporter.importCharacter();

      // console.warn("Importing Character Result", {
      //   result,
      //   ddbCharacter: this.ddbCharacter,
      //   characterImporter: this.characterImporter,
      // });
      if (result === true) {
        this.close();
      }
    } catch (error) {
      switch (error.message) {
        case "ImportFailure":
          logger.error("Failure", { ddbCharacter: this.ddbCharacter, result: this.result });
          break;
        case "Forbidden":
          this.showCurrentTask("Error retrieving Character: " + error, error, true);
          break;
        default:
          logger.error(error);
          logger.error(error.stack);
          this.showCurrentTask("Error processing Character: " + error, error, true);
          logger.error("Failure", { ddbCharacter: this.ddbCharacter, result: this.result });
          break;
      }
      return false;
    } finally {
      delete CONFIG.DDBI.keyPostfix;
      delete CONFIG.DDBI.useLocal;
    }

    $(this.element).find("#dndbeyond-character-import-start").prop("disabled", false);
    return true;
  }

}
