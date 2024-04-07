import CharacterSpellFactory from "./spells/CharacterSpellFactory.js";
import logger from "../logger.js";
import DDBMacros from "../effects/DDBMacros.js";
import FileHelper from "../lib/FileHelper.js";
import { getCobalt } from "../lib/Secrets.js";
import DDBCampaigns from "../lib/DDBCampaigns.js";
import { importCacheLoad } from "../lib/DDBReferenceLinker.js";
import DDBProxy from "../lib/DDBProxy.js";
import SETTINGS from "../settings.js";
import { addVision5eStubs } from "../effects/vision5e.js";
import { fixCharacterLevels } from "./character/filterModifiers.js";
import CharacterClassFactory from "./classes/CharacterClassFactory.js";
import CharacterFeatureFactory from "./features/CharacterFeatureFactory.js";
import utils from "../lib/utils.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import DDBHelper from "../lib/DDBHelper.js";


export default class DDBCharacter {
  constructor({ currentActor = null, characterId = null, selectResources = true, enableCompanions = false } = {}) {
    // the actor the data will be imported into/currently exists
    this.currentActor = currentActor;
    this.currentActorId = currentActor?.id;
    // DDBCharacter ID
    this.characterId = characterId;
    // show resource selection prompt?
    this.selectResources = selectResources;
    this.resourceChoices = currentActor && foundry.utils.hasProperty(currentActor, "flags.ddbimporter.resources.type")
      ? foundry.utils.getProperty(currentActor, "flags.ddbimporter.resources")
      : {
        ask: game.settings.get(SETTINGS.MODULE_ID, "show-resource-chooser-default"),
        type: "remove",
        primary: "",
        secondary: "",
        tertiary: "",
      };
    this.resources = [];
    // raw data received from DDB
    this.source = null;
    // this is the raw items processed before filtering
    this.raw = {};
    // the data to act on following initial parse
    this.data = {};

    // Character data
    this.abilities = {
      overrides: {},
      core: {},
      withEffects: {},
    };
    this.spellSlots = {};
    this.totalLevels = 0;
    this.companionFactories = [];
    this.enableCompanions = enableCompanions;

    this._currency = {
      pp: 0,
      gp: 0,
      ep: 0,
      sp: 0,
      cp: 0,
    };

    this._itemCurrency = {
      pp: 0,
      gp: 0,
      ep: 0,
      sp: 0,
      cp: 0,
    };

    this.itemCompendium = CompendiumHelper.getCompendiumType("inventory");
    this.spellCompendium = CompendiumHelper.getCompendiumType("spell");

    this.armor = {};

  }

  /**
   * Retrieves the character ID from a given URL, which can be one of the following:
   * - regular character sheet
   * - public sharing link
   * - direct link to the endpoint already
   * @returns {string|null} DDB CharacterId
   * @param {String} url
   */
  static getCharacterId(url) {
    const ddbNamePattern = /(?:https?:\/\/)?(?:www\.)?(?:dndbeyond\.com|ddb\.ac)(?:\/profile\/.+)?\/characters\/(\d+)\/?/;
    const matches = url.match(ddbNamePattern);
    return matches ? matches[1] : null;
  }

  /**
   * Creates the Character Endpoint URL from a given character ID
   * @returns {string|null} The API endpoint
   */
  getCharacterAPIEndpoint() {
    return this.characterId !== null ? `https://character-service.dndbeyond.com/character/v5/character/${this.characterId}` : null;
  }


  /**
   * Loads and parses character in the proxy
   * This will return an object containing the character, and items separated into arrays relating to their types
   * Additional processing is required after this step.
   * @param {String} syncId
   * @param {String} localCobaltPostFix
   * @returns {Object} Parsed Character Data and DDB data
   */

  async getCharacterData({ syncId = undefined, localCobaltPostFix = "" } = {}) {
    const cobaltCookie = getCobalt(localCobaltPostFix);
    const parsingApi = DDBProxy.getProxy();
    const betaKey = game.settings.get("ddb-importer", "beta-key");
    const campaignId = DDBCampaigns.getCampaignId();
    const proxyCampaignId = campaignId === "" ? null : campaignId;
    let body = {
      cobalt: cobaltCookie,
      betaKey, characterId: this.characterId,
      campaignId: proxyCampaignId,
      filterModifiers: false,
    };
    if (syncId) {
      body["updateId"] = syncId;
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
      this.source = await response.json();
      if (!this.source.success) return;

      this.source.ddb = fixCharacterLevels(this.source.ddb);

      // load some required content
      await importCacheLoad();

      logger.debug("DDB Data to parse:", foundry.utils.duplicate(this.source.ddb));
      logger.debug("currentActorId", this.currentActorId);
      try {
        // this parses the json and sets the results as this.data
        await this._parseCharacter();
        logger.debug("finalParsedData", foundry.utils.duplicate({ source: this.source, data: foundry.utils.deepClone(this.data) }));
      } catch (error) {
        if (game.settings.get("ddb-importer", "debug-json")) {
          FileHelper.download(JSON.stringify(this.source), `${this.characterId}-raw.json`, "application/json");
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

  /**
   * Removes duplicate features/actions based on import preferences
   */
  _filterActionFeatures() {
    const actionAndFeature = game.settings.get("ddb-importer", "character-update-policy-use-action-and-feature");

    this.data.actions = this.raw.actions.map((action) => {
      const featureMatch = this.raw.features.find((feature) => feature.name === action.name);
      if (featureMatch) {
        // console.warn(`Removing duplicate feature ${featureMatch.name} from action ${action.name}`, {
        //   action,
        //   feature: featureMatch,
        // });
        if (action.system.description.value === "") {
          action.system.description.value = featureMatch.system.description.value;
        }

        if (action.system.description.chat === "") {
          action.system.description.chat = featureMatch.system.description.chat;
        }

        if (action.effects && action.effects.length === 0
          && featureMatch.effects && featureMatch.effects.length > 0
        ) {

          action.effects = featureMatch.effects;
          const newFlags = foundry.utils.duplicate(featureMatch.flags);

          delete newFlags.ddbimporter;
          foundry.utils.mergeObject(action.flags, newFlags, { overwrite: true, insertKeys: true, insertValues: true });
        }
      }
      return action;
    });

    this.data.features = this.raw.features
      .filter((feature) =>
        actionAndFeature
        || !this.data.actions.some((action) =>
          action.name.trim().toLowerCase() === feature.name.trim().toLowerCase()
          && foundry.utils.getProperty(action, "flags.ddbimporter.isCustomAction") !== true
        )
      )
      .map((feature) => {
        const actionMatch = actionAndFeature && this.data.actions.some((action) => feature.name === action.name);
        if (actionMatch) feature.effects = [];
        return feature;
      });

  }

  /**
   * Parses the collected Character JSON data into various foundry features.
   * Additional steps are needed after this based on the settings in the character import, but this will give the "raw" items
   *
   * @returns Object containing various parsed Foundry features
   *
   */
  async _parseCharacter() {
    try {
      // prefetch compendium indexes for lookups
      await this.itemCompendium.getIndex();
      await this.spellCompendium.getIndex();

      if (game.settings.get("ddb-importer", "character-update-policy-add-spell-effects")) await DDBMacros.createWorldMacros();
      logger.debug("Starting core character parse", { thisDDB: this.source.ddb });
      await this._generateCharacter();
      if (this.selectResources) {
        logger.debug("Character resources");
        await this.resourceSelectionDialog();
      }

      logger.debug("Character parse complete");
      await this._generateRace();
      logger.debug("Race parse complete");
      this._classParser = new CharacterClassFactory(this);
      this.raw.classes = await this._classParser.processCharacter();
      logger.debug("Classes parse complete");
      this._characterFeatureFactory = new CharacterFeatureFactory(this);
      await this._characterFeatureFactory.processFeatures();
      this.raw.features = this._characterFeatureFactory.processed.features;
      logger.debug("Feature parse complete");
      this._spellParser = new CharacterSpellFactory(this.source.ddb, this.raw.character);
      this.raw.spells = await this._spellParser.getCharacterSpells();
      logger.debug("Character Spells parse complete");
      await this._characterFeatureFactory.processActions();
      this.raw.actions = this._characterFeatureFactory.processed.actions;
      logger.debug("Action parse complete");
      await this._generateInventory();
      logger.debug("Inventory generation complete");

      this.data = foundry.utils.deepClone({
        character: this.raw.character,
        features: this.raw.features,
        race: this.raw.race,
        classes: this.raw.classes,
        inventory: this.raw.inventory,
        spells: this.raw.spells,
        actions: this.raw.actions,
        itemSpells: this.raw.itemSpells,
      });

      this._filterActionFeatures();

      this._classParser.linkFeatures();
      this._ddbRace.linkFeatures(this);
      this._characterFeatureFactory.linkFeatures();

      // this adds extras like a Divine Smite spell to this.data
      this._addSpecialAdditions();

      // find supported companion blocks
      if (this.enableCompanions && game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-create-companions")) {
        await this.generateCompanions();
      }

      this._addVision5eEffects();
      this._linkItemsToContainers();

    } catch (error) {
      logger.error(error);
      logger.error("Error during parse:", error.message);
      throw (error);
    }
  }

  getDataFeature(featureName, { featureTypes = ["actions", "features"], hints = [] } = {}) {
    for (const featureType of featureTypes) {
      const index = this.data[featureType].findIndex((f) => {
        const isCustomAction = f.flags.ddbimporter?.isCustomAction ?? false;
        if (isCustomAction) return false;
        const name = f.flags.ddbimporter?.originalName ?? f.name;
        for (const hint of hints) {
          if (utils.nameString(`${name} (${hint})`) === utils.nameString(featureName)) return true;
        }
        return utils.nameString(name) === utils.nameString(featureName);
      });
      if (index !== -1) {
        logger.debug(`Found ${featureType} : ${featureName}`);
        return this.data[featureType][index];
      }
    }
    return undefined;
  }

  async disableDynamicUpdates() {
    this.currentActor.flags.ddbimporter.activeUpdate = false;
    const activeUpdateData = { flags: { ddbimporter: { activeUpdate: false } } };
    await this.currentActor.update(activeUpdateData);
  }

  async enableDynamicUpdates() {
    this.currentActor.flags.ddbimporter.activeUpdate = true;
    const activeUpdateData = { flags: { ddbimporter: { activeUpdate: true } } };
    await this.currentActor.update(activeUpdateData);
  }

  async updateDynamicUpdates(state) {
    this.currentActor.flags.ddbimporter.activeUpdate = state;
    const activeUpdateData = { flags: { ddbimporter: { activeUpdate: state } } };
    await this.currentActor.update(activeUpdateData);
  }

  getCurrentDynamicUpdateState() {
    const activeUpdateState = this.currentActor.flags?.ddbimporter?.activeUpdate
      ? this.currentActor.flags.ddbimporter.activeUpdate
      : false;
    return activeUpdateState;
  }

  async setActiveSyncSpellsFlag(state) {
    this.currentActor.flags.ddbimporter.activeSyncSpells = state;
    const activeUpdateData = { flags: { ddbimporter: { activeSyncSpells: state } } };
    await this.currentActor.update(activeUpdateData);
  }

  _addVision5eEffects() {
    this.data.inventory = addVision5eStubs(this.data.inventory);
    this.data.spells = addVision5eStubs(this.data.spells);
    this.data.features = addVision5eStubs(this.data.features);
    this.data.actions = addVision5eStubs(this.data.actions);
  }

  isMartialArtist() {
    return this.source.ddb.character.classes.some((cls) =>
      cls.classFeatures.some((feature) => feature.definition.name === "Martial Arts")
    );
  }

  updateItemIds(items) {
    if (!this.currentActor) return items;
    const possibleFeatures = this.currentActor.getEmbeddedCollection("Item");
    const matchedFeatures = [];
    items.forEach((item) => {
      const itemMatch = DDBHelper.findMatchedDDBItem(item, possibleFeatures, matchedFeatures);
      if (itemMatch) {
        item._id = itemMatch._id;
        matchedFeatures.push(itemMatch);
      }
    });
    return items;
  }

  _linkItemsToContainers() {
    const containerItems = this.data.inventory
      .filter((item) =>
        item.type === "container"
        && foundry.utils.hasProperty(item, "flags.ddbimporter.id")
        && foundry.utils.hasProperty(item, "flags.ddbimporter.containerEntityId")
        && parseInt(item.flags.ddbimporter.containerEntityId) === parseInt(this.source.ddb.character.id)
        && !foundry.utils.getProperty(item, "flags.ddbimporter.ignoreItemImport")
      );

    this.data.inventory.forEach((item) => {
      if (foundry.utils.hasProperty(item, "flags.ddbimporter.containerEntityId")
        && parseInt(item.flags.ddbimporter.containerEntityId) !== parseInt(this.source.ddb.character.id)
      ) {
        const containerItem = containerItems.find((container) =>
          parseInt(container.flags.ddbimporter.id) === parseInt(item.flags.ddbimporter.containerEntityId)
        );
        if (containerItem) {
          foundry.utils.setProperty(item, "system.container", containerItem._id);
        }
      }
    });
  }

}
