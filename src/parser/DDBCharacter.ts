import CharacterSpellFactory from "./spells/CharacterSpellFactory";
import {
  logger,
  utils,
  FileHelper,
  Secrets,
  DDBCampaigns,
  DDBProxy,
  CompendiumHelper,
} from "../lib/_module";
import CharacterClassFactory from "./classes/CharacterClassFactory";
import CharacterFeatureFactory from "./features/CharacterFeatureFactory";
import { DDBInfusionFactory } from "./features/DDBInfusionFactory";
import {
  ProficiencyFinder,
  DDBReferenceLinker,
  FilterModifiers,
  DDBDataUtils,
} from "./lib/_module";

export interface ResourceChoices {
  ask: boolean;
  type: string;
  primary: string;
  secondary: string;
  tertiary: string;
}

export interface DDBCharacterImportOptions {
  currentActor?: Actor;
  characterId?: string;
  selectResources?: boolean;
  enableCompanions?: boolean;
  isMuncher?: boolean;
  enableSummons?: boolean;
  addToCompendiums?: boolean;
  compendiumImportTypes?: string[];
  forceCompendiumUpdate?: boolean;
}

// Declaration merging: these methods are added to DDBCharacter.prototype
// by the files imported via extendParsers.ts
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
interface DDBCharacter {
  // index.ts
  _newPCSkeleton(): Promise<void>;
  _generateCharacter(): Promise<void>;
  // token.ts
  _generateToken(): void;
  // ac.ts
  isArmored(): boolean;
  isUnArmored(): boolean;
  _generateOverrideArmorClass(overRideAC: any): void;
  _generateArmorClass(): void;
  // specialTraits.ts
  _setSpecialTraitFlags(): void;
  // proficiencies.ts
  _getCoreProficiencies(includeItemEffects?: boolean): any;
  _getCoreMasteries(includeItemEffects?: boolean): any;
  _generateLanguages(): void;
  _generateProficiencies(): void;
  // skills.ts
  getSkillProficiency(skill: any, modifiers?: any): any;
  getCustomSkillProficiency(skill: any): any;
  getCustomSkillAbility(skill: any): any;
  getCustomSkillBonus(skill: any): any;
  _setSpecialSkills(): void;
  _generateCustomSkills(): Promise<void>;
  _generateSkills(): Promise<void>;
  // abilities.ts
  _generateAbilitiesOverrides(): void;
  _getCustomSaveProficiency(ability: any): any;
  _getCustomSaveBonus(ability: any): any;
  _filterAbilityMods(abilityLongName: any, type: any, options?: { restriction?: any; includeExcludedEffects?: boolean; effectOnly?: boolean; classId?: any; availableToMulticlass?: any; useUnfilteredModifiers?: any }): any;
  _getAbilities(includeExcludedEffects?: boolean): any;
  _getAbilitiesBonuses(includeExcludedEffects?: boolean): any;
  _generateBaseAbilities(includeExcludedEffects?: boolean): void;
  _generateAbilities(): void;
  // hp.ts
  _generateHitPoints(): void;
  // initiative.ts
  _generateInitiative(): void;
  // effects.ts
  _generateDeathSaves(): void;
  _generateExhaustion(): void;
  getCharacterGenericConditionAffectData(condition: any, typeId: any): any;
  _generateConditions(): void;
  // currency.ts
  _generateCurrency(): void;
  // senses.ts
  getSenses(options?: { includeEffects?: boolean }): any;
  _generateSenses(): void;
  // speed.ts
  _generateSpeed(): void;
  // bio.ts
  getBackgroundName(): any;
  _generateTrait(): void;
  _generateIdeal(): void;
  _generateBond(): void;
  _generateFlaw(): void;
  getCharacteristics(): any;
  _generateAppearance(): void;
  _generateAlignment(): void;
  getBackgroundData(): any;
  _generateBiography(): void;
  _generateDescription(): void;
  // size.ts
  _generateSize(): void;
  // spellCasting.ts
  _generateSpellCasting(): void;
  getCasterInfo(): any;
  _generateSpellSlots(): void;
  _generateMaxPreparedSpells(): void;
  // race.ts
  _generateRace(addToCompendium?: boolean): Promise<void>;
  // resources.ts
  resourceList(): any;
  getSortedByUsedResourceList(): any;
  _generateResources(numberOfResources?: number): void;
  getResourceList(): any;
  _generateResourceSelectionFromForm(formData: any, type: any): void;
  setDefaultResources(sortedResources: any): void;
  resourceSelectionDialog(): Promise<void>;
  // inventory.ts
  getInventory(notifier?: any): Promise<any>;
  _generateInventory(): Promise<void>;
  // globalBonuses.ts
  getGlobalBonusAttackModifiers(lookupTable: any): any;
  getBonusSpellAttacks(type: any): any;
  _generateBonusSpellAttacks(): void;
  getBonusWeaponAttacks(type: any): any;
  _generateBonusWeaponAttacks(): void;
  _generateBonusAbilities(): void;
  _generateBonusSpellDC(): void;
  // special/special.ts
  _addSpecialAdditions(): void;
  // consumptionLinking.ts
  _getAutoLinkActivityDictionarySpellLinkUpdates(): Promise<any>;
  _getAutoLinkActivityDictionaryUpdates(): Promise<any>;
  _getAutoLinkActivityFlagDocUpdates(): Promise<any>;
  _flagCleanup(): Promise<void>;
  autoLinkConsumption(): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class DDBCharacter {

  source: IDDBCharacterResponse | null;
  compendiumImportTypes = ["classes", "subclasses", "backgrounds", "feats", "species", "features", "traits"];
  forceCompendiumUpdate: boolean;
  addToCompendiums: boolean;
  characterId: string;
  currentActor: Actor;
  currentActorId: string | null;
  selectResources: boolean;
  resourceChoices: ResourceChoices;
  resources: any[];
  raw: { character: any; classes: any[]; spells: any[]; actions: any[]; features: any[]; race: any; inventory: any[]; itemSpells: any[]; };
  abilities: { overrides: {}; core: {}; withEffects: {}; };
  spellSlots: {};
  totalLevels: number;
  enableCompanions: boolean;
  enableSummons: boolean;
  private _currency: { pp: number; gp: number; ep: number; sp: number; cp: number; };
  private _itemCurrency: { pp: number; gp: number; ep: number; sp: number; cp: number; };
  itemCompendium: CompendiumCollection.Any;
  spellCompendium: CompendiumCollection.Any;
  matchedFeatures: any[];
  armor: {};
  possibleFeatures: any[] | Actor.Embedded.CollectionFor<"Item">;
  proficiencyFinder: ProficiencyFinder;
  companionFactories: any[];
  isMuncher: boolean;
  _spellParser: CharacterSpellFactory;
  _infusionFactory: DDBInfusionFactory;
  _characterFeatureFactory: CharacterFeatureFactory;
  _classParser: CharacterClassFactory;

  constructor({
    currentActor = null, characterId = null, selectResources = true, enableCompanions = false, isMuncher = false,
    enableSummons = false, addToCompendiums = null, compendiumImportTypes = null, forceCompendiumUpdate = null,
  }: DDBCharacterImportOptions = {}) {
    // the actor the data will be imported into/currently exists
    this.currentActor = currentActor;
    this.currentActorId = currentActor?.id;
    // DDBCharacter ID
    this.characterId = characterId;
    // show resource selection prompt?
    this.selectResources = selectResources;
    this.resourceChoices = currentActor && foundry.utils.hasProperty(currentActor, "flags.ddbimporter.resources.type")
      ? foundry.utils.getProperty(currentActor, "flags.ddbimporter.resources") as ResourceChoices
      : {
        ask: utils.getSetting<boolean>("show-resource-chooser-default"),
        type: "remove",
        primary: "",
        secondary: "",
        tertiary: "",
      };
    this.resources = [];
    // raw data received from DDB
    this.source = null;
    // this is the raw items processed before filtering
    this.raw = {
      character: null,
      classes: [],
      spells: [],
      actions: [],
      features: [],
      race: null,
      inventory: [],
      itemSpells: [],
    };
    // set character data to empty
    this.data = {} as dnd5e.dataModels.actor.CharacterData;

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
    this.isMuncher = isMuncher;
    this.addToCompendiums = addToCompendiums ?? utils.getSetting<boolean>("character-update-policy-add-features-to-compendiums-dev");
    if (compendiumImportTypes) this.compendiumImportTypes = compendiumImportTypes;
    this.forceCompendiumUpdate = forceCompendiumUpdate;
    this._infusionFactory = null;
    this._classParser = null;
    this._characterFeatureFactory = null;
    this._spellParser = null;
  }

  /**
   * Retrieves the character ID from a given URL, which can be one of the following:
   * - regular character sheet
   * - public sharing link
   * - direct link to the endpoint already
   * @returns {string|null} DDB CharacterId
   * @param {string} url
   */
  static getCharacterId(url: string) {
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

  #sourceFixes() {
    this.source.ddb.character.choices?.choiceDefinitions.forEach((choiceDef) => {
      choiceDef.options?.forEach((option) => {
        if (option.label.includes("Cthonic")) {
          option.label = option.label.replace("Cthonic", "Chthonic");
        }
      });
    });
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
    const body = {
      cobalt: cobaltCookie,
      betaKey,
      characterId: this.characterId,
      campaignId: proxyCampaignId,
      filterModifiers: false,
      splitSpells: true,
      devMode: foundry.utils.getProperty(CONFIG, "DDBI.DEV.enabled") ?? false,
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

      this.#sourceFixes();

      if (game.settings.get("ddb-importer", "debug-json")) {
        FileHelper.download(JSON.stringify(this.source), `${this.characterId}-${this.source.ddb.character.name}-raw.json`, "application/json");
      }
    } catch (error) {
      logger.error("JSON Fetch Error");
      logger.error(error);
      logger.error(error.stack);
      throw error;
    }
  }

  async process() {
    try {
      this.source.ddb = FilterModifiers.fixCharacterLevels(this.source.ddb);
      // update proficiency finder with a character based version
      this.proficiencyFinder = new ProficiencyFinder({ ddb: this.source.ddb });

      // load some required content
      await DDBReferenceLinker.importCacheLoad();

      logger.debug("DDB Data to parse:", foundry.utils.duplicate(this.source.ddb));
      logger.debug("currentActorId", this.currentActorId);
      // this parses the json and sets the results as this.data
      await this._parseCharacter();
      logger.debug("finalParsedData", foundry.utils.duplicate({ source: this.source, data: foundry.utils.deepClone(this.data) }));

    } catch (error) {
      logger.error("Character Parse Error");
      logger.error(error);
      logger.error(error.stack);
      throw error;
    }
  }

  async _generateClass(addToCompendium: boolean = false) {
    this._classParser = new CharacterClassFactory(this, {
      addToCompendium,
      compendiumImportTypes: this.compendiumImportTypes,
      updateCompendiumItems: this.forceCompendiumUpdate,
    });
    this.raw.classes = await this._classParser.processCharacter();
    logger.debug(`Classes parse complete (With Compendium: ${addToCompendium})`);
  }

  async _generateFeatures() {
    if (!this._characterFeatureFactory)
      this._characterFeatureFactory = new CharacterFeatureFactory(this);
    await this._characterFeatureFactory.processFeatures();
    logger.debug("Feature parse complete");
  }

  async _generateActions() {
    if (!this._characterFeatureFactory)
      this._characterFeatureFactory = new CharacterFeatureFactory(this);
    await this._characterFeatureFactory.processActions();
    logger.debug("Action parse complete");
  }

  async _generateFeatureSpellAdvancements({ types = ["feat"] } = {}) {
    if (!this._characterFeatureFactory)
      this._characterFeatureFactory = new CharacterFeatureFactory(this);
    await this._characterFeatureFactory.addSpellAdvancements(types);
    logger.debug("Feature Spell Advancement parse complete");
  }

  async _addFeatureFactoryDocuments() {
    this._characterFeatureFactory.filterActionFeatures();
    this.raw.features.push(...this._characterFeatureFactory.data.features);
    this.raw.actions.push(...this._characterFeatureFactory.data.actions);
    if (this.addToCompendiums) await this._characterFeatureFactory.addToCompendiums(this.forceCompendiumUpdate, this.compendiumImportTypes);
  }

  async _generateInfusions() {
    logger.debug("Parsing infusions");
    this._infusionFactory = new DDBInfusionFactory(this);
    await this._infusionFactory.processInfusions();
    this.raw.features.push(...this._infusionFactory.processed.infusions);
    this.raw.actions.push(...this._infusionFactory.processed.actions);
    logger.debug("Infusion parse complete");
  }

  async _generateSpells() {
    this._spellParser = new CharacterSpellFactory(this);
    this.raw.spells.push(...(await this._spellParser.generateCharacterSpells()));
    logger.debug("Character Spells parse complete");
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

      logger.debug("Starting core character parse", { thisDDB: this.source.ddb });
      await this._generateCharacter();
      if (this.selectResources) {
        logger.debug("Character resources");
        await this.resourceSelectionDialog();
      }

      logger.debug("Character structure parse complete");
      await this._generateRace();
      logger.debug("Race parse complete");
      await this._generateClass();
      await this._generateFeatures();
      await this._generateInfusions();
      await this._generateSpells();
      await this._generateActions();
      await this._generateInventory();
      logger.debug("Inventory generation complete");

      await this._generateFeatureSpellAdvancements();
      await this._addFeatureFactoryDocuments();

      // generate data stub to link
      this.data = foundry.utils.duplicate({
        character: this.raw.character,
        features: this.raw.features,
        race: this.raw.race,
        classes: this.raw.classes,
        inventory: this.raw.inventory,
        spells: this.raw.spells,
        actions: this.raw.actions,
        itemSpells: this.raw.itemSpells,
      });

      // regenerate classes now we have generated features in compendium
      if (this.addToCompendiums) {
        await this._generateRace(true);
        await this._generateClass(true);

        this.data.classes = this.raw.classes;
        this.data.race = this.raw.race;
      }

      this._classParser.linkFeatures();
      this._ddbRace.linkFeatures();
      this._ddbRace.linkSpells(this);
      this._characterFeatureFactory.linkFeatures();

      // this adds extras like a Divine Smite spell to this.data
      this._addSpecialAdditions();

      this._linkItemsToContainers();

    } catch (error) {
      logger.error(error);
      logger.error("Error during parse:", error.message);
      throw (error);
    }
  }

  getDataFeature(featureName: string, { featureTypes = ["actions", "features"], hints = [] }: { featureTypes?: string[]; hints?: string[] } = {}) {
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

  getDataFeats(featName: string, { featureTypes = ["actions", "features"], hints = [] }: { featureTypes?: string[]; hints?: string[] } = {}) {
    for (const featureType of featureTypes) {
      const index = this.data[featureType].findIndex((f) => {
        const isCustomAction = f.flags.ddbimporter?.isCustomAction ?? false;
        if (isCustomAction) return false;
        if (f.type !== "feat") return false;
        if (f.system.type.value !== "feat") return false;
        if (f.flags.ddbimporter.type !== "feat") return false;

        const name = f.flags.ddbimporter?.originalName ?? f.name;
        for (const hint of hints) {
          if (utils.nameString(`${name} (${hint})`) === utils.nameString(featName)) return true;
        }
        return utils.nameString(name) === utils.nameString(featName);
      });
      if (index !== -1) {
        logger.debug(`Found ${featureType} : ${featName}`);
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

  async updateDynamicUpdates(state: boolean) {
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

  async setActiveSyncSpellsFlag(state: boolean) {
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
    const itemMatch = DDBDataUtils.findMatchedDDBItem(item, this.possibleFeatures, this.matchedFeatures);
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

}

export default DDBCharacter;
