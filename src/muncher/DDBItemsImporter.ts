import {
  utils,
  logger,
  DDBCampaigns,
  Secrets,
  FileHelper,
  PatreonHelper,
  DDBProxy,
  Iconizer,
  DDBItemImporter,
  DDBMacros,
  DDBCompendiumFolders,
  DDBSources,
  SourceFilters,
} from "../lib/_module";
import { SETTINGS } from "../config/_module";
import DDBCharacter from "../parser/DDBCharacter";
import { ExternalAutomations } from "../effects/_module";
import GenericSpellFactory from "../parser/spells/GenericSpellFactory";
import { DDBReferenceLinker, DDBRuleJournalFactory, SystemHelpers } from "../parser/lib/_module";


export default class DDBItemsImporter {

  source = {
    items: [],
    extra: [],
    spells: [],
  };

  synthetic = null;

  mock = null;

  data = [];

  updateResults = null;

  notifier = utils.munchNote;
  notifierV2: ((props: NotifierV2Props) => void) | null = null;

  updateBool = false;

  uploadDirectory = null;

  ready = false;

  deleteBeforeUpdate = null;

  useSourceFilter = true;

  ids = [];

  searchFilter = null;

  itemHandler = null;

  constructor({
    source = [],
    notifier = null,
    notifierV2 = null,
    deleteBeforeUpdate = null,
    useSourceFilter = true,
    ids = [],
    searchFilter = null,
  } = {}) {
    this.source = source;
    if (notifier) this.notifier = notifier;
    this.notifierV2 = notifierV2;
    if (this.deleteBeforeUpdate !== null) this.deleteBeforeUpdate = deleteBeforeUpdate;
    this.useSourceFilter = useSourceFilter;
    this.ids = ids;
    this.searchFilter = searchFilter;
    this.updateBool = utils.getSetting<boolean>("munching-policy-update-existing");
    this.uploadDirectory = utils.getSetting<string>("other-image-upload-directory").replace(/^\/|\/$/g, "");
  }

  async init() {
    await DDBReferenceLinker.importCacheLoad();
    // to speed up file checking we pregenerate existing files now.
    logger.info("Checking for existing files...");
    await FileHelper.generateCurrentFiles(this.uploadDirectory);
    // update the allowed weapon properties from sources
    await DDBSources.updateAllowedWeaponPropertySources();
    // generate any new rules journals

    logger.info("Check complete, getting ItemData.");

    if (!CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured) {
      CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured = await DDBMacros.configureDependencies();
    }

    await Iconizer.preFetchDDBIconImages();

    this.ready = true;
  }

  static _getItemData({ useSourceFilter = true, ids = [], searchFilter = null } = {}) {
    const cobaltCookie = Secrets.getCobalt();
    const campaignId = DDBCampaigns.getCampaignId(utils.munchNote);
    const parsingApi = DDBProxy.getProxy();
    const betaKey = PatreonHelper.getPatreonKey();
    const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey, addSpells: true };
    const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");
    const useGenerics = utils.getSetting<boolean>("munching-policy-use-generic-items");
    // the effective book list only; books outside the included categories are reported and ignored
    const sources = DDBSources.getBookFilter().effective;

    const exactMatch = utils.getSetting<boolean>("munching-policy-item-exact-match");

    logger.debug(`Fetching Items with:`, {
      debugJson,
      useGenerics,
      sources,
      useSourceFilter,
      exactMatch,
      ids,
      searchFilter,
    });

    return new Promise((resolve, reject) => {
      fetch(`${parsingApi}/proxy/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body), // body data type must match "Content-Type" header
      })
        .then((response) => response.json())
        .then((data) => {
          if (debugJson) {
            FileHelper.download(JSON.stringify(data), `items-raw.json`, "application/json");
          }
          if (!data.success) {
            utils.munchNote(`Failure: ${data.message}`);
            reject(data.message);
          }
          return data.data;
        })
        .then((data) => {
          if (DDBProxy.isCustom(true)) {
            return {
              items: data,
              spells: [],
              extra: [],
            };
          } else {
            return {
              items: data.items,
              spells: data.spells.map((s) => s.data),
              extra: data.extra,
            };
          }
        })
        .then((data) => {
          const { data: filtered, counts } = SourceFilters.applyItemFilters(data, {
            ids, useSourceFilter, useGenerics, sources, exactMatch, searchFilter,
          });
          SourceFilters.reportFilterResult("items", counts, utils.munchNote);
          return filtered;
        })
        .then((data) => resolve(data))
        .catch((error) => reject(error));
    });
  }

  static getCharacterInventory(items, extra = []) {
    return items.map((item) => {
      const extraItem = extra.find((e) => e.id == item.id);
      const limitedUse = extraItem
        ? extraItem.data.limitedUse
        : null;
      return {
        chargesUsed: 0,
        definitionId: 0,
        definitionTypeId: 0,
        displayAsAttack: null,
        entityTypeId: 0,
        equipped: false,
        id: 0,
        isAttuned: false,
        quantity: item.bundleSize ? item.bundleSize : 1,
        definition: item,
        limitedUse,
      };
    });
  }

  async _processDDBItemData() {
    if (!this.ready) {
      throw new Error("DDBItems not initialized. Please run init() before generating import items.");
    }

    const mockCharacter = {
      system: SystemHelpers.getTemplate("character"),
      type: "character",
      name: "",
      flags: {
        ddbimporter: {
          compendium: true,
          dndbeyond: {
            effectAbilities: {},
            totalLevels: 0,
            proficiencies: [],
            proficienciesIncludingEffects: [],
            characterValues: [],
          },
        },
      },
    } as I5ePCData;
    const mockDDB = {
      character: {
        classes: [],
        race: {
          racialTraits: [],
        },
        characterValues: [],
        inventory: DDBItemsImporter.getCharacterInventory(this.source.items, this.source.extra),
        customItems: null,
        options: {
          class: [],
          race: [],
          feat: [],
        },
        spells: {
          item: this.source.spells,
        },
        modifiers: {
          race: [],
          class: [],
          background: [],
          feat: [],
          item: [],
          condition: [],
        },
        feats: [],
      },
    } as IDDBData;
    const ddbCharacter = new DDBCharacter();
    ddbCharacter.raw.character = mockCharacter;
    ddbCharacter.source = {
      success: true,
      ddb: mockDDB,
    };

    const spells = await GenericSpellFactory.getItemSpells(mockDDB, ddbCharacter.raw.character, {
      generateSummons: true,
      notifier: this.notifier,
    });
    ddbCharacter.raw.itemSpells = spells;

    const inventory = await ddbCharacter.getInventory(this.notifier);
    const results = {
      items: inventory,
      spells: ddbCharacter.raw.itemSpells, // this needs to be a list of spells to find
    };
    // console.warn(results);
    this.synthetic = results;
  }


  async _getDDBItems() {
    if (!this.ready) {
      await this.init();
    }

    this.notifier("Downloading item data..");

    // disable source filter if ids provided
    const sourceFilter = (this.ids === null || this.ids.length === 0) && this.useSourceFilter;
    // an explicit id list is a programmatic caller (adventure import), not the muncher UI
    if (sourceFilter) SourceFilters.preflightSourceSettings("items", this.notifier);
    this.source = await DDBItemsImporter._getItemData({
      useSourceFilter: sourceFilter,
      ids: this.ids,
      searchFilter: this.searchFilter,
    });
  }

  async _importSyntheticItems() {
    if (!this.ready) {
      throw new Error("DDBItems not initialized. Please run init() before enriching synthetic items.");
    }

    this.notifier("Analysing generated items...", { nameField: true });
    this.itemHandler = new DDBItemImporter("items", this.synthetic.items, {
      deleteBeforeUpdate: this.deleteBeforeUpdate,
      matchFlags: ["is2014", "is2024"],
      notifier: this.notifier,
      notifierV2: this.notifierV2,
    });
    await this.itemHandler.init();
    this.notifier(`Imps are creating iconographs for ${this.itemHandler.documents.length} possible items (this can take a while)`, { nameField: true });
    await this.itemHandler.iconAdditions();
    this.data = (this.ids !== null && this.ids.length > 0)
      ? this.itemHandler.documents.filter((s) =>
        s.flags?.ddbimporter?.definitionId
        && this.ids.includes(String(s.flags.ddbimporter.definitionId)),
      )
      : this.itemHandler.documents;
    this.itemHandler.documents = await ExternalAutomations.applyChrisPremadeEffects({
      documents: this.data,
      compendiumItem: true,
    });

    const finalCount = this.itemHandler.documents.length;
    this.notifier(`Preparing to import ${finalCount} items!`, { nameField: true });
    logger.time("Item Import Time");

    await this.itemHandler.compendiumFolders.loadCompendium("items", true);
    await this.itemHandler.compendiumFolders.createItemFoldersForDocuments({ documents: this.itemHandler.documents });

    this.updateResults = await this.itemHandler.updateCompendium(this.updateBool);
    const updatePromiseResults = await Promise.all(this.updateResults);

    await DDBCompendiumFolders.cleanupCompendiumFolders("items", this.notifier);

    DDBRuleJournalFactory.registerWeaponIds();
    // ammunition just munched into the compendium can register its types now
    await DDBRuleJournalFactory.registerAmmunitionTypes();

    logger.debug("Final Item Import Data", {
      finalItems: this.itemHandler.documents,
      updateResults: this.updateResults,
      updatePromiseResults,
    });
    this.notifier("");
    logger.timeEnd("Item Import Time");
    return this.updateResults;

  }


  async process() {
    await this.init();
    await this._getDDBItems();
    await this._processDDBItemData();
    await this._importSyntheticItems();
  }


  static async fetchAndImportItems({
    useSourceFilter = true,
    ids = [],
    deleteBeforeUpdate = null,
    notifier = null,
    notifierV2 = null,
    searchFilter = null,
  } = {}) {
    const ddbItems = new DDBItemsImporter({
      useSourceFilter,
      ids,
      deleteBeforeUpdate,
      notifier,
      notifierV2,
      searchFilter,
    });
    await ddbItems.process();
    return ddbItems.updateResults;
  }
}
