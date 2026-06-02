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
} from "../lib/_module";
import { SETTINGS } from "../config/_module";
import DDBCharacter from "../parser/DDBCharacter";
import { ExternalAutomations } from "../effects/_module";
import GenericSpellFactory from "../parser/spells/GenericSpellFactory";
import { DDBReferenceLinker, DDBRuleJournalFactory, SystemHelpers } from "../parser/lib/_module";
import DDBItemSocket, { DDBItemEvent } from "../lib/streaming/DDBItemSocket";

// Custom proxies may not expose the /items socket namespace. After one failed
// streaming attempt for the session we latch this and stick to HTTP.
let _itemSocketDisabled = false;

function applyItemFilters(input, { ids, useSourceFilter, useGenerics, sources, exactMatch, searchFilter }) {
  let data = input;
  // category filtering
  if (ids.length === 0) {
    const categoryItems = data.items
      .map((item) => {
        item.sources = item.sources.filter((source) =>
          DDBSources.isSourceInAllowedCategory(source),
        );
        return item;
      })
      .filter((item) => {
        if (item.isHomebrew) return true;
        return item.sources.length > 0;
      });
    data = { items: categoryItems, spells: data.spells, extra: data.extra };
  }
  // source filtering
  const filteredItems = useGenerics ? data.items : data.items.filter((item) => item.canBeAddedToInventory);
  data = {
    items: (sources.length === 0 || !useSourceFilter)
      ? filteredItems
      : filteredItems.filter((item) =>
        item.sources.some((source) => sources.includes(source.sourceId)),
      ),
    spells: data.spells,
    extra: data.extra,
  };
  // homebrew filtering
  if (sources.length === 0) {
    if (game.settings.get(SETTINGS.MODULE_ID, "munching-policy-item-homebrew-only")) {
      data = { items: data.items.filter((item) => item.isHomebrew), spells: data.spells, extra: data.extra };
    } else if (!game.settings.get(SETTINGS.MODULE_ID, "munching-policy-item-homebrew")) {
      data = { items: data.items.filter((item) => !item.isHomebrew), spells: data.spells, extra: data.extra };
    }
  }
  if (ids.length > 0) {
    data = { items: data.items.filter((item) => ids.includes(item.id)), spells: data.spells, extra: data.extra };
  }
  if (searchFilter && searchFilter !== "") {
    if (exactMatch) {
      data = { items: data.items.filter((item) => item.name.toLowerCase() === searchFilter.toLowerCase()), spells: data.spells, extra: data.extra };
    } else {
      data = { items: data.items.filter((item) => item.name.toLowerCase().includes(searchFilter.toLowerCase())), spells: data.spells, extra: data.extra };
    }
  }
  return data;
}

function normaliseItemPayload(payload) {
  // Official proxy returns { items, spells, extra }; custom proxies return a raw array.
  if (DDBProxy.isCustom(true)) {
    return { items: payload, spells: [], extra: [] };
  }
  return {
    items: payload.items,
    spells: (payload.spells ?? []).map((s) => s.data),
    extra: payload.extra ?? [],
  };
}


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

  notifierV2 = null;

  updateBool = false;

  uploadDirectory = null;

  ready = false;

  deleteBeforeUpdate = null;

  sources: number[] | null = null;

  useSourceFilter = true;

  ids = [];

  searchFilter = null;

  itemHandler = null;

  constructor({
    source = {
      items: [],
      extra: [],
      spells: [],
    },
    notifier = null,
    notifierV2 = null,
    deleteBeforeUpdate = null,
    useSourceFilter = true,
    ids = [],
    searchFilter = null,
    sources = null,
  } = {}) {
    this.source = source;
    if (notifier) this.notifier = notifier;
    if (notifierV2) this.notifierV2 = notifierV2;
    if (this.deleteBeforeUpdate !== null) this.deleteBeforeUpdate = deleteBeforeUpdate;
    this.useSourceFilter = useSourceFilter;
    this.ids = ids;
    this.searchFilter = searchFilter;
    this.sources = sources;
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

  static _resolveItemFetchContext({ useSourceFilter = true, ids = [], searchFilter = null, sourcesOverride = null } = {}) {
    const cobaltCookie = Secrets.getCobalt();
    const campaignId = DDBCampaigns.getCampaignId(utils.munchNote);
    const parsingApi = DDBProxy.getProxy();
    const betaKey = PatreonHelper.getPatreonKey();
    const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");
    const enableSources = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-source-filter");
    const useGenerics = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-generic-items");
    // explicit sourcesOverride (e.g. from the native adventure importer) wins over the setting
    const sources = sourcesOverride ?? (enableSources ? DDBSources.getSelectedSourceIds() : []);
    const effectiveUseSourceFilter = sourcesOverride !== null ? true : useSourceFilter;
    const exactMatch = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-item-exact-match");
    return {
      cobaltCookie, campaignId, parsingApi, betaKey, debugJson,
      useGenerics, sources, exactMatch,
      filters: { ids, useSourceFilter: effectiveUseSourceFilter, useGenerics, sources, exactMatch, searchFilter },
    };
  }

  static _getItemDataHttp({ useSourceFilter = true, ids = [], searchFilter = null, sourcesOverride = null } = {}) {
    const ctx = DDBItemsImporter._resolveItemFetchContext({ useSourceFilter, ids, searchFilter, sourcesOverride });
    const { cobaltCookie, campaignId, parsingApi, betaKey, debugJson } = ctx;
    const body = { cobalt: cobaltCookie, campaignId, betaKey, addSpells: true };

    logger.debug(`Fetching Items (HTTP) with:`, {
      debugJson, sources: ctx.sources, useSourceFilter, exactMatch: ctx.exactMatch,
      useGenerics: ctx.useGenerics, ids, searchFilter,
    });

    return new Promise((resolve, reject) => {
      fetch(`${parsingApi}/proxy/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((data) => {
          if (debugJson) {
            FileHelper.download(JSON.stringify(data), `items-raw.json`, "application/json");
          }
          if (!data.success) {
            utils.munchNote(`Failure: ${data.message}`);
            reject(data.message);
            return null;
          }
          return data.data;
        })
        .then((raw) => {
          if (raw == null) return;
          resolve(applyItemFilters(normaliseItemPayload(raw), ctx.filters));
        })
        .catch((error) => reject(error));
    });
  }

  static _getItemDataStreaming({ useSourceFilter = true, ids = [], searchFilter = null, sourcesOverride = null } = {}) {
    const ctx = DDBItemsImporter._resolveItemFetchContext({ useSourceFilter, ids, searchFilter, sourcesOverride });
    const { cobaltCookie, campaignId, parsingApi, betaKey, debugJson } = ctx;

    logger.debug(`Streaming Items with:`, {
      debugJson, sources: ctx.sources, useSourceFilter, exactMatch: ctx.exactMatch,
      useGenerics: ctx.useGenerics, ids, searchFilter,
    });

    return (async () => {
      const socket = new DDBItemSocket(parsingApi);
      socket.connect();
      try {
        const authRes = await socket.auth({ betaKey, cobalt: cobaltCookie, characterId: null, campaignId });
        if (!authRes.ok) throw new Error(`Auth failed: ${authRes.message}`);

        let raw: any = null;
        await socket.runJob("all-items", { campaignId, addSpells: true, cobalt: cobaltCookie }, {
          timeoutMs: 60000,
          onEvent: (event: DDBItemEvent) => {
            if (event.kind === "items") {
              raw = event.payload;
            }
          },
        });

        if (debugJson) {
          FileHelper.download(
            JSON.stringify({ success: true, data: raw }),
            `items-raw.json`,
            "application/json",
          );
        }
        if (raw == null) throw new Error("Stream completed without items payload");
        return applyItemFilters(normaliseItemPayload(raw), ctx.filters);
      } finally {
        socket.close();
      }
    })();
  }

  static async _getItemData(args = {}) {
    if (!_itemSocketDisabled) {
      try {
        return await DDBItemsImporter._getItemDataStreaming(args);
      } catch (err) {
        const msg = (err as Error)?.message ?? String(err);
        logger.warn(`[items] streaming failed, falling back to HTTP: ${msg}`);
        _itemSocketDisabled = true;
      }
    }
    return DDBItemsImporter._getItemDataHttp(args);
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

    // TO DO: add types
    // disable source filter if ids provided
    const sourceFilter = (this.ids === null || this.ids.length === 0) && this.useSourceFilter;
    this.source = await DDBItemsImporter._getItemData({
      useSourceFilter: sourceFilter,
      ids: this.ids,
      searchFilter: this.searchFilter,
      sourcesOverride: this.sources,
    }) as any;
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
    sources = null,
  } = {}) {
    const ddbItems = new DDBItemsImporter({
      useSourceFilter,
      ids,
      deleteBeforeUpdate,
      notifier,
      notifierV2,
      searchFilter,
      sources,
    });
    await ddbItems.process();
    return ddbItems.updateResults;
  }
}
