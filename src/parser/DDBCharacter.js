import CharacterSpellFactory from "./spells/CharacterSpellFactory.js";
import { logger, utils, FileHelper, Secrets, DDBCampaigns, DDBProxy, DDBHelper, CompendiumHelper, DDBItemImporter, DDBCompendiumFolders, DDBReferenceLinker, ProficiencyFinder } from "../lib/_module.mjs";
import { DDBMacros } from "../effects/_module.mjs";
import { SETTINGS } from "../config/_module.mjs";
import { fixCharacterLevels } from "./character/filterModifiers.js";
import CharacterClassFactory from "./classes/CharacterClassFactory.js";
import CharacterFeatureFactory from "./features/CharacterFeatureFactory.js";
import { DDBInfusionFactory } from "./features/DDBInfusionFactory.js";

export default class DDBCharacter {
  constructor({ currentActor = null, characterId = null, selectResources = true, enableCompanions = false, enableSummons = false } = {}) {
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
    this.enableSummons = enableSummons;

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

    this.matchedFeatures = [];
    this.possibleFeatures = this.currentActor?.getEmbeddedCollection("Item") ?? [];
    this.proficiencyFinder = new ProficiencyFinder({ ddb: this.source?.ddb });
  }

  /**
   * Retrieves the character ID from a given URL, which can be one of the following:
   * - regular character sheet
   * - public sharing link
   * - direct link to the endpoint already
   * @returns {string|null} DDB CharacterId
   * @param {string} url
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
   * @param {{syncId?:string, localCobaltPostFix?:string}} [options]
   */
  async getCharacterData({ syncId = undefined, localCobaltPostFix = "" } = {}) {
    const cobaltCookie = Secrets.getCobalt(localCobaltPostFix);
    const parsingApi = DDBProxy.getProxy();
    const betaKey = game.settings.get("ddb-importer", "beta-key");
    const campaignId = DDBCampaigns.getCampaignId();
    const proxyCampaignId = campaignId === "" ? null : campaignId;
    let body = {
      cobalt: cobaltCookie,
      betaKey, characterId: this.characterId,
      campaignId: proxyCampaignId,
      filterModifiers: false,
      splitSpells: true,
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
      // update proficiency finder with a character based version
      this.proficiencyFinder = new ProficiencyFinder({ ddb: this.source.ddb });

      // load some required content
      await DDBReferenceLinker.importCacheLoad();

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
    const actionAndFeature = false;
    // game.settings.get("ddb-importer", "character-update-policy-use-action-and-feature");
    const alwaysUseFeatureDescription = true;

    // eslint-disable-next-line complexity
    this.data.actions = this.raw.actions.map((action) => {
      const originalActionName = foundry.utils.getProperty(action, "flags.ddbimporter.originalName") ?? action.name;
      const featureMatch = this.raw.features.find((feature) => {
        const originalFeatureName = foundry.utils.getProperty(feature, "flags.ddbimporter.originalName") ?? feature.name;
        const featureNamePrefix = originalFeatureName.split(":")[0].trim();
        const replaceRegex = new RegExp(`${utils.regexSanitizeString(featureNamePrefix)}(?:\\s*)-`);
        const featureFlagType = foundry.utils.getProperty(feature, "flags.ddbimporter.type");
        const actionFlagType = foundry.utils.getProperty(action, "flags.ddbimporter.type");
        const replacedActionName = originalActionName.replace(replaceRegex, `${featureNamePrefix}:`);
        // console.warn(`Checking "${originalActionName}" against "${originalFeatureName}"`, {
        //   action,
        //   feature,
        //   replacedActionName,
        //   originalFeatureName,
        //   featureFlagType,
        //   actionFlagType,
        //   nameMatch: originalFeatureName === originalActionName
        //     || replacedActionName === originalFeatureName,
        //   flagMatch: featureFlagType === actionFlagType,
        // });
        return (
          originalFeatureName === originalActionName
          || replacedActionName === originalFeatureName
          || feature.name === action.name
          || replacedActionName === feature.name
        )
        && featureFlagType === actionFlagType;
      });
      if (featureMatch) {
        const originalFeatureName = foundry.utils.getProperty(featureMatch, "flags.ddbimporter.originalName") ?? featureMatch.name;
        foundry.utils.setProperty(action, "flags.ddbimporter.featureNameMatch", originalFeatureName);
        if (action.system.description.value === "" || alwaysUseFeatureDescription) {
          action.system.description.value = featureMatch.system.description.value;
        }

        if (action.system.description.chat === "") {
          action.system.description.chat = featureMatch.system.description.chat;
        }

        action.system.source = featureMatch.system.source;

        logger.debug(`Found match for ${originalActionName} and ${featureMatch.name}`, {
          action: foundry.utils.deepClone(action),
          feature: foundry.utils.deepClone(featureMatch),
        });
        if (Object.keys(action.system.activities).length === 0) {
          for (const [key, activity] of Object.entries(featureMatch.system.activities)) {
            // console.warn(`Checking activity ${key}`, activity);
            if (!action.system.activities[key]) {
              action.system.activities[key] = activity;
              continue;
            }
            if (action.system.activities[key] && action.system.activities[key].effects?.length === 0) {
              action.system.activities[key].effects = featureMatch.system.activities[key].effects;
            }
          }
        } else {
          for (const key of Object.keys(featureMatch.system.activities)) {
            if (action.system.activities[key] && action.system.activities[key].effects?.length === 0) {
              action.system.activities[key].effects = featureMatch.system.activities[key].effects;
            }
          }
        }


        if (Object.keys(featureMatch.system.activities).length === 0
          && Object.keys(action.system.activities).length > 0
          && featureMatch.effects.length > 0
          && action.effects.length === 0
        ) {
          for (const key of Object.keys(action.system.activities)) {
            if (foundry.utils.getProperty(action.system.activities[key], "flags.ddbimporter.noeffect")) continue;
            const effects = [];
            for (const effect of featureMatch.effects) {
              // eslint-disable-next-line max-depth
              if (effect.transfer) continue;
              // eslint-disable-next-line max-depth
              if (foundry.utils.getProperty(effect, "flags.ddbimporter.noeffect")) continue;
              const activityNameRequired = foundry.utils.getProperty(effect, "flags.ddbimporter.activityMatch");
              // eslint-disable-next-line max-depth
              if (activityNameRequired && action.system.activities[key].name !== activityNameRequired) continue;
              const effectId = effect._id ?? foundry.utils.randomID();
              effect._id = effectId;
              effects.push({ _id: effectId });
            }
            action.system.activities[key].effects = effects;
          }
        }

        if (action.effects && action.effects.length === 0
          && featureMatch.effects && featureMatch.effects.length > 0
        ) {

          action.effects = featureMatch.effects;
          const newFlags = foundry.utils.duplicate(featureMatch.flags);

          delete newFlags.ddbimporter;
          foundry.utils.mergeObject(action.flags, newFlags, { overwrite: true, insertKeys: true, insertValues: true });
        }

        if (featureMatch.system.uses.max
          && (utils.isString(featureMatch.system.uses.max)
          || !action.system.uses.max)
        ) {
          action.system.uses.max = featureMatch.system.uses.max;
        }

        if (foundry.utils.hasProperty(featureMatch, "system.prerequisites.level")) {
          foundry.utils.setProperty(action, "system.prerequisites.level", featureMatch.system.prerequisites.level);
        }
      }
      return action;
    });

    this.data.features = this.raw.features
      .filter((feature) =>
        actionAndFeature
        || !this.data.actions.some((action) =>
          ((foundry.utils.getProperty(action, "flags.ddbimporter.originalName") ?? action.name).trim().toLowerCase() === (foundry.utils.getProperty(feature, "flags.ddbimporter.originalName") ?? feature.name).trim().toLowerCase()
          || foundry.utils.getProperty(action, "flags.ddbimporter.featureNameMatch") === (foundry.utils.getProperty(feature, "flags.ddbimporter.originalName") ?? feature.name))
          && foundry.utils.getProperty(action, "flags.ddbimporter.isCustomAction") !== true
          && foundry.utils.getProperty(feature, "flags.ddbimporter.type") === foundry.utils.getProperty(action, "flags.ddbimporter.type"),
        ),
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
      logger.debug("Parsing infusions");
      this._infusionFactory = new DDBInfusionFactory(this);
      await this._infusionFactory.processInfusions();
      this.raw.features.push(...this._infusionFactory.processed.infusions);
      logger.debug("Infusion parse complete");
      this._spellParser = new CharacterSpellFactory(this);
      this.raw.spells = await this._spellParser.getCharacterSpells();
      logger.debug("Character Spells parse complete");
      await this._characterFeatureFactory.processActions();
      this.raw.actions = this._characterFeatureFactory.processed.actions;
      this.raw.actions.push(...this._infusionFactory.processed.actions);
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

  isMartialArtist() {
    return this.source.ddb.character.classes.some((cls) =>
      cls.classFeatures.some((feature) => feature.definition.name === "Martial Arts"),
    );
  }

  updateItemId(item) {
    const itemMatch = DDBHelper.findMatchedDDBItem(item, this.possibleFeatures, this.matchedFeatures);
    if (itemMatch) {
      item._id = itemMatch._id;
      this.matchedFeatures.push(itemMatch);
    }
  }

  updateItemIds(items) {
    if (!this.currentActor) return items;
    items.forEach((item) => {
      this.updateItemId(item);
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
        && !foundry.utils.getProperty(item, "flags.ddbimporter.ignoreItemImport"),
      );

    this.data.inventory.forEach((item) => {
      if (foundry.utils.hasProperty(item, "flags.ddbimporter.containerEntityId")
        && parseInt(item.flags.ddbimporter.containerEntityId) !== parseInt(this.source.ddb.character.id)
      ) {
        const containerItem = containerItems.find((container) =>
          parseInt(container.flags.ddbimporter.id) === parseInt(item.flags.ddbimporter.containerEntityId),
        );
        if (containerItem) {
          foundry.utils.setProperty(item, "system.container", containerItem._id);
        }
      }
    });
  }

  async addToCompendiums() {
    if (!game.settings.get(SETTINGS.MODULE_ID, "add-features-to-compendiums")) return;

    const updateFeatures = game.settings.get(SETTINGS.MODULE_ID, "update-add-features-to-compendiums");

    const documents = this.currentActor.getEmbeddedCollection("Item").toObject();

    const featTypeDocs = documents.filter((doc) => doc.type === "feat");

    const subKlasses = new Set(featTypeDocs
      .filter((doc) => foundry.utils.hasProperty(doc, "flags.ddbimporter.subClass"))
      .map((doc) => {
        return {
          subClass: foundry.utils.getProperty(doc, "flags.ddbimporter.subClass"),
          class: foundry.utils.getProperty(doc, "flags.ddbimporter.class"),
        };
      }));

    const featureCompendiumFolders = new DDBCompendiumFolders("features");
    await featureCompendiumFolders.loadCompendium("features");

    for (const subKlass of subKlasses) {
      await featureCompendiumFolders.createSubClassFeatureFolder(subKlass.subClass, subKlass.class);
    }

    const featureHandlerOptions = {
      chrisPremades: true,
      removeSRDDuplicates: false,
      filterDuplicates: false,
      deleteBeforeUpdate: false,
      matchFlags: ["id"],
      useCompendiumFolders: true,
      indexFilter: {
        fields: [
          "name",
          "flags.ddbimporter",
        ],
      },
    };

    // "flags.ddbimporter.classId",
    // "flags.ddbimporter.class",
    // "flags.ddbimporter.featureName",
    // "flags.ddbimporter.subClass",
    // "flags.ddbimporter.parentClassId"

    const klassNames = new Set(featTypeDocs.map((doc) => foundry.utils.getProperty(doc, "flags.ddbimporter.class")));

    for (const klassName of klassNames) {
      logger.debug(`Processing class ${klassName} into the class compendium`);
      const classFeatures = featTypeDocs.filter((doc) =>
        ["class", "subclass"].includes(foundry.utils.getProperty(doc, "flags.ddbimporter.type"))
        && (klassName === foundry.utils.getProperty(doc, "flags.ddbimporter.class")
        || klassName === foundry.utils.getProperty(doc, "flags.ddbimporter.dndbeyond.class")),
      );

      logger.debug(`Adding class features for ${klassName} to the class compendium`, {
        classFeatures,
      });

      const featureHandler = await DDBItemImporter.buildHandler("features", classFeatures, updateFeatures, featureHandlerOptions);
      await featureHandler.buildIndex(featureHandlerOptions.indexFilter);
    }

    const traitHandlerOptions = {
      chrisPremades: true,
      matchFlags: ["entityRaceId"],
      useCompendiumFolders: true,
      deleteBeforeUpdate: false,
    };

    const traitCompendiumFolders = new DDBCompendiumFolders("traits");
    await traitCompendiumFolders.loadCompendium("traits");
    const species = documents.filter((doc) => doc.type === "race");
    for (const doc of species) {
      const groupName = foundry.utils.getProperty(doc, "flags.ddbimporter.groupName");
      const fullName = foundry.utils.getProperty(doc, "flags.ddbimporter.fullName");
      await traitCompendiumFolders.createSubTraitFolders(groupName, fullName);
    }

    const speciesHandler = await DDBItemImporter.buildHandler("race", species, updateFeatures, traitHandlerOptions);
    await speciesHandler.buildIndex(featureHandlerOptions.indexFilter);

    const traitFeatures = featTypeDocs.filter((doc) =>
      ["race", "trait", "species"].includes(foundry.utils.getProperty(doc, "flags.ddbimporter.type"))
      && !foundry.utils.hasProperty(doc, "flags.ddbimporter.dndbeyond.choice"),
    );
    logger.debug(`Adding species traits to the species compendium`, {
      traitFeatures,
    });
    const traitHandler = await DDBItemImporter.buildHandler("trait", traitFeatures, updateFeatures, traitHandlerOptions);
    await traitHandler.buildIndex(featureHandlerOptions.indexFilter);


    const featHandlerOptions = {
      chrisPremades: true,
      deleteBeforeUpdate: false,
    };
    const featFeatures = featTypeDocs.filter((doc) =>
      ["feat"].includes(foundry.utils.getProperty(doc, "flags.ddbimporter.type"))
      && !foundry.utils.hasProperty(doc, "flags.ddbimporter.dndbeyond.choice"),
    );
    logger.debug(`Adding feats to the feats compendium`, {
      featFeatures,
    });
    const featHandler = await DDBItemImporter.buildHandler("feats", featFeatures, updateFeatures, featHandlerOptions);
    await featHandler.buildIndex(featureHandlerOptions.indexFilter);

    const backgroundFeatures = documents.filter((doc) =>
      ["background"].includes(foundry.utils.getProperty(doc, "flags.ddbimporter.type"))
      && !foundry.utils.hasProperty(doc, "flags.ddbimporter.dndbeyond.choice"),
    );
    logger.debug(`Adding backgrounds to the backgrounds compendium`, {
      backgroundFeatures,
    });
    const backgroundHandler = await DDBItemImporter.buildHandler("background", backgroundFeatures, updateFeatures, featHandlerOptions);
    await backgroundHandler.buildIndex(featureHandlerOptions.indexFilter);

  }

}
