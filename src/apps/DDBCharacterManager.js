import utils from "../lib/utils.js";
import FileHelper from "../lib/FileHelper.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import MuncherSettings from "../lib/MuncherSettings.js";
import PatreonHelper from "../lib/PatreonHelper.js";
import logger from "../logger.js";
import DDBCharacter from "../parser/DDBCharacter.js";
import Iconizer from "../lib/Iconizer.js";
import { updateDDBCharacter } from "../updater/character.js";
import { generateCharacterExtras } from "../parser/DDBExtras.js";
import DICTIONARY from "../dictionary.js";
import { getCobalt, isLocalCobalt, deleteLocalCobalt } from "../lib/Secrets.js";
import DDBCookie from "../apps/DDBCookie.js";
import { DDBKeyChange } from "../apps/DDBKeyChange.js";
import { abilityOverrideEffects } from "../effects/abilityOverrides.js";
import { setConditions } from "../parser/special/conditions.js";
import SETTINGS from "../settings.js";
import DDBMacros from "../effects/DDBMacros.js";
import DDBItemImporter from "../lib/DDBItemImporter.js";
import { addMagicItemSpells } from "../parser/item/itemSpells.js";
import DDBHelper from "../lib/DDBHelper.js";
import ExternalAutomations from "../effects/external/ExternalAutomations.js";

export default class DDBCharacterManager extends FormApplication {
  constructor(options, actor, ddbCharacter = null) {
    super(options);
    this.actor = game.actors.get(actor._id);
    this.migrateMetadata();
    this.actorOriginal = foundry.utils.duplicate(this.actor);
    logger.debug("Current Actor (Original):", this.actorOriginal);
    this.result = {};
    this.nonMatchedItemIds = [];
    this.settings = {};
    this.ddbCharacter = ddbCharacter;
  }

  migrateMetadata() {
    if (this.actor.flags?.ddbimporter?.dndbeyond) {
      const url = this.actor.flags.ddbimporter.dndbeyond.url;

      if (url && !this.actor.flags.ddbimporter.characterId) {
        const characterId = DDBCharacter.getCharacterId(url);
        if (characterId) {
          this.actor.flags.ddbimporter.dndbeyond.characterId = characterId;
          this.actor.flags.ddbimporter.dndbeyond.url = url;
        } else {
          // clear the url, because it's malformed anyway
          this.actor.flags.ddbimporter.dndbeyond.url = null;
        }
      }
    }
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
        `resizeable,scrollbars,location=no,width=${width},height=${height},toolbar=1`
      );
    }
    return true;
  }

  /**
   * Define default options
   */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.title = game.i18n.localize("ddb-importer.module-name");
    options.template = "modules/ddb-importer/handlebars/character.hbs";
    options.width = 900;
    options.height = "auto";
    options.classes = ["ddbimporter", "sheet"];
    options.tabs = [{ navSelector: ".tabs", contentSelector: "form", initial: "import" }];

    return options;
  }

  showCurrentTask(title, message = null, isError = false) {
    let element = $(this.html).find(".task-name");
    element.html(`<h2 ${isError ? " style='color:red'" : ""}>${title}</h2>${message ? `<p>${message}</p>` : ""}`);
    $(this.html).parent().parent().css("height", "auto");
  }

  static getCharacterUpdatePolicyTypes(invert = false) {
    let itemTypes = ["background", "race"];

    if (invert) {
      if (!game.settings.get("ddb-importer", "character-update-policy-class")) {
        itemTypes.push("class");
        itemTypes.push("subclass");
      }
      if (!game.settings.get("ddb-importer", "character-update-policy-feat")) itemTypes.push("feat");
      if (!game.settings.get("ddb-importer", "character-update-policy-weapon")) itemTypes.push("weapon");
      if (!game.settings.get("ddb-importer", "character-update-policy-equipment"))
        itemTypes = itemTypes.concat(DICTIONARY.types.equipment);
      if (!game.settings.get("ddb-importer", "character-update-policy-spell")) itemTypes.push("spell");
    } else {
      if (game.settings.get("ddb-importer", "character-update-policy-class")) {
        itemTypes.push("class");
        itemTypes.push("subclass");
      }
      if (game.settings.get("ddb-importer", "character-update-policy-feat")) itemTypes.push("feat");
      if (game.settings.get("ddb-importer", "character-update-policy-weapon")) itemTypes.push("weapon");
      if (game.settings.get("ddb-importer", "character-update-policy-equipment"))
        itemTypes = itemTypes.concat(DICTIONARY.types.equipment);
      if (game.settings.get("ddb-importer", "character-update-policy-spell")) itemTypes.push("spell");
    }
    return itemTypes;
  }

  /**
   * Returns a combined array of all items to process, filtered by the user's selection on what to skip and what to include
   * @param {object} result object containing all character items sectioned as individual properties
   * @param {array[string]} sections an array of object properties which should be filtered
   */
  filterItemsByUserSelection(invert = false) {
    let items = [];
    const validItemTypes = DDBCharacterManager.getCharacterUpdatePolicyTypes(invert);

    for (const section of SETTINGS.FILTER_SECTIONS) {
      items = items.concat(this.result[section]).filter((item) => validItemTypes.includes(item.type));
    }
    return items;
  }

  filterActorItemsByUserSelection(invert = false) {
    const validItemTypes = DDBCharacterManager.getCharacterUpdatePolicyTypes(invert);

    const items = this.actorOriginal.items.filter((item) => validItemTypes.includes(item.type));

    return items;
  }

  /**
   * Loops through a characters items and updates flags
   * @param {*} items
   */
  async copySupportedCharacterItemFlags(items) {
    items.forEach((item) => {
      const originalItem = this.actorOriginal.items.find(
        (originalItem) => item.name === originalItem.name && item.type === originalItem.type
      );
      if (originalItem) {
        DDBItemImporter.copySupportedItemFlags(originalItem, item);
      }
    });
  }

  copyExistingJournalNotes() {
    if (!this.actorOriginal) return;
    const journalFields = [
      "notes1name",
      "notes2name",
      "notes3name",
      "notes4name",
      "notes1",
      "notes2",
      "notes3",
      "notes4",
      "notes",
    ];
    journalFields.forEach((field) => {
      if (this.actorOriginal.system.details[field]) {
        this.actor.system.details[field] = this.actorOriginal.system.details[field];
      }
    });
  }

  async copyCharacterItemEffects(items) {
    return new Promise((resolve) => {
      resolve(
        items.map((item) => {
          const originalItem = this.actorOriginal.items.find((originalItem) =>
            item.name === originalItem.name
            && item.type === originalItem.type
            && item.flags?.ddbimporter?.id === originalItem.flags?.ddbimporter?.id
          );
          if (originalItem) {
            if (!item.effects) item.effects = [];
            if (originalItem.effects) {
              logger.info(`Copying Effects for ${originalItem.name}`);
              item.effects = originalItem.effects.map((m) => {
                delete m._id;
                return m;
              });
            }
          }
          return item;
        })
      );
    });
  }

  /**
   * Removes items
   * @param {*} items
   * @param {*} itemsToRemove
   */
  static async removeItems(items, itemsToRemove) {
    return new Promise((resolve) => {
      resolve(
        items.filter(
          (item) =>
            !itemsToRemove.some((originalItem) => {
              const originalNameMatch = originalItem.flags?.ddbimporter?.originalItemName
                ? originalItem.flags.ddbimporter.originalItemName === item.name
                : false;
              const nameMatch = item.name === originalItem.name || originalNameMatch;
              return nameMatch && item.type === originalItem.type;
            })
        )
      );
    });
  }

  /**
   * Deletes items from the inventory bases on which sections a user wants to update
   * Possible sections:
   * - class
   * - feat
   * - weapon
   * - equipment
   * - inventory: consumable, loot, tool and container
   * - spell
   */
  async clearItemsByUserSelection(excludedList = []) {
    const includedItems = DDBCharacterManager.getCharacterUpdatePolicyTypes();
    // collect all items belonging to one of those inventory item categories
    const ownedItems = this.actor.getEmbeddedCollection("Item");
    const toRemove = ownedItems
      .filter(
        (item) =>
          includedItems.includes(item.type)
          && !excludedList.some((excluded) => excluded._id === item.id)
          && !this.nonMatchedItemIds.includes(item.id)
      )
      .filter((item) => !item.flags.ddbimporter?.ignoreItemImport)
      .map((item) => item.id);

    logger.debug("Removing the following character items", toRemove);
    if (toRemove.length > 0) {
      await this.actor.deleteEmbeddedDocuments("Item", toRemove, {
        itemsWithSpells5e: { alsoDeleteChildSpells: false }
      });
    }
    return toRemove;
  }

  async updateImage() {
    const data = this.ddbCharacter.source.ddb;
    logger.debug("Checking if image needs updating");
    // updating the image?
    let imagePath = this.actor.img;
    const decorations = data.character.decorations;
    const userHasPermission = !(game.settings.get("ddb-importer", "restrict-to-trusted") && !game.user.isTrusted);
    if (
      userHasPermission
      && decorations?.avatarUrl
      && decorations.avatarUrl !== ""
      && (!imagePath || imagePath.includes("mystery-man") || this.settings.updatePolicyImage)
    ) {
      this.showCurrentTask("Uploading avatar image");
      const filename = utils.referenceNameString(`${data.character.id}-${data.character.name}`);

      const uploadDirectory = game.settings.get("ddb-importer", "image-upload-directory").replace(/^\/|\/$/g, "");
      imagePath = await FileHelper.uploadRemoteImage(decorations.avatarUrl, uploadDirectory, filename);
      this.result.character.img = imagePath;
      if (decorations?.frameAvatarUrl && decorations.frameAvatarUrl !== "") {
        const framePath = await FileHelper.uploadRemoteImage(decorations.frameAvatarUrl, uploadDirectory, `frame-${filename}`);
        this.result.character.flags.ddbimporter["framePath"] = framePath;
      }
    } else {
      this.result.character.img = this.actor.img;
    }

    if (this.actorOriginal.prototypeToken.texture.src.includes("mystery-man")) {
      foundry.utils.setProperty(this.result.character, "prototypeToken.texture.src", this.result.character.img);
    } else if (foundry.utils.hasProperty(this.actorOriginal, "prototypeToken.texture.src")) {
      foundry.utils.setProperty(this.result.character, "prototypeToken.texture.src", this.actorOriginal.prototypeToken.texture.src);
    }
  }


  static async itemsMunched() {
    const itemCompendium = await CompendiumHelper.getCompendiumType("item", false);
    const itemsMunched = itemCompendium ? (await itemCompendium.index.size) !== 0 : false;
    return itemsMunched;
  }

  /* -------------------------------------------- */

  async getData() {
    // loads settings for actor
    this.importSettings = MuncherSettings.getCharacterImportSettings();
    const useLocalPatreonKey = this.actor.flags?.ddbimporter?.useLocalPatreonKey;

    const characterId = this.actor.flags?.ddbimporter?.dndbeyond?.characterId;
    this.dmSyncEnabled = characterId && this.importSettings.tiers.all;
    this.activateListenersplayerSyncEnabled = characterId && useLocalPatreonKey;
    const syncEnabled = characterId && (this.importSettings.tiers.all || useLocalPatreonKey);

    const trustedUsersOnly = game.settings.get("ddb-importer", "restrict-to-trusted");
    const allowAllSync = game.settings.get("ddb-importer", "allow-all-sync");
    const syncOnly = trustedUsersOnly && allowAllSync && !game.user.isTrusted;

    const localCobalt = isLocalCobalt(this.actor.id);
    const cobaltCookie = getCobalt(this.actor.id);
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

    return foundry.utils.mergeObject(this.importSettings, this.actorSettings);
  }

  /* -------------------------------------------- */

  activateListeners(html) {
    super.activateListeners(html);
    // watch the change of the import-policy-selector checkboxes
    $(html)
      .find(
        [
          '.import-policy input[type="checkbox"]',
          '.advanced-import-config input[type="checkbox"]',
          '.effect-policy input[type="checkbox"]',
          '.effect-import-config input[type="checkbox"]',
          '.extras-import-config input[type="checkbox"]',
          '.import-config input[type="checkbox"]',
        ].join(",")
      )
      .on("change", (event) => {
        this.html = html;
        MuncherSettings.updateActorSettings(html, event);
      });

    $(html)
      .find("#default-effects")
      .on("click", async (event) => {
        event.preventDefault();
        MuncherSettings.setRecommendedCharacterActiveEffectSettings(html);
      });

    $(html)
      .find(['.resource-selection input[type="checkbox"]'].join(","))
      .on("change", async (event) => {
        const updateData = { flags: { ddbimporter: { resources: { ask: event.currentTarget.checked } } } };
        await this.actor.update(updateData);
      });

    $(html)
      .find('.sync-policy input[type="checkbox"]')
      .on("change", (event) => {
        game.settings.set(
          "ddb-importer",
          "sync-policy-" + event.currentTarget.dataset.section,
          event.currentTarget.checked
        );
      });

    $(html)
      .find("#dndbeyond-character-dynamic-update")
      .on("change", async (event) => {
        const activeUpdateData = { flags: { ddbimporter: { activeUpdate: event.currentTarget.checked } } };
        await this.actor.update(activeUpdateData);
      });

    $(html)
      .find("#dndbeyond-character-import-start")
      .on("click", async (event) => {
        // retrieve the character data from the proxy
        event.preventDefault();
        this.html = html;

        try {
          $(html).find("#dndbeyond-character-import-start").prop("disabled", true);
          this.showCurrentTask("Getting Character data");
          const characterId = this.actor.flags.ddbimporter.dndbeyond.characterId;
          const ddbCharacterOptions = {
            currentActor: this.actor,
            characterId,
            selectResources: true,
            enableCompanions: true,
          };
          const getOptions = {
            syncId: null,
            localCobaltPostFix: this.actor.id,
          };
          this.ddbCharacter = new DDBCharacter(ddbCharacterOptions);
          await this.ddbCharacter.getCharacterData(getOptions);
          logger.debug("import.js getCharacterData result", this.ddbCharacter);
          if (game.settings.get("ddb-importer", "debug-json")) {
            FileHelper.download(JSON.stringify(this.ddbCharacter.source), `${characterId}.json`, "application/json");
          }
          if (this.ddbCharacter.source?.success) {
            // begin parsing the character data
            await this.processCharacterData();
            this.showCurrentTask("Loading Character data", "Done.", false);
            logger.debug("Character Load complete", { ddbCharacter: this.ddbCharacter, result: this.result, actor: this.actor, actorOriginal: this.actorOriginal });
            this.close();
          } else {
            this.showCurrentTask(this.ddbCharacter.source.message, null, true);
            return false;
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
        }

        $(html).find("#dndbeyond-character-import-start").prop("disabled", false);
        return true;
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
          deleteLocalCobalt(this.actor.id);
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
            selectResources: false
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

    $(html)
      .find("input[name=dndbeyond-url]")
      .on("input", async (event) => {
        this.html = html;
        let URL = event.target.value;
        const characterId = DDBCharacter.getCharacterId(URL);

        if (characterId) {
          $(html)
            .find(".dndbeyond-url-status i")
            .replaceWith('<i class="fas fa-check-circle" style="color: green"></i>');
          $(html).find("span.dndbeyond-character-id").text(characterId);
          $(html).find("#dndbeyond-character-import-start").prop("disabled", false);
          $(html).find("#open-dndbeyond-url").prop("disabled", false);

          this.showCurrentTask("Saving reference");
          await this.actor.update({
            "flags.ddbimporter.dndbeyond": {
              url: URL,
              characterId,
            },
          });
          this.showCurrentTask("Status");
        } else {
          this.showCurrentTask("URL format incorrect", "That seems not to be the URL we expected...", true);
          $(html)
            .find(".dndbeyond-url-status i")
            .replaceWith('<i class="fas fa-exclamation-triangle" style="color:red"></i>');
        }
      });

    $(html)
      .find("#open-dndbeyond-url")
      .on("click", () => {
        this.html = html;
        try {
          const characterUrl = this.actor.flags.ddbimporter.dndbeyond.url;
          DDBCharacterManager.renderPopup("json", characterUrl);
        } catch (error) {
          this.showCurrentTask("Error opening JSON URL", error, true);
        }
      });
  }

  async enrichCharacterItems(items) {
    const useInbuiltIcons = game.settings.get("ddb-importer", "character-update-policy-use-inbuilt-icons");
    const useSRDCompendiumItems = game.settings.get("ddb-importer", "character-update-policy-use-srd");
    const useSRDCompendiumIcons = game.settings.get("ddb-importer", "character-update-policy-use-srd-icons");
    const ddbSpellIcons = game.settings.get("ddb-importer", "character-update-policy-use-ddb-spell-icons");
    const ddbItemIcons = game.settings.get("ddb-importer", "character-update-policy-use-ddb-item-icons");
    const ddbGenericItemIcons = game.settings.get("ddb-importer", "character-update-policy-use-ddb-generic-item-icons");

    await Iconizer.preFetchDDBIconImages();

    // if we still have items to add, add them
    if (items.length > 0) {
      this.showCurrentTask("Copying existing data flags");
      await this.copySupportedCharacterItemFlags(items);

      if (ddbItemIcons) {
        this.showCurrentTask("Fetching DDB Inventory Images");
        items = await Iconizer.getDDBEquipmentIcons(items, true);
      }

      if (useInbuiltIcons) {
        this.showCurrentTask("Adding Inbuilt Icons");
        items = await Iconizer.getDDBHintImages("class", items);
        items = await Iconizer.getDDBHintImages("subclass", items);
        items = await Iconizer.copyInbuiltIcons(items);
      }

      if (useSRDCompendiumIcons && !useSRDCompendiumItems) {
        this.showCurrentTask("Adding SRD Icons");
        items = await Iconizer.copySRDIcons(items);
      }

      if (ddbSpellIcons) {
        this.showCurrentTask("Fetching DDB Spell School Images");
        items = await Iconizer.getDDBSpellSchoolIcons(items, true);
      }

      if (ddbGenericItemIcons) {
        this.showCurrentTask("Fetching DDB Generic Item Images");
        items = await Iconizer.getDDBGenericItemIcons(items, true);
      }

      if (this.settings.activeEffectCopy) {
        this.showCurrentTask("Copying Item Active Effects");
        items = await this.copyCharacterItemEffects(items);
      }

      items = await Iconizer.addItemEffectIcons(items);
      items = await Iconizer.retainExistingIcons(items);
    }

    items = items.map((item) => {
      if (!item.effects) item.effects = [];
      return item;
    });

    return Promise.all(items);
  }

  async createCharacterItems(items, keepIds) {
    const options = foundry.utils.duplicate(SETTINGS.DISABLE_FOUNDRY_UPGRADE);
    if (keepIds) options["keepId"] = true;

    // we have to break these out into class and non-class because of
    // https://gitlab.com/foundrynet/foundryvtt/-/issues/5312
    const klassItems = items.filter((item) => ["class", "subclass"].includes(item.type));
    const nonKlassItems = items.filter((item) => !["class", "subclass"].includes(item.type));

    if (klassItems.length > 0) {
      logger.debug(`Adding the following class items, keep Ids? ${keepIds}`, { options, items: foundry.utils.duplicate(klassItems) });
      await this.actor.createEmbeddedDocuments("Item", klassItems, options);
    }
    if (nonKlassItems.length > 0) {
      logger.debug(`Adding the following non-class items, keep Ids? ${keepIds}`, { options, items: foundry.utils.duplicate(nonKlassItems) });
      await this.actor.createEmbeddedDocuments("Item", nonKlassItems, options);
    }
  }

  async importCharacterItems(items, keepIds = false) {
    if (items.length > 0) {
      this.showCurrentTask("Adding items to character");

      const newItems = items.filter((i) => !i._id || i._id === null || i._id === undefined);
      const updateItems = items.filter((i) => i._id && i._id !== null && i._id !== undefined);

      await this.createCharacterItems(newItems, false);
      await this.createCharacterItems(updateItems, keepIds);
    }
  }

  async keepNonDDBItems(ddbItems) {
    const lastImportId = foundry.utils.getProperty(this.actorOriginal, "flags.ddbimporter.importId");
    if (this.settings.ignoreNonDDBItems) {
      const items = this.actor.getEmbeddedCollection("Item");
      await items.forEach((item) => {
        const ddbMatchedItem = ddbItems.some((ddbItem) =>
          item.name === ddbItem.name
          && item.type === ddbItem.type
          && item.flags?.ddbimporter?.id === ddbItem.flags?.ddbimporter?.id
        );
        if (!ddbMatchedItem) {
          // if item not replaced by compendium swap or
          if (item.flags?.ddbimporter?.importId !== lastImportId) {
            this.nonMatchedItemIds.push(item.id);
          }
        }
      });
    }
  }

  static async getIndividualOverrideItems(overrideItems) {
    const label = CompendiumHelper.getCompendiumLabel("custom");
    const compendium = CompendiumHelper.getCompendium(label);

    const compendiumItems = await Promise.all(overrideItems.map(async (item) => {
      const compendiumItem = foundry.utils.duplicate(await compendium.getDocument(item.flags.ddbimporter.overrideId));
      foundry.utils.setProperty(compendiumItem, "flags.ddbimporter.pack", `${compendium.metadata.id}`);
      if (foundry.utils.hasProperty(item, "flags.ddbimporter.overrideItem")) {
        foundry.utils.setProperty(compendiumItem, "flags.ddbimporter.overrideItem", item.flags.ddbimporter.overrideItem);
      } else {
        foundry.utils.setProperty(compendiumItem, "flags.ddbimporter.overrideItem", {
          name: item.name,
          type: item.type,
          ddbId: item.flags.ddbimporter?.id
        });
      }

      return compendiumItem;
    }));

    const matchingOptions = {
      looseMatch: false,
      monster: false,
      keepId: true,
      keepDDBId: true,
      overrideId: true,
      linkItemFlags: true,
    };
    const remappedItems = await DDBItemImporter.updateMatchingItems(overrideItems, compendiumItems, matchingOptions);

    return remappedItems;
  }

  static restoreDDBMatchedFlags(existingItem, item) {
    const ddbItemFlags = foundry.utils.getProperty(existingItem, "flags.ddbimporter");
    logger.debug(`Item flags for ${ddbItemFlags}`, ddbItemFlags);
    // we retain some flags that might change the nature of the import for this item
    // these flags are used elsewhere
    [
      "ignoreItemForChrisPremades",
      "ignoreItemImport",
      "ignoreItemUpdate",
      "overrideId",
      "overrideItem",
      "ddbCustomAdded",
    ].forEach((flag) => {
      if (foundry.utils.hasProperty(ddbItemFlags, flag)) {
        logger.debug(`Overriding ${flag} for ${item.name} to ${ddbItemFlags[flag]}`);
        foundry.utils.setProperty(item, `flags.ddbimporter.${flag}`, ddbItemFlags[flag]);
      }
    });
    // some items get ignored completly, if so we don't match these
    if (!foundry.utils.getProperty(ddbItemFlags, "ignoreItemImport") ?? false) {
      logger.debug(`Updating ${item.name} with id`);
      item["_id"] = existingItem["id"];
      if (foundry.utils.getProperty(ddbItemFlags, "ignoreIcon") ?? false) {
        logger.debug(`Retaining icons for ${item.name}`);
        item.flags.ddbimporter.matchedImg = existingItem.img;
        item.flags.ddbimporter.ignoreIcon = true;
      }
      if (foundry.utils.getProperty(ddbItemFlags, "retainResourceConsumption") ?? false) {
        logger.debug(`Retaining resources for ${item.name}`);
        item.system.consume = foundry.utils.deepClone(existingItem.system.consume);
        item.flags.ddbimporter.retainResourceConsumption = true;
        if (foundry.utils.hasProperty(existingItem, "flags.link-item-resource-5e") ?? false) {
          foundry.utils.setProperty(item, "flags.link-item-resource-5e", existingItem.flags["link-item-resource-5e"]);
        }
      }
    }
    if (foundry.utils.getProperty(ddbItemFlags, "ddbCustomAdded") ?? false) {
      item.system = existingItem.system;
      item.type = existingItem.type;
    }
    return item;
  }

  // checks for existing items, and depending on options will keep or replace with imported item
  async mergeExistingItems(items) {
    if (this.actorOriginal.flags.ddbimporter) {
      const ownedItems = this.actor.getEmbeddedCollection("Item");

      let nonMatchedItems = [];
      let matchedItems = [];

      for (let item of items) {
        let existingItem = DDBHelper.findMatchedDDBItem(item, ownedItems, matchedItems);
        // let existingItem = ownedItems.find((owned) => {
        //   // have we already matched against this id? lets not double dip
        //   const existingMatch = matchedItems.find((matched) => {
        //     return foundry.utils.getProperty(owned, "flags.ddbimporter.id") === foundry.utils.getProperty(matched, "flags.ddbimporter.id");
        //   });
        //   if (existingMatch) return false;
        //   // the simple match
        //   const simpleMatch
        //     = item.name === owned.name
        //     && item.type === owned.type
        //     && item.flags?.ddbimporter?.id === owned.flags?.ddbimporter?.id;
        //   // account for choices in ddb
        //   const isChoice
        //     = foundry.utils.hasProperty(item, "flags.ddbimporter.dndbeyond.choice.choiceId")
        //     && foundry.utils.hasProperty(owned, "flags.ddbimporter.dndbeyond.choice.choiceId");
        //   const choiceMatch = isChoice
        //     ? item.flags.ddbimporter.dndbeyond.choice.choiceId
        //       === owned.flags.ddbimporter.dndbeyond.choice.choiceId
        //     : true;
        //   // force an override
        //   const overrideDetails = foundry.utils.getProperty(owned, "flags.ddbimporter.overrideItem");
        //   const overrideMatch
        //     = overrideDetails
        //     && item.name === overrideDetails.name
        //     && item.type === overrideDetails.type
        //     && item.flags?.ddbimporter?.id === overrideDetails.ddbId;

        //   return (simpleMatch && choiceMatch) || overrideMatch;
        // });

        logger.debug(`Checking ${item.name} for existing match`, existingItem);

        if (existingItem) {
          // we use flags on the item to determine if we keep various properties
          // NOW IS THE TIME!
          item = DDBCharacterManager.restoreDDBMatchedFlags(existingItem, item);
          // we can now determine if we are going to ignore this item or not,
          // this effectively filters out the items we don't want and they don't
          // get returned from this function
          const ignoreItemImport = foundry.utils.getProperty(item, "flags.ddbimporter.ignoreItemImport") ?? false;
          if (!ignoreItemImport) {
            logger.debug(`Importing matched item ${item.name}`);
            matchedItems.push(item);
          }
        } else {
          nonMatchedItems.push(item);
        }
      }

      logger.debug("Finished retaining items");
      return nonMatchedItems.concat(matchedItems);
    } else {
      return items;
    }
  }

  async fetchCharacterItems() {
    const magicItemsInstalled = game.modules.get("magicitems")?.active || game.modules.get("magic-items-2")?.active;
    const itemsWithSpellsInstalled = game.modules.get("items-with-spells-5e")?.active;
    // items for actor
    let items = [];

    // process spells for magic items
    if ((magicItemsInstalled || itemsWithSpellsInstalled) && Array.isArray(this.result.itemSpells)) {
      this.showCurrentTask("Preparing magicitem spells");
      logger.debug("Preparing magicitem spells");
      await addMagicItemSpells(this.result);
    }

    logger.debug("Calculating items to create and update...");
    this.showCurrentTask("Calculating items to create and update...");
    items = this.filterItemsByUserSelection();

    logger.debug("Checking existing items for details...");
    this.showCurrentTask("Checking existing items for details...");

    items = await this.mergeExistingItems(items);
    await this.keepNonDDBItems(items);

    logger.debug("Removing found items...");
    this.showCurrentTask("Clearing items for recreation...");
    await this.clearItemsByUserSelection();

    // If there is no magicitems module fall back to importing the magic
    // item spells as normal spells fo the character
    if (!magicItemsInstalled && !itemsWithSpellsInstalled) {
      logger.debug("No magic items module(s) found, adding spells to sheet.");
      items.push(
        this.result.itemSpells.filter((item) => {
          const active = item.flags.ddbimporter.dndbeyond && item.flags.ddbimporter.dndbeyond.active === true;
          if (!active) logger.warn(`Missing active flag on item spell ${item.name}`);
          return active;
        })
      );
      items = items.flat();
    }
    logger.debug("Finished item fetch");
    return items;
  }

  async processCharacterItems(items) {
    let compendiumItems = [];
    let srdCompendiumItems = [];
    let overrideCompendiumItems = [];
    let individualCompendiumItems = [];

    // First we do items that are individually marked as override
    const individualOverrideItems = items.filter((item) => {
      const overrideId = foundry.utils.getProperty(item, "flags.ddbimporter.overrideId");
      return overrideId !== undefined && overrideId !== "NONE";
    });

    if (individualOverrideItems.length > 0) {
      const individualOverrideCompendiumItems = await DDBCharacterManager.getIndividualOverrideItems(individualOverrideItems);
      individualCompendiumItems = individualOverrideCompendiumItems;
      // remove existing items from those to be imported
      logger.info("Removing matching Override compendium items");
      items = await DDBCharacterManager.removeItems(items, individualCompendiumItems);
    }

    /**
     * First choice is override compendium
     */
    if (this.settings.useOverrideCompendiumItems) {
      logger.info("Removing matching Override compendium items");
      const compendiumOverrideItems = await DDBItemImporter.getCompendiumItems(items, "custom", { linkItemFlags: true });
      overrideCompendiumItems = compendiumOverrideItems;
      // remove existing items from those to be imported
      items = await DDBCharacterManager.removeItems(items, overrideCompendiumItems);
    }

    /**
     * If SRD is selected, we prefer this
     */
    if (this.settings.useSRDCompendiumItems) {
      logger.info("Removing compendium items");
      const featureManager = new DDBItemImporter("features", items);
      const inventoryManager = new DDBItemImporter("inventory", items);
      const spellManager = new DDBItemImporter("spells", items);

      await featureManager.init();
      await inventoryManager.init();
      await spellManager.init();

      const compendiumFeatureItems = await featureManager.getSRDCompendiumItems();
      const compendiumInventoryItems = await inventoryManager.getSRDCompendiumItems();
      const compendiumSpellItems = await spellManager.getSRDCompendiumItems();

      srdCompendiumItems = compendiumItems.concat(
        compendiumInventoryItems,
        compendiumSpellItems,
        compendiumFeatureItems
      );
      // remove existing items from those to be imported
      items = await DDBCharacterManager.removeItems(items, srdCompendiumItems);
    }

    if (this.settings.useExistingCompendiumItems) {
      logger.info("Removing compendium items");
      const compendiumFeatureItems = await DDBItemImporter.getCompendiumItems(items, "features");
      const compendiumInventoryItems = await DDBItemImporter.getCompendiumItems(items, "inventory");
      const compendiumSpellItems = await DDBItemImporter.getCompendiumItems(items, "spells");
      const compendiumClassItems = await DDBItemImporter.getCompendiumItems(items, "classes");
      const compendiumSubClassItems = await DDBItemImporter.getCompendiumItems(items, "subclasses");
      const compendiumRaceItems = await DDBItemImporter.getCompendiumItems(items, "races");
      const compendiumTraitsItems = await DDBItemImporter.getCompendiumItems(items, "traits");
      const compendiumBackgroundsItems = await DDBItemImporter.getCompendiumItems(items, "backgrounds");

      compendiumItems = compendiumItems.concat(
        compendiumInventoryItems,
        compendiumSpellItems,
        compendiumFeatureItems,
        compendiumClassItems,
        compendiumSubClassItems,
        compendiumRaceItems,
        compendiumTraitsItems,
        compendiumBackgroundsItems,
      );
      // remove existing items from those to be imported
      items = await DDBCharacterManager.removeItems(items, compendiumItems);
    }

    // import remaining items to character
    if (items.length > 0) {
      this.showCurrentTask("Adding DDB generated items");
      logger.debug(`Adding DDB generated items...`, items);
      items = await this.enrichCharacterItems(items);
      await this.importCharacterItems(items, true);
    }

    // now import any compendium items that we matched
    if (this.settings.useExistingCompendiumItems) {
      this.showCurrentTask("Adding DDB compendium items");
      logger.info("Adding DDB compendium items:", compendiumItems);
      await this.createCharacterItems(compendiumItems, false);
    }

    if (this.settings.useSRDCompendiumItems) {
      this.showCurrentTask("Adding SRD compendium items");
      logger.info("Adding SRD compendium items:", srdCompendiumItems);
      await this.createCharacterItems(srdCompendiumItems, false);
    }

    if (this.settings.useOverrideCompendiumItems) {
      this.showCurrentTask("Adding Override compendium items");
      logger.info("Adding Override compendium items:", overrideCompendiumItems);
      await this.createCharacterItems(overrideCompendiumItems, false);
    }

    if (individualCompendiumItems.length > 0) {
      this.showCurrentTask("Adding Individual Override compendium items");
      logger.info("Adding Individual Override compendium items:", individualCompendiumItems);
      await this.createCharacterItems(individualCompendiumItems, false);
    }

    logger.debug("Finished importing items");
  }

  async preActiveEffects() {
    this.effectBackup = foundry.utils.duplicate(this.actor.effects);
    for (const e of this.effectBackup) {
      if (e.origin?.includes(".Item.")) {
        // eslint-disable-next-line no-await-in-loop
        const parent = await fromUuid(e.origin);
        logger.debug("Effect Backup flags", { e, parent });
        if (parent) foundry.utils.setProperty(e, "flags.ddbimporter.type", parent.type);
      }
    }
    await this.actor.deleteEmbeddedDocuments("ActiveEffect", [], { deleteAll: true });
  }

  async processActiveEffects() {
    logger.debug("Removing active effects");

    // remove current active effects
    const excludedItems = this.filterActorItemsByUserSelection(true);
    const ignoredItemIds = this.actorOriginal.items
      .filter((item) =>
        item.effects
        && item.effects.length > 0
        && (item.flags.ddbimporter?.ignoreItemImport
          || excludedItems.some((ei) => ei._id === item._id)
          || this.nonMatchedItemIds.includes(item._id)
        )
      )
      .map((item) => item._id);

    const itemEffects = this.effectBackup.filter((ae) =>
      ae.origin?.includes(".Item.")
    );
    const ignoredEffects = this.effectBackup.filter((ae) =>
      ignoredItemIds.includes(ae.origin?.split(".").slice(-1)[0])
    );
    const coreStatusEffects = this.effectBackup.filter((ae) => {
      const isStatus = ae.statuses.length > 0;
      const itemEffect = ae.origin?.includes(".Item.");
      return isStatus && !itemEffect;
    });
    // effects on the character that are not from items, or corestatuses
    // nor added by ddb importer
    const charEffects = this.effectBackup.filter((ae) =>
      !ignoredItemIds.some((id) => ae._id === id)
      && !ae.flags.ddbimporter?.characterEffect
      && !ae.statuses.length > 0
      && !ae.origin?.includes(".Item.")
    );
    // effects that are added by the ddb importer that are not item effects
    const ddbGeneratedCharEffects = this.effectBackup.filter((ae) =>
      !ae.origin?.includes(".Item.") && ae.flags.ddbimporter?.characterEffect
    );

    const spellEffects = [];
    for (const e of itemEffects) {
      const isOther = coreStatusEffects.some((ae) => ae._id === e._id)
        || charEffects.some((ae) => ae._id === e._id)
        || ddbGeneratedCharEffects.some((ae) => ae._id === e._id);
      if (!isOther && foundry.utils.getProperty(e, "flags.ddbimporter.type") === "spell") {
        spellEffects.push(e);
      }
    }

    const remainingEffects = this.effectBackup
      .filter((e) =>
        // remove existing active item effects
        !itemEffects.map((ae) => ae._id).includes(e._id)
        // clear down ddb generated character effects such as skill bonuses
        && !ddbGeneratedCharEffects.map((ae) => ae._id).includes(e._id)
        // ignored effects always remain
        && !ignoredEffects.map((ae) => ae._id).includes(e._id)
        // clear down char effects
        && !charEffects.map((ae) => ae._id).includes(e._id)
        // clear down status effects
        && !coreStatusEffects.map((ae) => ae._id).includes(e._id)
        // ignore spell effects
        && !spellEffects.map((ae) => ae._id).includes(e._id)
      );

    logger.debug("Effect Removal Results", {
      ignoredItemIds, itemEffects, ignoredEffects, charEffects, coreStatusEffects, spellEffects,
      ddbGeneratedCharEffects, remainingEffects, backupEffects: this.effectBackup,
    });

    // are we trying to retain existing effects?
    if (this.settings.activeEffectCopy) {
      // add retained character effects to result
      const effects = ignoredEffects.concat(charEffects, coreStatusEffects, spellEffects, remainingEffects);
      this.result.character.effects = this.result.character.effects.concat(effects);
    } else {
      this.result.character.effects = this.result.character.effects.concat(ignoredEffects);
    }
  }

  fixUpCharacterEffects() {
    // if (!CONFIG.ActiveEffect.legacyTransferral) return;
    let abilityOverrides = abilityOverrideEffects(this.result.character.flags.ddbimporter.dndbeyond.abilityOverrides);
    if (abilityOverrides.changes.length > 0) {
      this.result.character.effects = this.result.character.effects.concat(abilityOverrides);
    }
    this.result.character.effects = this.result.character.effects.filter((e) => e !== undefined);
    this.result.character.effects.forEach((effect) => {
      const origins = ["Ability.Override", "AC", `Actor.${this.actor.flags.ddbimporter.dndbeyond.characterId}`];
      if (origins.includes(effect.origin)) {
        effect.origin = `Actor.${this.actor.id}`;
      }
    });
  }

  async addImportIdToItems() {
    const importId = this.importId;
    function addImportId(items) {
      return items.map((item) => {
        foundry.utils.setProperty(item, "flags.ddbimporter.importId", importId);
        return item;
      });
    }
    this.result.actions = addImportId(this.result.actions);
    this.result.classes = addImportId(this.result.classes);
    this.result.features = addImportId(this.result.features);
    this.result.inventory = addImportId(this.result.inventory);
    this.result.itemSpells = addImportId(this.result.itemSpells);
    this.result.spells = addImportId(this.result.spells);
  }

  async resetActor() {
    await this.actor.deleteEmbeddedDocuments("Item", [], {
      deleteAll: true,
      itemsWithSpells5e: { alsoDeleteChildSpells: false },
    });
    await this.actor.deleteEmbeddedDocuments("ActiveEffect", [], { deleteAll: true });
    await this.actor.update(this.actorOriginal, { recursive: true, keepId: true });
  }

  getSettings() {
    this.settings = {
      updatePolicyName: game.settings.get("ddb-importer", "character-update-policy-name"),
      updatePolicyHP: game.settings.get("ddb-importer", "character-update-policy-hp"),
      updatePolicyHitDie: game.settings.get("ddb-importer", "character-update-policy-hit-die"),
      updatePolicyCurrency: game.settings.get("ddb-importer", "character-update-policy-currency"),
      updatePolicyBio: game.settings.get("ddb-importer", "character-update-policy-bio"),
      updatePolicySpellUse: game.settings.get("ddb-importer", "character-update-policy-spell-use"),
      updatePolicyLanguages: game.settings.get("ddb-importer", "character-update-policy-languages"),
      updatePolicyImage: game.settings.get("ddb-importer", "character-update-policy-image"),
      activeEffectCopy: game.settings.get("ddb-importer", "character-update-policy-active-effect-copy"),
      daeEffectCopy: game.settings.get("ddb-importer", "character-update-policy-dae-effect-copy"),
      addItemEffects: game.settings.get("ddb-importer", "character-update-policy-add-item-effects"),
      addCharacterEffects: game.settings.get("ddb-importer", "character-update-policy-add-character-effects"),
      ignoreNonDDBItems: game.settings.get("ddb-importer", "character-update-policy-ignore-non-ddb-items"),
      useExistingCompendiumItems: game.settings.get("ddb-importer", "character-update-policy-use-existing"),
      useSRDCompendiumItems: game.settings.get("ddb-importer", "character-update-policy-use-srd"),
      useOverrideCompendiumItems: game.settings.get("ddb-importer", "character-update-policy-use-override"),
      useChrisPremades: game.settings.get("ddb-importer", "character-update-policy-use-chris-premades")
        && (game.modules.get("chris-premades")?.active ?? false),
    };
  }

  async processCharacterData() {
    this.getSettings();
    if (!CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured) {
      // eslint-disable-next-line require-atomic-updates
      CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured = await DDBMacros.configureDependencies();
    }
    this.result = foundry.utils.deepClone(this.ddbCharacter.data);

    // disable active sync
    const activeUpdateState = this.ddbCharacter.getCurrentDynamicUpdateState();
    await this.ddbCharacter.disableDynamicUpdates();

    try {
      this.importId = foundry.utils.randomID();
      foundry.utils.setProperty(this.result.character, "flags.ddbimporter.importId", this.importId);
      await this.addImportIdToItems();

      // handle active effects
      this.showCurrentTask("Calculating Active Effect Changes");
      this.fixUpCharacterEffects();
      await this.preActiveEffects();
      // we need to process the items first to find out if we are ignoring any effects
      let items = await this.fetchCharacterItems();
      await this.processActiveEffects();

      // update image
      await this.updateImage();

      // manage updates of basic character data more intelligently
      // revert some data if update not wanted
      if (!this.settings.updatePolicyName) {
        this.result.character.name = this.actorOriginal.name;
        this.result.character.prototypeToken.name = this.actorOriginal.prototypeToken.name;
      }
      if (!this.settings.updatePolicyHP) {
        this.result.character.system.attributes.hp = this.actorOriginal.system.attributes.hp;
      }
      if (!this.settings.updatePolicyHitDie) {
        this.result.character.system.attributes.hd = this.actorOriginal.system.attributes.hd;
        this.result.classes = this.result.classes.map((klass) => {
          const originalKlass = this.actorOriginal.items.find(
            (original) => original.name === klass.name && original.type === "class"
          );
          if (originalKlass) {
            klass.system.hitDiceUsed = originalKlass.system.hitDiceUsed;
          }
          return klass;
        });
      }
      if (!this.settings.updatePolicyCurrency) {
        this.result.character.system.currency = this.actorOriginal.system.currency;
      }
      if (!this.settings.updatePolicyBio) {
        const bioUpdates = ["alignment", "appearance", "background", "biography", "bond", "flaw", "ideal", "trait"];
        bioUpdates.forEach((option) => {
          this.result.character.system.details[option] = this.actorOriginal.system.details[option];
        });
      }
      if (!this.settings.updatePolicySpellUse) {
        this.result.character.system.spells = this.actorOriginal.system.spells;
      }
      if (!this.settings.updatePolicyLanguages) {
        this.result.character.system.traits.languages = this.actorOriginal.system.traits.languages;
      }
      // if resource mode is in disable and not asking, then we use the previous resources
      const resourceFlags = foundry.utils.getProperty(this.result.character, "flags.ddbimporter.resources");
      if (resourceFlags.type === "disable") {
        this.result.character.system.resources = foundry.utils.duplicate(this.actorOriginal.system.resources);
      }

      // flag as having items ids
      this.result.character.flags.ddbimporter["syncItemReady"] = true;
      this.result.character.flags.ddbimporter["syncActionReady"] = true;
      this.result.character.flags.ddbimporter["activeUpdate"] = false;
      this.result.character.flags.ddbimporter["activeSyncSpells"] = true;
      // remove unneeded flags (used for character parsing)
      this.result.character.flags.ddbimporter.dndbeyond["templateStrings"] = null;
      this.result.character.flags.ddbimporter.dndbeyond["characterValues"] = null;
      this.result.character.flags.ddbimporter.dndbeyond["proficiencies"] = null;
      this.result.character.flags.ddbimporter.dndbeyond["proficienciesIncludingEffects"] = null;
      this.result.character.flags.ddbimporter.dndbeyond["effectAbilities"] = null;
      this.result.character.flags.ddbimporter.dndbeyond["abilityOverrides"] = null;
      foundry.utils.setProperty(this.result.character.flags, "ddb-importer.version", CONFIG.DDBI.version);

      if (this.actorOriginal.flags.dnd5e?.wildMagic === true) {
        this.result.character.flags.dnd5e["wildMagic"] = true;
      }

      // midi fixes
      const actorOnUseMacroName = foundry.utils.getProperty(this.result.character, "flags.midi-qol.onUseMacroName");
      if (!actorOnUseMacroName || actorOnUseMacroName === "") {
        foundry.utils.setProperty(this.result.character, "flags.midi-qol.onUseMacroName", "[postActiveEffects]");
      }

      // basic import
      this.showCurrentTask("Updating core character information");
      logger.debug("Character data importing: ", this.result.character);
      await this.actor.update(this.result.character);

      // copy existing journal notes
      this.copyExistingJournalNotes();

      // items import
      await this.processCharacterItems(items);

      if (this.settings.activeEffectCopy) {
        // find effects with a matching name that existed on previous actor
        // and that have a different active state and activate them
        const targetEffects = this.actor.effects.filter((ae) => {
          const previousEffectDiff = this.actorOriginal.effects.find(
            (oae) => oae.name === ae.name && oae.disabled !== ae.disabled
          );
          if (previousEffectDiff) return true;
          return false;
        });
        const updatedEffects = targetEffects.map((ae) => {
          return { _id: ae._id, disabled: !ae.disabled };
        });
        await this.actor.updateEmbeddedDocuments("ActiveEffect", updatedEffects);
      }

      const favorites = foundry.utils.deepClone(this.actorOriginal.system.favorites ?? []);
      if (favorites.length > 0) {
        await this.actor.update({ system: { favorites } });
      }

      await this.ddbCharacter.autoLinkResources();

      if (this.settings.useChrisPremades) {
        await ExternalAutomations.addChrisEffectsToActorDocuments(this.actor);
      }
      await setConditions(this.actor, this.ddbCharacter.source.ddb, this.settings.activeEffectCopy);

    } catch (error) {
      logger.error("Error importing character: ", { error, ddbCharacter: this.ddbCharacter, result: this.result });
      logger.error(error.stack);
      this.showCurrentTask("Error importing character, attempting rolling back, see console (F12) for details.", error, true);
      await this.resetActor();
      throw new Error("ImportFailure");
    } finally {
      await this.ddbCharacter.updateDynamicUpdates(activeUpdateState);
      this.actor.render();
    }
  }
}

export async function importCharacter(actor, html) {
  try {
    const actorData = actor.toObject();
    const characterId = actorData.flags.ddbimporter.dndbeyond.characterId;

    const ddbCharacterOptions = {
      currentActor: actor,
      characterId,
      selectResources: true
    };
    const getOptions = {
      syncId: null,
      localCobaltPostFix: actorData._id,
    };
    const ddbCharacter = new DDBCharacter(ddbCharacterOptions);
    await ddbCharacter.getCharacterData(getOptions);

    logger.debug("import.js importCharacter getCharacterData result", ddbCharacter.source);
    if (game.settings.get("ddb-importer", "debug-json")) {
      FileHelper.download(JSON.stringify(ddbCharacter.source), `${characterId}.json`, "application/json");
    }
    if (ddbCharacter.source.success) {
      // begin parsing the character data
      const importer = new DDBCharacterManager(DDBCharacterManager.defaultOptions, actorData, ddbCharacter);
      importer.html = html ? html : utils.htmlToDoc("");
      await importer.processCharacterData();
      importer.showCurrentTask("Loading Character data", "Done.", false);
      logger.info("Loading Character data");
      return true;
    } else {
      logger.error("Error Loading Character data", { message: ddbCharacter.source.message, ddbCharacter });
      return false;
    }
  } catch (error) {
    switch (error.message) {
      case "ImportFailure":
        logger.error("Failure");
        break;
      case "Forbidden":
        logger.error("Error retrieving Character: ", error);
        break;
      default:
        logger.error("Error processing Character: ", error);
        logger.error(error.stack);
        break;
    }
    return false;
  }
}

export async function importCharacterById(characterId, html) {
  const actor = await Actor.create({
    name: "New Actor",
    type: "character",
    flags: {
      ddbimporter: {
        dndbeyond: {
          characterId: characterId,
          url: `https://www.dndbeyond.com/characters/${characterId}`,
        },
      },
    },
  });

  const result = await importCharacter(actor, html);
  return result;
}
