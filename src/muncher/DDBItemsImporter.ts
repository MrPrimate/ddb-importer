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
  postJson,
} from "../lib/_module";
import DDBCharacter from "../parser/DDBCharacter";
import { ExternalAutomations } from "../effects/_module";
import GenericSpellFactory from "../parser/spells/GenericSpellFactory";
import { DDBReferenceLinker, DDBRuleJournalFactory, SystemHelpers } from "../parser/lib/_module";
import DDBItemSocket, { DDBItemEvent } from "../lib/streaming/DDBItemSocket";


// Parsed documents generated from the raw DDB item data by _processDDBItemData.
export interface IDDBItemsSynthetic {
  items: I5eInventoryItem[];
  spells: I5eSpellItem[];
}

export interface IDDBItemsImporter {
  source: IDDBItemsSource;
  synthetic: IDDBItemsSynthetic | null;
  data: TDDBItemImporterDocument[];
  // update calls can resolve null/undefined (e.g. an update with no diff)
  updateResults: (Item.Implementation | RollTable.Implementation | null | undefined)[] | null;
  notifier: TItemsNotifier;
  notifierV2: INotifierV2 | null;
  updateBool: boolean;
  uploadDirectory: string;
  ready: boolean;
  deleteBeforeUpdate: boolean | null;
  sources: number[] | null;
  useSourceFilter: boolean;
  ids: (number | string)[];
  searchFilter: string | null;
  itemHandler: DDBItemImporter | null;

  init(): Promise<void>;
  _processDDBItemData(): Promise<void>;
  _getDDBItems(): Promise<void>;
  _importSyntheticItems(): Promise<(Item.Implementation | RollTable.Implementation | null | undefined)[] | null>;
  process(): Promise<void>;
}

// Custom proxies may not expose the /items socket namespace. After one failed
// streaming attempt for the session we latch this and stick to HTTP.
let _itemSocketDisabled = false;

type TDDBItemsPayload = IDDBItemsResponseData | IDDBItemDefinition[];

// the filtered payload plus how many items each filter stage let through
interface IItemFetchResult {
  data: IDDBItemsSource;
  counts: SourceFilters.ISourceFilterCounts;
}

/**
 * Fold a streamed `items` event into the payload gathered so far. Custom proxies
 * send a bare item array, the official proxy an { items, spells, extra } object,
 * and either may arrive over more than one event. An event carrying nothing
 * usable is ignored
 */
function mergeItemPayloads(accumulated: TDDBItemsPayload | null, incoming: unknown): TDDBItemsPayload | null {
  if (incoming === null || incoming === undefined) return accumulated;

  if (Array.isArray(incoming)) {
    if (incoming.length === 0) return accumulated;
    const previous = Array.isArray(accumulated) ? accumulated : [];
    return [...previous, ...incoming as IDDBItemDefinition[]];
  }

  const chunk = incoming as IDDBItemsResponseData;
  const items = chunk.items ?? [];
  const spells = chunk.spells ?? [];
  const extra = chunk.extra ?? [];
  if (items.length === 0 && spells.length === 0 && extra.length === 0) return accumulated;

  const previous = accumulated !== null && !Array.isArray(accumulated)
    ? accumulated
    : { items: [], spells: [], extra: [] } as IDDBItemsResponseData;
  return {
    items: [...(previous.items ?? []), ...items],
    spells: [...(previous.spells ?? []), ...spells],
    extra: [...(previous.extra ?? []), ...extra],
  };
}

function normaliseItemPayload(payload: IDDBItemsResponseData | IDDBItemDefinition[]): IDDBItemsSource {
  // Official proxy returns { items, spells, extra }; custom proxies return a raw array.
  if (DDBProxy.isCustom(true)) {
    return { items: payload as IDDBItemDefinition[], spells: [], extra: [] };
  }
  const raw = payload as IDDBItemsResponseData;
  return {
    items: raw.items,
    spells: (raw.spells ?? []).map((s) => s.data),
    extra: raw.extra ?? [],
  };
}


/**
 * Dev-only: dump the normalised, unfiltered item payload as one file per DDB
 * source book, so a single proxy block can be worked on book by book.
 */
async function downloadRawItemsBySource(source: IDDBItemsSource) {
  if (!CONFIG.DDBI.DEV.downloadRAWJSONExamples) return;
  const itemsBySource = DDBSources.groupBySourceIds(source.items, (item) => item);
  const itemsById = new Map(source.items.map((item) => [item.id, item]));
  // a spell belongs with the item granting it; fall back to its own sources
  // when componentId points at something outside this payload.
  const spellsBySource = DDBSources.groupBySourceIds(
    source.spells,
    (spell) => itemsById.get(spell.componentId) ?? spell.definition,
  );
  const extraByItemId = new Map(source.extra.map((entry) => [entry.id, entry]));

  const files = [{ name: "REAL-items.json", content: JSON.stringify(source.items) }];
  const summary: Record<string, string> = {};
  for (const sourceId of new Set([...itemsBySource.keys(), ...spellsBySource.keys()])) {
    const items = itemsBySource.get(sourceId) ?? [];
    const spells = spellsBySource.get(sourceId) ?? [];
    const payload: IDDBItemsSource = {
      items,
      spells,
      extra: items.map((item) => extraByItemId.get(item.id)).filter((entry) => entry !== undefined),
    };
    const sourceName = sourceId === DDBSources.UNKNOWN_SOURCE_ID ? "unknown" : String(sourceId);
    const name = `RAW-items-${sourceName}.json`;
    files.push({ name, content: JSON.stringify({ success: true, sourceId, data: payload }) });
    summary[name] = `${items.length} items, ${spells.length} spells`;
  }

  // Log every bucket, so a book missing from the zip can be told apart from a
  // book that was never in the payload.
  logger.info(`Dumping ${files.length - 1} RAW item files for ${source.items.length} items`, summary);
  await FileHelper.downloadZip(files, "RAW-items.zip");
}

export default class DDBItemsImporter implements IDDBItemsImporter {

  source: IDDBItemsSource = {
    items: [],
    extra: [],
    spells: [],
  };
  synthetic: IDDBItemsSynthetic | null = null;
  data: TDDBItemImporterDocument[] = [];
  // update calls can resolve null/undefined (e.g. an update with no diff)
  updateResults: (Item.Implementation | RollTable.Implementation | null | undefined)[] | null = null;
  notifier: TItemsNotifier = utils.munchNote;
  notifierV2: INotifierV2 | null = null;
  updateBool = false;
  uploadDirectory = "";
  ready = false;
  deleteBeforeUpdate: boolean | null = null;
  sources: number[] | null = null;
  useSourceFilter = true;
  ids: (number | string)[] = [];
  searchFilter: string | null = null;
  itemHandler: DDBItemImporter | null = null;

  constructor({
    source = {
      items: [],
      extra: [],
      spells: [],
    } as IDDBItemsSource,
    notifier = null as TItemsNotifier | null,
    notifierV2 = null as INotifierV2 | null,
    deleteBeforeUpdate = null as boolean | null,
    useSourceFilter = true,
    ids = [] as (number | string)[],
    searchFilter = null as string | null,
    sources = null as number[] | null,
  } = {}) {
    this.source = source;
    if (notifier) this.notifier = notifier;
    if (notifierV2) this.notifierV2 = notifierV2;
    if (deleteBeforeUpdate !== null) this.deleteBeforeUpdate = deleteBeforeUpdate;
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

  static _resolveItemFetchContext({ useSourceFilter = true, ids = [] as (number | string)[], searchFilter = null as string | null, sourcesOverride = null as number[] | null } = {}) {
    const cobaltCookie = Secrets.getCobalt();
    const campaignId = DDBCampaigns.getCampaignId(utils.munchNote);
    const parsingApi = DDBProxy.getProxy();
    const betaKey = PatreonHelper.getPatreonKey();
    const debugJson = utils.getSetting<boolean>("debug-json");
    const useGenerics = utils.getSetting<boolean>("munching-policy-use-generic-items");
    // explicit sourcesOverride (e.g. from the native adventure importer) wins over the setting
    const sources = sourcesOverride ?? DDBSources.getBookFilter().effective;
    const effectiveUseSourceFilter = sourcesOverride !== null ? true : useSourceFilter;
    const exactMatch = utils.getSetting<boolean>("munching-policy-item-exact-match");
    return {
      cobaltCookie, campaignId, parsingApi, betaKey, debugJson,
      useGenerics, sources, exactMatch,
      filters: { ids, useSourceFilter: effectiveUseSourceFilter, useGenerics, sources, exactMatch, searchFilter },
    };
  }

  static _getItemDataHttp({ useSourceFilter = true, ids = [] as (number | string)[], searchFilter = null as string | null, sourcesOverride = null as number[] | null } = {}): Promise<IItemFetchResult> {
    const ctx = DDBItemsImporter._resolveItemFetchContext({ useSourceFilter, ids, searchFilter, sourcesOverride });
    const { cobaltCookie, campaignId, parsingApi, betaKey, debugJson } = ctx;
    const body = { cobalt: cobaltCookie, campaignId, betaKey, addSpells: true };

    logger.debug(`Fetching Items (HTTP) with:`, {
      debugJson, sources: ctx.sources, useSourceFilter, exactMatch: ctx.exactMatch,
      useGenerics: ctx.useGenerics, ids, searchFilter,
    });

    return new Promise<IItemFetchResult>((resolve, reject) => {
      postJson(`${parsingApi}/proxy/items`, body)
        .then((data: IDDBItemsProxyResponse) => {
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
        .then(async (raw) => {
          if (raw == null) return;
          const normalised = normaliseItemPayload(raw);
          await downloadRawItemsBySource(normalised);
          resolve(SourceFilters.applyItemFilters(normalised, ctx.filters));
        })
        .catch((error) => reject(error));
    });
  }

  static _getItemDataStreaming({ useSourceFilter = true, ids = [] as (number | string)[], searchFilter = null as string | null, sourcesOverride = null as number[] | null } = {}): Promise<IItemFetchResult> {
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

        let raw: TDDBItemsPayload | null = null;
        await socket.runJob("all-items", { campaignId, addSpells: true, cobalt: cobaltCookie }, {
          timeoutMs: 60000,
          onEvent: (event: DDBItemEvent) => {
            if (event.kind !== "items") return;
            // Accumulate across events - a multi-event or terminal-empty stream
            // would otherwise clobber earlier results if we assigned.
            raw = mergeItemPayloads(raw, event.payload);
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
        const normalised = normaliseItemPayload(raw);
        await downloadRawItemsBySource(normalised);
        return SourceFilters.applyItemFilters(normalised, ctx.filters);
      } finally {
        socket.close();
      }
    })();
  }

  static async _getItemData(args: {
    useSourceFilter?: boolean;
    ids?: (number | string)[];
    searchFilter?: string | null;
    sourcesOverride?: number[] | null;
  } = {}): Promise<IItemFetchResult> {
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

  static getCharacterInventory(items: IDDBItemDefinition[], extra: IDDBItemsResponseExtra[] = []) {
    return items.map((item) => {
      const extraItem = extra.find((e) => e.id == item.id);
      const limitedUse = extraItem
        ? extraItem.data.limitedUse
        : null;
      return {
        chargesUsed: 0,
        definitionId: 0,
        definitionTypeId: 0,
        displayAsAttack: null as boolean | null,
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
      // deliberately partial mock; strict comparability rejects the direct cast
    } as unknown as I5ePCData;
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
      // deliberately partial mock; strict comparability rejects the direct cast
    } as unknown as IDDBData;
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
    // an explicit source or id list is a programmatic caller (adventure import), not the muncher UI
    if (this.sources === null && sourceFilter) {
      SourceFilters.preflightSourceSettings("items", this.notifier);
    }
    const { data, counts } = await DDBItemsImporter._getItemData({
      useSourceFilter: sourceFilter,
      ids: this.ids,
      searchFilter: this.searchFilter,
      sourcesOverride: this.sources,
    });
    this.source = data;
    SourceFilters.reportFilterResult("items", counts, this.notifier);
  }

  async _importSyntheticItems() {
    if (!this.ready || this.synthetic === null) {
      throw new Error("DDBItems not initialized. Please run init() before enriching synthetic items.");
    }

    this.notifier("Analysing generated items...", { nameField: true });
    const itemHandler = new DDBItemImporter<TDDBItemImporterDocument>("items", this.synthetic.items, {
      deleteBeforeUpdate: this.deleteBeforeUpdate,
      matchFlags: ["is2014", "is2024"],
      notifier: this.notifier,
      notifierV2: this.notifierV2 ?? undefined,
    });
    this.itemHandler = itemHandler;
    await itemHandler.init();
    this.notifier(`Imps are creating iconographs for ${itemHandler.documents.length} possible items (this can take a while)`, { nameField: true });
    await itemHandler.iconAdditions();
    this.data = (this.ids !== null && this.ids.length > 0)
      // definitionId only exists on item-flavoured ddbimporter flags, not the full union
      ? itemHandler.documents.filter((s: any) =>
        s.flags?.ddbimporter?.definitionId
        && this.ids.includes(String(s.flags.ddbimporter.definitionId)),
      )
      : itemHandler.documents;
    itemHandler.documents = await ExternalAutomations.applyChrisPremadeEffects({
      documents: this.data as TExternalAutomationDocuments[],
      compendiumItem: true,
    });

    const finalCount = itemHandler.documents.length;
    this.notifier(`Preparing to import ${finalCount} items!`, { nameField: true });
    logger.time("Item Import Time");

    await itemHandler.compendiumFolders.loadCompendium("items", true);
    await itemHandler.compendiumFolders.createItemFoldersForDocuments({ documents: itemHandler.documents as I5eInventoryItem[] });

    this.updateResults = await itemHandler.updateCompendium(this.updateBool);
    const updatePromiseResults = await Promise.all(this.updateResults);

    await DDBCompendiumFolders.cleanupCompendiumFolders("items", this.notifier);

    DDBRuleJournalFactory.registerWeaponIds();
    // ammunition just munched into the compendium can register its types now
    await DDBRuleJournalFactory.registerAmmunitionTypes();

    logger.debug("Final Item Import Data", {
      finalItems: itemHandler.documents,
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
    ids = [] as (number | string)[],
    deleteBeforeUpdate = null as boolean | null,
    notifier = null as TItemsNotifier | null,
    notifierV2 = null as INotifierV2 | null,
    searchFilter = null as string | null,
    sources = null as number[] | null,
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
