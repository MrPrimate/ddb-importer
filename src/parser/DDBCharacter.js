import getCharacter from "./character/index.js";
import getActions from "./features/actions.js";
import getFeatures from "./features/features.js";
import { getClasses } from "./classes/index.js";
import { getCharacterSpells } from "./spells/getCharacterSpells.js";
import { getItemSpells } from "./spells/getItemSpells.js";
import { getDDBRace } from "../muncher/races/races.js";
import getInventory from "./inventory/index.js";
import getSpecial from "./special/index.js";
import logger from "../logger.js";
import { getResourcesDialog } from "./character/resources.js";
import { createGMMacros } from "../effects/macros.js";
import FileHelper from "../lib/FileHelper.js";
import { getCobalt } from "../lib/Secrets.js";
import { getCampaignId } from "../lib/Settings.js";
import { importCacheLoad } from "../lib/templateStrings.js";
import DDBProxy from "../lib/DDBProxy.js";


export default class DDBCharacter {
  constructor({ currentActor, characterId, resourceSelection = true }) {
    this.currentActor = currentActor;
    this.currentActorId = currentActor.id;
    this.characterId = characterId;
    this.resourceSelection = resourceSelection;
    this.raw = {};
    this.data = {};
    this.ddb = null;
    this.parsed = null;
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
    const ddbNamePattern = /(?:https?:\/\/)?(?:www\.dndbeyond\.com|ddb\.ac)(?:\/profile\/.+)?\/characters\/(\d+)\/?/;
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
   * @param {String} syncId
   * @param {String} localCobaltPostFix
   * @returns {Object} Parsed Character Data and DDB data
   */

  async getCharacterData({ syncId = undefined, localCobaltPostFix = "" } = {}) {
    const cobaltCookie = getCobalt(localCobaltPostFix);
    const parsingApi = DDBProxy.getProxy();
    const betaKey = game.settings.get("ddb-importer", "beta-key");
    const campaignId = getCampaignId();
    const proxyCampaignId = campaignId === "" ? null : campaignId;
    let body = { cobalt: cobaltCookie, betaKey, characterId: this.characterId, campaignId: proxyCampaignId };
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
      const data = await response.json();
      if (!data.success) return data;

      // load some required content
      await importCacheLoad();

      // construct the expected { character: {...} } object
      // this.ddb = {
      //   character: data.ddb,
      //   classOptions: data.ddb.classOptions,
      //   originOptions: data.ddb.originOptions,
      //   infusions: data.ddb.infusions,
      // };

      this.ddb = data.ddb;

      logger.debug("DDB Data to parse:", duplicate(this.ddb));
      logger.debug("currentActorId", this.currentActorId);
      try {
        await this.parseJson();
        const shouldChangeName = game.settings.get("ddb-importer", "character-update-policy-name");
        if (!shouldChangeName) {
          this.data.character.name = undefined;
          this.data.character.prototypeToken.name = undefined;
        }
        data["character"] = this.data;
        logger.debug("finalParsedData", data);
        return data;
      } catch (error) {
        const debugJson = game.settings.get("ddb-importer", "debug-json");
        if (debugJson) {
          FileHelper.download(JSON.stringify(data), `${this.characterId}-raw.json`, "application/json");
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

  _filterActionFeatures() {
    const actionAndFeature = game.settings.get("ddb-importer", "character-update-policy-use-action-and-feature");

    this.data.actions = this.raw.actions.map((action) => {
      const featureMatch = this.raw.features.find((feature) => feature.name === action.name);
      if (featureMatch
        && action.effects && action.effects.length === 0
        && featureMatch.effects && featureMatch.effects.length > 0
      ) {
        action.effects = featureMatch.effects;
        const newFlags = duplicate(featureMatch.flags);
        delete newFlags.ddbimporter;
        mergeObject(action.flags, newFlags, { overwrite: true, insertKeys: true, insertValues: true });
      }
      return action;
    });

    this.data.features = this.raw.features
      .filter((feature) =>
        actionAndFeature
        || !this.data.actions.some((action) => action.name.trim().toLowerCase() === feature.name.trim().toLowerCase())
      )
      .map((feature) => {
        const actionMatch = actionAndFeature && this.data.actions.some((action) => feature.name === action.name);
        if (actionMatch) feature.effects = [];
        return feature;
      });

  }

  async parseJson() {
    try {
      if (game.settings.get("ddb-importer", "character-update-policy-add-spell-effects")) await createGMMacros();
      logger.debug("Starting core character parse", { thisDDB: this.ddb });
      this.raw.character = await getCharacter(this.ddb);
      if (this.resourceSelection) {
        logger.debug("Character resources");
        this.raw.character = await getResourcesDialog(this.currentActorId, this.ddb, this.raw.character);
      }
      logger.debug("Character parse complete");
      this.raw.race = await getDDBRace(this.ddb);
      logger.debug("Race parse complete");
      this.raw.classes = await getClasses(this.ddb, this.raw.character);
      logger.debug("Classes parse complete");
      this.raw.features = [this.raw.race, ...await getFeatures(this.ddb, this.raw.character, this.raw.classes)];
      logger.debug("Feature parse complete");
      this.raw.spells = getCharacterSpells(this.ddb, this.raw.character);
      logger.debug("Character Spells parse complete");
      this.raw.actions = await getActions(this.ddb, this.raw.character, this.raw.classes);
      logger.debug("Action parse complete");
      this.raw.itemSpells = getItemSpells(this.ddb, this.raw.character);
      logger.debug("Item Spells parse complete");
      this.raw.inventory = await getInventory(this.ddb, this.raw.character, this.raw.itemSpells);
      logger.debug("Inventory parse complete");

      this.data = {
        character: this.raw.character,
        features: this.raw.features,
        classes: this.raw.classes,
        inventory: this.raw.inventory,
        spells: this.raw.spells,
        actions: this.raw.actions,
        itemSpells: this.raw.itemSpells,
      };

      this._filterActionFeatures();

      // this adds extras like the Divine Smite spell
      getSpecial(this.data);
      return this.data;

    } catch (error) {
      logger.error(error);
      logger.error("Error during parse:", error.message);
      throw (error);
    }
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

}
