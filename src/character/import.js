import utils from "../utils.js";
import logger from "../logger.js";
import { parseJson } from "../parser/character.js";
import {
  copySupportedItemFlags,
  addMagicItemSpells,
  getCompendiumItems,
  getSRDCompendiumItems,
  copySRDIcons,
  getDDBEquipmentIcons,
  getDDBSpellSchoolIcons,
  getDDBGenericItemIcons,
  addItemEffectIcons,
  retainExistingIcons,
} from "../muncher/import.js";
import { download, getCampaignId, getCompendiumType } from "../muncher/utils.js";
import { addItemsDAESRD } from "../muncher/dae.js";
import { copyInbuiltIcons } from "../icons/index.js";
import { updateDDBCharacter } from "./update.js";
import { generateCharacterExtras } from "../muncher/extras/extras.js";
import DICTIONARY from "../dictionary.js";
import { getCobalt, isLocalCobalt, deleteLocalCobalt } from "../lib/Secrets.js";
import { DDBCookie } from "../lib/Settings.js";
import { importCacheLoad } from "../parser/templateStrings.js";
import { abilityOverrideEffects } from "../effects/abilityOverrides.js";
import {
  getCharacterImportSettings,
  updateActorSettings,
  setRecommendedCharacterActiveEffectSettings,
} from "../muncher/settings.js";
import { getCurrentDynamicUpdateState, updateDynamicUpdates, disableDynamicUpdates } from "./utils.js";
import { setConditions } from "./conditions.js";
import { autoLinkResources } from "../parser/character/resources.js";
import { addContainerItemsToContainers, addContainerItemsToActor } from "./itemCollections.js";

const FILTER_SECTIONS = ["classes", "features", "actions", "inventory", "spells"];

const DISABLE_FOUNDRY_UPGRADE = {
  applyFeatures: false,
  addFeatures: false,
  promptAddFeatures: false,
};

// reference to the D&D Beyond popup
const POPUPS = {
  json: null,
  web: null,
};
const renderPopup = (type, url) => {
  if (POPUPS[type] && !POPUPS[type].close) {
    POPUPS[type].focus();
    POPUPS[type].location.href = url;
  } else {
    const ratio = window.innerWidth / window.innerHeight;
    const width = Math.round(window.innerWidth * 0.5);
    const height = Math.round(window.innerWidth * 0.5 * ratio);
    POPUPS[type] = window.open(
      url,
      "ddb_sheet_popup",
      `resizeable,scrollbars,location=no,width=${width},height=${height},toolbar=1`
    );
  }
  return true;
};

/**
 * Retrieves the character ID from a given URL, which can be one of the following:
 * - regular character sheet
 * - public sharing link
 * - direct link to the endpoint already
 * @param {string} url A given URL pointing to a character. Contains the character ID
 * @returns {string} characterId or null
 */
const getCharacterId = (url) => {
  const ddbNamePattern = /(?:https?:\/\/)?(?:www\.dndbeyond\.com|ddb\.ac)(?:\/profile\/.+)?\/characters\/(\d+)\/?/;
  const matches = url.match(ddbNamePattern);
  return matches ? matches[1] : null;
};

/**
 * Creates the Character Endpoint URL from a given character ID
 * @param {string} characterId The character ID
 * @returns {string|null} The API endpoint
 */
const getCharacterAPIEndpoint = (characterId) => {
  return characterId !== null ? `https://character-service.dndbeyond.com/character/v5/character/${characterId}` : null;
};

const getCharacterUpdatePolicyTypes = (invert = false) => {
  let itemTypes = ["background"];

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
};

/**
 * Returns a combined array of all items to process, filtered by the user's selection on what to skip and what to include
 * @param {object} result object containing all character items sectioned as individual properties
 * @param {array[string]} sections an array of object properties which should be filtered
 */
const filterItemsByUserSelection = (result, sections, invert = false) => {
  let items = [];
  const validItemTypes = getCharacterUpdatePolicyTypes(invert);

  for (const section of sections) {
    items = items.concat(result[section]).filter((item) => validItemTypes.includes(item.type));
  }
  return items;
};

const filterActorItemsByUserSelection = (actor, invert = false) => {
  const validItemTypes = getCharacterUpdatePolicyTypes(invert);

  const items = actor.items.filter((item) => validItemTypes.includes(item.type));

  return items;
};

const DEFAULT_CHARACTER_DATA_OPTIONS = {
  currentActorId: undefined,
  characterId: undefined,
  syncId: undefined,
  localCobaltPostFix: "",
  resourceSelection: true,
};

/**
 * Loads and parses character in the proxy
 * @param {*} options.characterId
 */

export async function getCharacterData(optionsIn) {
  const options = mergeObject(DEFAULT_CHARACTER_DATA_OPTIONS, optionsIn);
  const cobaltCookie = getCobalt(options.localCobaltPostFix);
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const campaignId = getCampaignId();
  const proxyCampaignId = campaignId === "" ? null : campaignId;
  let body = { cobalt: cobaltCookie, betaKey: betaKey, characterId: options.characterId, campaignId: proxyCampaignId };
  if (options.syncId) {
    body["updateId"] = options.syncId;
  }

  try {
    const response = await fetch(`${parsingApi}/proxy/v5/character`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow", // manual, *follow, error
      body: JSON.stringify(body), // body data type must match "Content-Type" header
    });
    const data = await response.json();
    if (!data.success) return data;

    // load some required content
    await importCacheLoad();

    // construct the expected { character: {...} } object
    let ddb = {};
    if (data.ddb.character === undefined) {
      ddb = {
        character: data.ddb,
        classOptions: data.ddb.classOptions,
        originOptions: data.ddb.originOptions,
        infusions: data.ddb.infusions,
      };
    } else {
      // fallback to old proxy style
      ddb = data.ddb;
    }

    logger.debug("DDB Data to parse:", duplicate(ddb));
    logger.debug("currentActorId", options.currentActorId);
    try {
      const character = await parseJson(options.currentActorId, ddb, options.resourceSelection);
      const shouldChangeName = game.settings.get("ddb-importer", "character-update-policy-name");
      if (!shouldChangeName) {
        character.character.name = undefined;
        const version = (game.version ?? game.data.version);
        const v10 = utils.versionCompare(version, "10.0") >= 0;
        if (v10) {
          character.character.prototypeToken.name = undefined;
        } else {
          character.character.token.name = undefined;
        }
      }
      data["character"] = character;
      return data;
    } catch (error) {
      const debugJson = game.settings.get("ddb-importer", "debug-json");
      if (debugJson) {
        download(JSON.stringify(data), `${options.characterId}-raw.json`, "application/json");
      }
      throw error;
    }
  } catch (error) {
    logger.error("JSON Fetch and Parse Error");
    logger.error(error);
    logger.error(error.stack);
    throw error;
  }
}

export default class CharacterImport extends FormApplication {
  constructor(options, actor) {
    super(options);
    this.actor = game.actors.get(actor.id ? actor.id : actor._id);
    this.migrateMetadata();
    this.actorOriginal = duplicate(this.actor);
    this.result = {};
    this.nonMatchedItemIds = [];
  }

  migrateMetadata() {
    if (this.actor.flags?.ddbimporter?.dndbeyond) {
      const url = this.actor.flags.ddbimporter.dndbeyond.url || this.actor.flags.ddbimporter.dndbeyond.roUrl;

      if (url && !this.actor.flags.ddbimporter.characterId) {
        const characterId = getCharacterId(url);
        if (characterId) {
          const apiEndpointUrl = getCharacterAPIEndpoint(characterId);
          this.actor.flags.ddbimporter.dndbeyond.characterId = characterId;
          this.actor.flags.ddbimporter.dndbeyond.apiEndpointUrl = apiEndpointUrl;
          this.actor.flags.ddbimporter.dndbeyond.url = url;
        } else {
          // clear the url, because it's malformed anyway
          this.actor.flags.ddbimporter.dndbeyond.url = null;
        }
      }
    }
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

  static showCurrentTask(html, title, message = null, isError = false) {
    let element = $(html).find(".task-name");
    element.html(`<h2 ${isError ? " style='color:red'" : ""}>${title}</h2>${message ? `<p>${message}</p>` : ""}`);
    $(html).parent().parent().css("height", "auto");
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
        copySupportedItemFlags(originalItem, item);
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
          const originalItem = this.actorOriginal.items.find(
            (originalItem) => item.name === originalItem.name && item.type === originalItem.type
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
   * - inventory: consumable, loot, tool and backpack
   * - spell
   */
  async clearItemsByUserSelection(excludedList = []) {
    const includedItems = getCharacterUpdatePolicyTypes();
    // collect all items belonging to one of those inventory item categories
    const ownedItems = this.actor.getEmbeddedCollection("Item");
    const toRemove = ownedItems
      .filter(
        (item) =>
          includedItems.includes(item.type) &&
          !excludedList.some((excluded) => excluded._id === item.id) &&
          !this.nonMatchedItemIds.includes(item.id)
      )
      .filter((item) => !item.flags.ddbimporter?.ignoreItemImport)
      .map((item) => item.id);

    logger.debug("Removing the following character items", toRemove);
    if (toRemove.length > 0) {
      await this.actor.deleteEmbeddedDocuments("Item", toRemove);
    }
    return toRemove;
  }

  async updateImage(html, data) {
    logger.debug("Checking if image needs updating");
    // updating the image?
    let imagePath = this.actor.img;
    const decorations = data.character.decorations;
    const userHasPermission = !(game.settings.get("ddb-importer", "restrict-to-trusted") && !game.user.isTrusted);
    if (
      userHasPermission &&
      decorations?.avatarUrl &&
      decorations.avatarUrl !== "" &&
      (imagePath.includes("mystery-man") || game.settings.get("ddb-importer", "character-update-policy-image"))
    ) {
      CharacterImport.showCurrentTask(html, "Uploading avatar image");
      const filename = data.character.name
        .replace(/[^a-zA-Z]/g, "-")
        .replace(/-+/g, "-")
        .trim();

      const uploadDirectory = game.settings.get("ddb-importer", "image-upload-directory").replace(/^\/|\/$/g, "");
      imagePath = await utils.uploadRemoteImage(decorations.avatarUrl, uploadDirectory, filename);
      this.result.character.img = imagePath;
      if (decorations?.frameAvatarUrl && decorations.frameAvatarUrl !== "") {
        const framePath = await utils.uploadRemoteImage(decorations.frameAvatarUrl, uploadDirectory, `frame-${filename}`);
        this.result.character.flags.ddbimporter["framePath"] = framePath;
      }
    } else {
      this.result.character.img = this.actor.img;
    }

    if (this.actorOriginal.prototypeToken.img.includes("mystery-man")) {
      this.result.character.prototypeToken.img = this.result.character.img;
    } else {
      this.result.character.prototypeToken.img = this.actorOriginal.prototypeToken.img;
    }
  }

  /* -------------------------------------------- */

  async getData() {
    // loads settings for actor
    const importSettings = getCharacterImportSettings();

    const characterId = this.actor.flags?.ddbimporter?.dndbeyond?.characterId;
    const syncEnabled = characterId && importSettings.tiers.all;

    const trustedUsersOnly = game.settings.get("ddb-importer", "restrict-to-trusted");
    const allowAllSync = game.settings.get("ddb-importer", "allow-all-sync");
    const syncOnly = trustedUsersOnly && allowAllSync && !game.user.isTrusted;

    const localCobalt = isLocalCobalt(this.actor.id);
    const cobaltCookie = getCobalt(this.actor.id);
    const cobaltSet = localCobalt && cobaltCookie && cobaltCookie != "";
    const itemCompendium = await getCompendiumType("item", false);

    const dynamicSync = game.settings.get("ddb-importer", "dynamic-sync");
    const updateUser = game.settings.get("ddb-importer", "dynamic-sync-user");
    const gmSyncUser = game.user.isGM && game.user.id == updateUser;
    const dynamicUpdateAllowed = dynamicSync && gmSyncUser && importSettings.tiers.experimentalMid;
    const dynamicUpdateStatus = this.actor.flags?.ddbimporter?.activeUpdate;
    const resourceSelection =
      !hasProperty(this.actor, "data.flags.ddbimporter.resources.ask") ||
      (hasProperty(this.actor, "data.flags.ddbimporter.resources.ask") &&
        this.actor.flags.ddbimporter.resources.ask);

    const itemsMunched = syncEnabled && itemCompendium ? (await itemCompendium.index.size) !== 0 : false;

    const actorSettings = {
      actor: this.actor,
      localCobalt: localCobalt,
      cobaltSet: cobaltSet,
      syncEnabled: syncEnabled && itemsMunched,
      importAllowed: !syncOnly,
      itemsMunched: itemsMunched,
      dynamicUpdateAllowed,
      dynamicUpdateStatus,
      resourceSelection,
    };

    return mergeObject(importSettings, actorSettings);
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
        updateActorSettings(html, event);
      });

    $(html)
      .find("#default-effects")
      .on("click", async (event) => {
        event.preventDefault();
        setRecommendedCharacterActiveEffectSettings(html);
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

        try {
          $(html).find("#dndbeyond-character-import-start").prop("disabled", true);
          CharacterImport.showCurrentTask(html, "Getting Character data");
          const characterId = this.actor.flags.ddbimporter.dndbeyond.characterId;
          const characterDataOptions = {
            currentActorId: this.actor.id,
            characterId: characterId,
            syncId: null,
            localCobaltPostFix: this.actor.id,
            resourceSelection: true,
          };
          const characterData = await getCharacterData(characterDataOptions);
          logger.debug("import.js getCharacterData result", characterData);
          const debugJson = game.settings.get("ddb-importer", "debug-json");
          if (debugJson) {
            download(JSON.stringify(characterData), `${characterId}.json`, "application/json");
          }
          if (characterData.success) {
            // begin parsing the character data
            await this.processCharacterData(html, characterData);
            CharacterImport.showCurrentTask(html, "Loading Character data", "Done.", false);
            this.close();
          } else {
            CharacterImport.showCurrentTask(html, characterData.message, null, true);
            return false;
          }
        } catch (error) {
          switch (error.message) {
            case "ImportFailure":
              logger.error("Failure");
              break;
            case "Forbidden":
              CharacterImport.showCurrentTask(html, "Error retrieving Character: " + error, error, true);
              break;
            default:
              logger.error(error);
              logger.error(error.stack);
              CharacterImport.showCurrentTask(html, "Error processing Character: " + error, error, true);
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
        try {
          $(html).find("#dndbeyond-character-update").prop("disabled", true);
          await updateDDBCharacter(this.actor).then((result) => {
            const updateNotes = result
              .flat()
              .filter((r) => r !== undefined)
              .map((r) => r.message)
              .join(" ");
            logger.debug(updateNotes);
            CharacterImport.showCurrentTask(html, "Update complete", updateNotes);
            $(html).find("#dndbeyond-character-update").prop("disabled", false);
          });
        } catch (error) {
          logger.error(error);
          logger.error(error.stack);
          CharacterImport.showCurrentTask(html, "Error updating character", error, true);
        }
      });

    $(html)
      .find("#delete-local-cobalt")
      .on("click", async () => {
        try {
          deleteLocalCobalt(this.actor.id);
          $(html).find("#delete-local-cobalt").prop("disabled", true);
        } catch (error) {
          logger.error(error);
          logger.error(error.stack);
          CharacterImport.showCurrentTask(html, "Error deleting local cookie", error, true);
        }
      });

    $(html)
      .find("#set-local-cobalt")
      .on("click", async () => {
        try {
          new DDBCookie({}, this.actor, true).render(true);
          $(html).find("#delete-local-cobalt").prop("disabled", false);
        } catch (error) {
          logger.error(error);
          logger.error(error.stack);
          CharacterImport.showCurrentTask(html, "Error updating character", error, true);
        }
      });

    $(html)
      .find("#dndbeyond-character-extras-start")
      .on("click", async () => {
        try {
          $(html).find("#dndbeyond-character-extras-start").prop("disabled", true);
          CharacterImport.showCurrentTask(html, "Fetching character data");
          const characterId = this.actor.flags.ddbimporter.dndbeyond.characterId;
          const characterDataOptions = {
            currentActorId: this.actor.id,
            characterId: characterId,
            syncId: null,
            localCobaltPostFix: this.actor.id,
            resourceSelection: false,
          };
          const characterData = await getCharacterData(characterDataOptions);
          logger.debug("import.js getCharacterData result", characterData);
          const debugJson = game.settings.get("ddb-importer", "debug-json");
          if (debugJson) {
            download(JSON.stringify(characterData), `${characterId}.json`, "application/json");
          }
          if (characterData.success) {
            await generateCharacterExtras(html, characterData, this.actor);
            CharacterImport.showCurrentTask(html, "Loading Extras", "Done.", false);
            $(html).find("#dndbeyond-character-extras-start").prop("disabled", true);
            this.close();
          } else {
            CharacterImport.showCurrentTask(html, characterData.message, null, true);
            return false;
          }
        } catch (error) {
          switch (error.message) {
            case "ImportFailure":
              logger.error("Failure");
              break;
            case "Forbidden":
              CharacterImport.showCurrentTask(html, "Error retrieving Character: " + error, error, true);
              break;
            default:
              logger.error(error);
              logger.error(error.stack);
              CharacterImport.showCurrentTask(html, "Error processing Character: " + error, error, true);
              break;
          }
          return false;
        }
        return true;
      });

    $(html)
      .find("input[name=dndbeyond-url]")
      .on("input", async (event) => {
        let URL = event.target.value;
        const characterId = getCharacterId(URL);

        if (characterId) {
          const apiEndpointUrl = getCharacterAPIEndpoint(characterId);
          $(html)
            .find(".dndbeyond-url-status i")
            .replaceWith('<i class="fas fa-check-circle" style="color: green"></i>');
          $(html).find("span.dndbeyond-character-id").text(characterId);
          $(html).find("#dndbeyond-character-import-start").prop("disabled", false);
          $(html).find("#open-dndbeyond-url").prop("disabled", false);

          CharacterImport.showCurrentTask(html, "Saving reference");
          await this.actor.update({
            "flags.ddbimporter.dndbeyond": {
              url: URL,
              apiEndpointUrl,
              characterId,
            },
          });
          CharacterImport.showCurrentTask(html, "Status");
        } else {
          CharacterImport.showCurrentTask(
            html,
            "URL format incorrect",
            "That seems not to be the URL we expected...",
            true
          );
          $(html)
            .find(".dndbeyond-url-status i")
            .replaceWith('<i class="fas fa-exclamation-triangle" style="color:red"></i>');
        }
      });

    $(html)
      .find("#open-dndbeyond-url")
      .on("click", () => {
        try {
          const characterId = this.actor.flags.ddbimporter.dndbeyond.characterId;
          const apiEndpointUrl = getCharacterAPIEndpoint(characterId);
          renderPopup("json", apiEndpointUrl);
        } catch (error) {
          CharacterImport.showCurrentTask(html, "Error opening JSON URL", error, true);
        }
      });
  }

  async enrichCharacterItems(html, items) {
    const useInbuiltIcons = game.settings.get("ddb-importer", "character-update-policy-use-inbuilt-icons");
    const useSRDCompendiumItems = game.settings.get("ddb-importer", "character-update-policy-use-srd");
    const useSRDCompendiumIcons = game.settings.get("ddb-importer", "character-update-policy-use-srd-icons");
    const ddbSpellIcons = game.settings.get("ddb-importer", "character-update-policy-use-ddb-spell-icons");
    const ddbItemIcons = game.settings.get("ddb-importer", "character-update-policy-use-ddb-item-icons");
    const ddbGenericItemIcons = game.settings.get("ddb-importer", "character-update-policy-use-ddb-generic-item-icons");
    const activeEffectCopy = game.settings.get("ddb-importer", "character-update-policy-active-effect-copy");
    const daeEffectCopy = game.settings.get("ddb-importer", "character-update-policy-dae-effect-copy");
    const daeSRDInstalled = game.modules.get("Dynamic-Effects-SRD")?.active;
    const daeMidiInstalled = game.modules.get("midi-srd")?.active;
    const daeInstalled = game.modules.get("dae")?.active;
    const addItemEffects = game.settings.get("ddb-importer", "character-update-policy-add-item-effects");
    const addCharacterEffects = game.settings.get("ddb-importer", "character-update-policy-add-character-effects");

    // if we still have items to add, add them
    if (items.length > 0) {
      CharacterImport.showCurrentTask(html, "Copying existing data flags");
      await this.copySupportedCharacterItemFlags(items);

      if (ddbItemIcons) {
        CharacterImport.showCurrentTask(html, "Fetching DDB Inventory Images");
        items = await getDDBEquipmentIcons(items, true);
      }

      if (useInbuiltIcons) {
        CharacterImport.showCurrentTask(html, "Adding SRD Icons");
        items = await copyInbuiltIcons(items);
      }

      if (useSRDCompendiumIcons && !useSRDCompendiumItems) {
        CharacterImport.showCurrentTask(html, "Adding SRD Icons");
        items = await copySRDIcons(items);
      }

      if (ddbSpellIcons) {
        CharacterImport.showCurrentTask(html, "Fetching DDB Spell School Images");
        items = await getDDBSpellSchoolIcons(items, true);
      }

      if (ddbGenericItemIcons) {
        CharacterImport.showCurrentTask(html, "Fetching DDB Generic Item Images");
        items = await getDDBGenericItemIcons(items, true);
      }

      if (activeEffectCopy) {
        CharacterImport.showCurrentTask(html, "Copying Item Active Effects");
        items = await this.copyCharacterItemEffects(items);
      }

      if (daeEffectCopy && daeInstalled && (daeSRDInstalled || daeMidiInstalled)) {
        CharacterImport.showCurrentTask(html, "Importing DAE Effects");
        items = await addItemsDAESRD(items);
      }

      if (daeInstalled && (addItemEffects || addCharacterEffects)) {
        items = await addItemEffectIcons(items);
      }

      items = await retainExistingIcons(items);
    }

    items = items.map((item) => {
      if (!item.effects) item.effects = [];
      return item;
    });

    return Promise.all(items);
  }

  async createCharacterItems(items, keepIds) {
    const options = duplicate(DISABLE_FOUNDRY_UPGRADE);
    if (keepIds) options["keepId"] = true;

    // we have to break these out into class and non-class because of
    // https://gitlab.com/foundrynet/foundryvtt/-/issues/5312
    const klassItems = items.filter((item) => ["class", "subclass"].includes(item.type));
    const nonKlassItems = items.filter((item) => !["class", "subclass"].includes(item.type));

    logger.debug(`Adding the following class items, keep Ids? ${keepIds}`, duplicate(klassItems));
    await this.actor.createEmbeddedDocuments("Item", klassItems, options);

    logger.debug(`Adding the following non-class items, keep Ids? ${keepIds}`, duplicate(nonKlassItems));
    await this.actor.createEmbeddedDocuments("Item", nonKlassItems, options);
  }

  async importCharacterItems(html, items, keepIds = false) {
    if (items.length > 0) {
      CharacterImport.showCurrentTask(html, "Adding items to character");

      const newItems = items.filter((i) => !i._id || i._id === null || i._id === undefined);
      const updateItems = items.filter((i) => i._id && i._id !== null && i._id !== undefined);

      await this.createCharacterItems(newItems, false);
      await this.createCharacterItems(updateItems, keepIds);
    }
  }

  async keepNonDDBItems(ddbItems) {
    const lastImportId = getProperty(this.actorOriginal, "flags.ddbimporter.importId");
    const ignoreNonDDBItems = game.settings.get("ddb-importer", "character-update-policy-ignore-non-ddb-items");
    if (ignoreNonDDBItems) {
      const items = this.actor.getEmbeddedCollection("Item");
      await items.forEach((item) => {
        const ddbMatchedItem = ddbItems.some((ddbItem) =>
          item.name === ddbItem.name &&
          item.type === ddbItem.type &&
          item.flags?.ddbimporter?.id === ddbItem.flags?.ddbimporter?.id
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

  // checks for existing items, and depending on options will keep or replace with imported item
  async mergeExistingItems(html, items) {
    if (this.actorOriginal.flags.ddbimporter) {
      const ownedItems = this.actor.getEmbeddedCollection("Item");

      let nonMatchedItems = [];
      let matchedItems = [];

      await items.forEach((item) => {
        let ddbMatchedItem = ownedItems.find((owned) => {
          const simpleMatch =
            item.name === owned.name &&
            item.type === owned.type &&
            item.flags?.ddbimporter?.id === owned.flags?.ddbimporter?.id;
          const isChoice =
            hasProperty(item, "flags.ddbimporter.dndbeyond.choice.choiceId") &&
            hasProperty(owned, "data.flags.ddbimporter.dndbeyond.choice.choiceId");
          const choiceMatch = isChoice
            ? item.flags.ddbimporter.dndbeyond.choice.choiceId ===
              owned.flags.ddbimporter.dndbeyond.choice.choiceId
            : true;

          return simpleMatch && choiceMatch;
        });

        if (ddbMatchedItem) {
          if (!ddbMatchedItem.flags.ddbimporter?.ignoreItemImport) {
            item["_id"] = ddbMatchedItem["id"];
            if (ddbMatchedItem.flags.ddbimporter?.ignoreIcon) {
              item.flags.ddbimporter.matchedImg = ddbMatchedItem.img;
              item.flags.ddbimporter.ignoreIcon = true;
            }
            if (ddbMatchedItem.flags.ddbimporter?.retainResourceConsumption) {
              item.system.consume = ddbMatchedItem.system.consume;
              item.flags.ddbimporter.retainResourceConsumption = true;
              if (hasProperty(ddbMatchedItem, "data.flags.link-item-resource-5e")) {
                setProperty(item, "flags.link-item-resource-5e", ddbMatchedItem.flags["link-item-resource-5e"]);
              }
            }

            matchedItems.push(item);
          }
        } else {
          nonMatchedItems.push(item);
        }
      });

      logger.debug("Finished retaining items");
      return nonMatchedItems.concat(matchedItems);
    } else {
      return items;
    }
  }

  async fetchCharacterItems(html) {
    const magicItemsInstalled = game.modules.get("magicitems")?.active;
    // items for actor
    let items = [];

    // process spells for magic items
    if (magicItemsInstalled && this.result.itemSpells && Array.isArray(this.result.itemSpells)) {
      CharacterImport.showCurrentTask(html, "Preparing magicitem spells");
      await addMagicItemSpells(this.result);
    }

    logger.debug("Calculating items to create and update...");
    CharacterImport.showCurrentTask(html, "Calculating items to create and update...");
    items = filterItemsByUserSelection(this.result, FILTER_SECTIONS);

    logger.debug("Checking existing items for details...");
    CharacterImport.showCurrentTask(html, "Checking existing items for details...");

    items = await this.mergeExistingItems(html, items);
    await this.keepNonDDBItems(items);

    logger.debug("Removing found items...");
    CharacterImport.showCurrentTask(html, "Clearing items for recreation...");
    await this.clearItemsByUserSelection();

    // If there is no magicitems module fall back to importing the magic
    // item spells as normal spells fo the character
    if (!magicItemsInstalled) {
      logger.debug("No magic items module found, adding spells to sheet.");
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

  async processCharacterItems(html, items) {
    let compendiumItems = [];
    let srdCompendiumItems = [];
    let overrideCompendiumItems = [];
    const useExistingCompendiumItems = game.settings.get("ddb-importer", "character-update-policy-use-existing");
    const useSRDCompendiumItems = game.settings.get("ddb-importer", "character-update-policy-use-srd");
    const useOverrideCompendiumItems = game.settings.get("ddb-importer", "character-update-policy-use-override");

    /**
     * First choice is override compendium
     */
    if (useOverrideCompendiumItems) {
      logger.info("Removing matching Override compendium items");
      const compendiumOverrideItems = await getCompendiumItems(items, "custom");
      overrideCompendiumItems = compendiumOverrideItems;
      // remove existing items from those to be imported
      items = await CharacterImport.removeItems(items, overrideCompendiumItems);
    }
    /**
     * If SRD is selected, we prefer this
     */
    if (useSRDCompendiumItems) {
      logger.info("Removing compendium items");
      const compendiumFeatureItems = await getSRDCompendiumItems(items, "features");
      const compendiumInventoryItems = await getSRDCompendiumItems(items, "inventory");
      const compendiumSpellItems = await getSRDCompendiumItems(items, "spells");

      srdCompendiumItems = compendiumItems.concat(
        compendiumInventoryItems,
        compendiumSpellItems,
        compendiumFeatureItems
      );
      // remove existing items from those to be imported
      items = await CharacterImport.removeItems(items, srdCompendiumItems);
    }

    if (useExistingCompendiumItems) {
      logger.info("Removing compendium items");
      const compendiumFeatureItems = await getCompendiumItems(items, "features");
      const compendiumInventoryItems = await getCompendiumItems(items, "inventory");
      const compendiumSpellItems = await getCompendiumItems(items, "spells");
      const compendiumClassItems = await getCompendiumItems(items, "classes");
      const compendiumsubClassItems = await getCompendiumItems(items, "subclasses");
      const compendiumRaceItems = await getCompendiumItems(items, "races");
      const compendiumTraitsItems = await getCompendiumItems(items, "traits");
      const compendiumBackgroundsItems = await getCompendiumItems(items, "backgrounds");

      compendiumItems = compendiumItems.concat(
        compendiumInventoryItems,
        compendiumSpellItems,
        compendiumFeatureItems,
        compendiumClassItems,
        compendiumsubClassItems,
        compendiumRaceItems,
        compendiumTraitsItems,
        compendiumBackgroundsItems,
      );
      // remove existing items from those to be imported
      items = await CharacterImport.removeItems(items, compendiumItems);
    }

    // import remaining items to character
    if (items.length > 0) {
      CharacterImport.showCurrentTask(html, "Adding DDB generated items");
      logger.debug(`Adding DDB generated items...`, items);
      items = await this.enrichCharacterItems(html, items);
      await this.importCharacterItems(html, items, true);
    }

    // now import any compendium items that we matched
    if (useExistingCompendiumItems) {
      CharacterImport.showCurrentTask(html, "Adding DDB compendium items");
      logger.info("Adding DDB compendium items:", compendiumItems);
      await this.createCharacterItems(compendiumItems, false);
    }

    if (useSRDCompendiumItems) {
      CharacterImport.showCurrentTask(html, "Adding SRD compendium items");
      logger.info("Adding SRD compendium items:", srdCompendiumItems);
      await this.createCharacterItems(srdCompendiumItems, false);
    }

    if (useOverrideCompendiumItems) {
      CharacterImport.showCurrentTask(html, "Adding Override compendium items");
      logger.info("Adding Override compendium items:", overrideCompendiumItems);
      await this.createCharacterItems(overrideCompendiumItems, false);
    }

    logger.debug("Finished importing items");
  }

  async removeActiveEffects(activeEffectCopy) {
    logger.debug("Removing active effects");
    // remove current active effects
    const excludedItems = filterActorItemsByUserSelection(this.actorOriginal, true);
    const ignoredItemIds = this.actorOriginal.items
      .filter(
        (item) =>
          item.effects &&
          item.effects.length > 0 &&
          (item.flags.ddbimporter?.ignoreItemImport ||
            excludedItems.some((ei) => ei._id === item._id) ||
            this.nonMatchedItemIds.includes(item._id))
      )
      .map((item) => item._id);

    const itemEffects = this.actor.effects.filter(
      (ae) => ae.origin?.includes(".Item.") && !ignoredItemIds.includes(ae.origin?.split(".").slice(-1)[0])
    );
    const ignoredEffects = this.actor.effects.filter(
      (ae) =>
        // is this an ignored item
        ignoredItemIds.includes(ae.origin?.split(".").slice(-1)[0]) ||
        // is this a core status effect (CUB)
        ae.flags?.core?.statusId
    );
    const charEffects = this.actor.effects.filter(
      (ae) => !ae.origin?.includes(".Item.") && !ae.flags.ddbimporter?.characterEffect
    );
    const ddbGeneratedCharEffects = this.actor.effects.filter(
      (ae) => !ae.origin?.includes(".Item.") && ae.flags.ddbimporter?.characterEffect
    );

    // remove existing active item effects
    await this.actor.deleteEmbeddedDocuments(
      "ActiveEffect",
      itemEffects.map((ae) => ae.id)
    );
    // clear down ddb generated character effects such as skill bonuses
    await this.actor.deleteEmbeddedDocuments(
      "ActiveEffect",
      ddbGeneratedCharEffects.map((ae) => ae.id)
    );

    // are we trying to retain existing effects?
    if (activeEffectCopy) {
      // add retained character effects to result
      this.result.character.effects = this.result.character.effects.concat(charEffects, ignoredEffects);
    } else {
      // if not retaining effects remove character effects
      await this.actor.deleteEmbeddedDocuments(
        "ActiveEffect",
        charEffects.map((ae) => ae.id)
      );
      this.result.character.effects = this.result.character.effects.concat(ignoredEffects);
    }

  }

  fixUpCharacterEffects(character) {
    let abilityOverrides = abilityOverrideEffects(character.flags.ddbimporter.dndbeyond.abilityOverrides);
    if (abilityOverrides.changes.length > 0) {
      character.effects = character.effects.concat(abilityOverrides);
    }

    character.effects.forEach((effect) => {
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
        setProperty(item, "flags.ddbimporter.importId", importId);
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
    await this.actor.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
    await this.actor.deleteEmbeddedDocuments("ActiveEffect", [], { deleteAll: true });
    await this.actor.update(this.actorOriginal, { recursive: true, keepId: true });
  }

  async processCharacterData(html, data) {
    this.result = data.character;

    // disable active sync
    const activeUpdateState = getCurrentDynamicUpdateState(this.actor);
    await disableDynamicUpdates(this.actor);

    try {
      await addContainerItemsToActor(data.ddb, this.actor);

      this.importId = randomID();
      setProperty(this.result.character, "flags.ddbimporter.importId", this.importId);
      await this.addImportIdToItems();

      logger.debug("Current Actor:", this.actorOriginal);

      // handle active effects
      const activeEffectCopy = game.settings.get("ddb-importer", "character-update-policy-active-effect-copy");
      CharacterImport.showCurrentTask(html, "Calculating Active Effect Changes");
      this.fixUpCharacterEffects(this.result.character);
      let items = await this.fetchCharacterItems(html);
      await this.removeActiveEffects(activeEffectCopy);

      // update image
      await this.updateImage(html, data.ddb);

      // manage updates of basic character data more intelligently
      // revert some data if update not wanted
      if (!game.settings.get("ddb-importer", "character-update-policy-hp")) {
        this.result.character.system.attributes.hp = this.actorOriginal.system.attributes.hp;
      }
      if (!game.settings.get("ddb-importer", "character-update-policy-hit-die")) {
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
      if (!game.settings.get("ddb-importer", "character-update-policy-currency")) {
        this.result.character.system.currency = this.actorOriginal.system.currency;
      }
      if (!game.settings.get("ddb-importer", "character-update-policy-bio")) {
        const bioUpdates = ["alignment", "appearance", "background", "biography", "bond", "flaw", "ideal", "trait"];
        bioUpdates.forEach((option) => {
          this.result.character.system.details[option] = this.actorOriginal.system.details[option];
        });
      }
      if (!game.settings.get("ddb-importer", "character-update-policy-spell-use")) {
        this.result.character.system.spells = this.actorOriginal.system.spells;
      }
      if (!game.settings.get("ddb-importer", "character-update-policy-languages")) {
        this.result.character.system.traits.languages = this.actorOriginal.system.traits.languages;
      }
      // if resource mode is in disable and not asking, then we use the previous resources
      if (
        hasProperty(this.result.character, "flags.ddbimporter.resources.ask") &&
        !this.result.character.flags.ddbimporter.resources.ask &&
        this.result.character.flags.ddbimporter.resources.type === "disable"
      ) {
        this.result.character.system.resources = this.actorOriginal.system.resources;
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
      setProperty(this.result.character.flags, "ddb-importer.version", CONFIG.DDBI.version);

      if (this.actorOriginal.flags.dnd5e?.wildMagic === true) {
        this.result.character.flags.dnd5e["wildMagic"] = true;
      }

      // midi fixes
      const actorOnUseMacroName = getProperty(this.result.character, "flags.midi-qol.onUseMacroName");
      if (!actorOnUseMacroName || actorOnUseMacroName === "") {
        setProperty(this.result.character, "flags.midi-qol.onUseMacroName", "[postActiveEffects]");
      }

      // basic import
      CharacterImport.showCurrentTask(html, "Updating core character information");
      logger.debug("Character data importing: ", this.result.character);
      await this.actor.update(this.result.character);

      // copy existing journal notes
      this.copyExistingJournalNotes();

      // items import
      await this.processCharacterItems(html, items);

      if (activeEffectCopy) {
        // find effects with a matching name that existed on previous actor
        // and that have a different active state and activate them
        const targetEffects = this.actor.data.effects.filter((ae) => {
          const previousEffectDiff = this.actorOriginal.effects.find(
            (oae) => oae.label === ae.label && oae.disabled !== ae.disabled
          );
          if (previousEffectDiff) return true;
          return false;
        });
        targetEffects.forEach((ae) => {
          this.actor.updateEmbeddedDocument("ActiveEffect", { _id: ae._id, disabled: !ae.disabled });
        });
      }

      await autoLinkResources(this.actor);
      await setConditions(this.actor, data.ddb);
      await addContainerItemsToContainers(data.ddb, this.actor);

    } catch (error) {
      logger.error("Error importing character: ", error);
      logger.error(error.stack);
      CharacterImport.showCurrentTask(html, "Error importing character, attempting rolling back, see console (F12) for details.", error, true);
      await this.resetActor();
      throw new Error("ImportFailure");
    } finally {
      await updateDynamicUpdates(this.actor, activeUpdateState);
      this.actor.render();
    }
  }
}

export async function importCharacterById(characterId, html) {
  try {
    if (!html) html = utils.htmlToDoc("");
    let actor = await Actor.create({
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

    const characterDataOptions = {
      currentActorId: actor.id,
      characterId: characterId,
      syncId: null,
      localCobaltPostFix: actor.id,
      resourceSelection: false,
    };
    const characterData = await getCharacterData(characterDataOptions);
    const debugJson = game.settings.get("ddb-importer", "debug-json");
    if (debugJson) {
      download(JSON.stringify(characterData), `${characterId}.json`, "application/json");
    }
    if (characterData.success) {
      const importer = new CharacterImport(CharacterImport.defaultOptions, actor);
      await importer.processCharacterData(html, characterData);
      return actor;
    } else {
      logger.error("ERROR:", characterData.message);
      return undefined;
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
        logger.error("Error importing Character: ", error);
        logger.error(error.stack);
        break;
    }
    return undefined;
  }
}

export async function importCharacter(actor, html) {
  try {
    if (!html) html = utils.htmlToDoc("");
    const actorData = actor.toObject();
    const characterId = actorData.flags.ddbimporter.dndbeyond.characterId;
    const characterDataOptions = {
      currentActorId: actorData._id,
      characterId: characterId,
      syncId: null,
      localCobaltPostFix: actorData._id,
      resourceSelection: true,
    };
    const characterData = await getCharacterData(characterDataOptions);
    logger.debug("import.js importCharacter getCharacterData result", characterData);
    const debugJson = game.settings.get("ddb-importer", "debug-json");
    if (debugJson) {
      download(JSON.stringify(characterData), `${characterId}.json`, "application/json");
    }
    if (characterData.success) {
      // begin parsing the character data
      const importer = new CharacterImport(CharacterImport.defaultOptions, actorData);
      await importer.processCharacterData(html, characterData);
      CharacterImport.showCurrentTask(html, "Loading Character data", "Done.", false);
      logger.info("Loading Character data");
      return true;
    } else {
      logger.error("Error Loading Character data", characterData.message);
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
