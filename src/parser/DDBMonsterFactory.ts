import {
  logger,
  DDBItemImporter,
  DDBProxy,
  FileHelper,
  Secrets,
  PatreonHelper,
  DDBCompendiumFolders,
  Iconizer,
  DDBSources,
  utils,
  postJson,
  DDBRunContext,
  MunchProgressTracker,
} from "../lib/_module";
import DDBMonster from "./DDBMonster";
import DDBMonsterImporter from "../muncher/DDBMonsterImporter";
import { DDBReferenceLinker } from "./lib/_module";
import DDBMonsterSocket, { DDBMonsterEvent } from "../lib/streaming/DDBMonsterSocket";

// Custom proxies may not expose the /monsters socket namespace. One failed
// streaming attempt per page-load latches this and falls back to HTTP.
let _monsterSocketDisabled = false;

/**
 * Dev-only: dump the unfiltered monster payload as one file per source category
 * and rules version, so a single bulk fetch can be worked on category by
 * category.
 *
 * Named RAW-monsters-<category>-<categoryId>-<version>.json, matching the
 * mule's RAW-* convention. Must run before applyCategoryFilter, which strips
 * entries from monster.sources in place.
 */
function downloadRawMonstersByCategoryAndVersion(monsters: IDDBMonsterSourceData[]) {
  if (!CONFIG.DDBI.DEV.downloadRAWJSONExamples) return;

  interface IRawMonsterBucket {
    categoryId: number;
    categoryName: string;
    version: string;
    monsters: IDDBMonsterSourceData[];
  }
  const buckets = new Map<string, IRawMonsterBucket>();

  for (const monster of monsters) {
    const primary = DDBSources.getPrimarySource(monster);
    const category = primary ? DDBSources.getSourceCategoryForSourceId(primary.sourceId) : null;
    // homebrew and anything DDB gives no usable source keeps its own bucket
    // rather than being dropped or silently folded into a real category
    const categoryId = category?.id ?? DDBSources.UNKNOWN_SOURCE_ID;
    const categoryName = category?.name ?? (monster.isHomebrew ? "homebrew" : "unknown");
    const version = primary
      ? (DDBSources.is2024Source(primary) ? "2024" : "2014")
      : "unknown";
    const key = `${categoryId}|${version}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.monsters.push(monster);
    else buckets.set(key, { categoryId, categoryName, version, monsters: [monster] });
  }

  for (const bucket of buckets.values()) {
    const safeName = bucket.categoryName.replaceAll(/[^\w.-]+/g, "-").replaceAll(/^-|-$/g, "");
    FileHelper.download(
      JSON.stringify({
        success: true,
        sourceCategoryId: bucket.categoryId,
        sourceCategoryName: bucket.categoryName,
        version: bucket.version,
        data: bucket.monsters,
      }),
      `RAW-monsters-${safeName}-${bucket.categoryId}-${bucket.version}.json`,
      "application/json",
    );
  }
}

// --- Shared by-id monster streaming session ------------------------------
// By-id lookups (companion / summons enriched images, CreateUndead, etc.) are
// fired hundreds of times during a spell import, each previously opening +
// closing its own socket and re-fetching the same monster ids. We instead keep
// ONE persistent socket for by-id jobs and cache results by monster id.
let _sharedSocket: DDBMonsterSocket | null = null;
let _sharedCredSig: string | null = null;
let _sharedOpening: Promise<DDBMonsterSocket> | null = null;
// jobs must run sequentially on a connection (runJob re-points handlers), so
// serialise all shared-socket work through a 1-slot semaphore.
const _fetchQueue = new foundry.utils.Semaphore(1);
// monster id -> source object, or null when a completed job returned nothing
// for that id (so unknown ids aren't re-queried forever). Tied to the socket
// session lifetime: cleared whenever the shared socket closes.
const _idCache = new Map<number, any | null>();
let _idleTimer: ReturnType<typeof setTimeout> | null = null;
const SHARED_IDLE_MS = 3600000;

function _monsterCredSig(parsingApi: string, cobalt: string, betaKey: string): string {
  return `${parsingApi}::${cobalt ?? ""}::${betaKey ?? ""}`;
}

function _closeSharedMonsterSocket(): void {
  if (_idleTimer) {
    clearTimeout(_idleTimer);
    _idleTimer = null;
  }
  if (_sharedSocket) {
    try {
      _sharedSocket.close();
    } catch (err) {
      logger.warn(`[monsters] error closing shared socket: ${(err as Error)?.message ?? String(err)}`);
    }
  }
  _sharedSocket = null;
  _sharedCredSig = null;
  _sharedOpening = null;
  _idCache.clear();
}

function _bumpSharedIdle(): void {
  if (_idleTimer) clearTimeout(_idleTimer);
  _idleTimer = setTimeout(_closeSharedMonsterSocket, SHARED_IDLE_MS);
}

async function _getSharedMonsterSocket(
  parsingApi: string,
  authBody: { betaKey: string; cobalt: string; characterId: null },
): Promise<DDBMonsterSocket> {
  const sig = _monsterCredSig(parsingApi, authBody.cobalt, authBody.betaKey);
  // Live socket for the same credentials?
  if (_sharedSocket && _sharedSocket.socket && _sharedCredSig === sig) {
    return _sharedSocket;
  }
  // An open is already in flight for the same creds
  if (_sharedOpening && _sharedCredSig === sig) {
    return _sharedOpening;
  }
  // Stale socket (closed or different creds)
  if (_sharedSocket || _sharedOpening) _closeSharedMonsterSocket();

  _sharedCredSig = sig;
  _sharedOpening = (async () => {
    const socket = new DDBMonsterSocket(parsingApi);
    socket.connect();
    const authRes = await socket.auth(authBody);
    if (!authRes.ok) throw new Error(`Auth failed: ${authRes.message}`);
    _sharedSocket = socket;
    _sharedOpening = null;
    return socket;
  })();
  return _sharedOpening;
}

interface IDDBMonsterFactory {
  ddbData?: IDDBMonsterSourceData[] | null;
  extra?: boolean;
  notifier?: (note: any, options?: NotifierV1Props) => void;
  notifierV2?: INotifierV2;
  type?: TMonsterImporterTypes;
  forceUpdate?: boolean | null;
  useLocalKey?: boolean | null;
  keyPostfix?: string | null;
}

interface IDDBMonsterFetchBody {
  cobalt: string;
  betaKey: string;
  sources: number[];
  search?: string;
  searchTerm?: string;
  homebrew?: boolean;
  homebrewOnly?: boolean;
  exactMatch?: boolean;
  excludeLegacy?: boolean;
  excludedCategories?: number[];
  monsterTypes?: number[];
  ids?: number[];
}

interface IDDBMonsterFactoryFetchOptions {
  ids?: number[] | number;
  searchTerm?: string;
  sources?: number[];
  homebrew?: boolean;
  homebrewOnly?: boolean;
  exactMatch?: boolean;
  excludeLegacy?: boolean;
  excludedCategories?: number[];
  monsterTypes?: number[];
}

export default class DDBMonsterFactory {
  extra: boolean;
  keys: { useLocal?: boolean | null; keyPostfix?: string | null };
  notifier: NotifierV1;
  notifierV2: INotifierV2 | null;
  type: TMonsterImporterTypes;
  compendiumFolders: DDBCompendiumFolders;
  update: boolean;
  updateImages: boolean;
  uploadDirectory: string;
  useItemAC: boolean;
  legacyName: boolean;
  addMonsterEffects: boolean;
  addChrisPremades: boolean;
  use2024Spells: boolean | null;
  currentDocument: number;
  totalDocuments: number;
  overallProgress: MunchProgressTracker;
  source: IDDBMonsterSourceData[];
  npcs: I5eMonsterData[];
  monstersParsed: Actor.Implementation[];

  static #noteStub(note: any, { nameField = false, monsterNote = false } = {}) {
    logger.info(note, { nameField, monsterNote });
  }

  static defaultFetchOptions(ids: number[] | null, searchTerm: string | null = null): IDDBMonsterFactoryFetchOptions {
    const searchFilter = $("#monster-munch-filter")[0] as HTMLInputElement;
    const finalSearchTerm = searchTerm ?? (searchFilter?.value ?? "");
    const enableSources = utils.getSetting<boolean>("munching-policy-use-source-filter");
    const sources = enableSources
      ? DDBSources.getSelectedSourceIds()
      : [];
    const homebrew = sources.length > 0
      ? false
      : utils.getSetting<boolean>("munching-policy-monster-homebrew");
    const homebrewOnly = sources.length > 0
      ? false
      : utils.getSetting<boolean>("munching-policy-monster-homebrew-only");
    const exactMatch = utils.getSetting<boolean>("munching-policy-monster-exact-match");
    const excludedCategories = DDBSources.getAllExcludedCategoryIds();
    const monsterTypes = DDBSources.getSelectedMonsterTypeIds();

    const options = {
      // a null id list behaves identically to an empty one downstream
      ids: ids ?? [],
      searchTerm: finalSearchTerm.trim(),
      sources,
      homebrew,
      homebrewOnly,
      exactMatch,
      excludedCategories,
      monsterTypes,
      excludeLegacy: false,
    };
    logger.debug("Generated monster fetch options", options);
    return options;
  }

  constructor ({
    ddbData = null,
    extra = false,
    notifier,
    notifierV2,
    type = "monsters",
    forceUpdate = null,
    useLocalKey = null,
    keyPostfix = null,
  }: IDDBMonsterFactory = {}) {
    this.extra = extra;
    this.keys = {
      useLocal: useLocalKey,
      keyPostfix,
    };
    this.npcs = [];
    // a missing source list behaves like an empty one everywhere downstream
    this.source = ddbData ?? [];
    this.notifier = notifier ?? DDBMonsterFactory.#noteStub;
    this.notifierV2 = notifierV2 ?? null;
    this.type = type;
    this.compendiumFolders = new DDBCompendiumFolders(type);
    this.update = forceUpdate ?? utils.getSetting<boolean>("munching-policy-update-existing");
    this.updateImages = utils.getSetting<boolean>("munching-policy-update-images");
    this.uploadDirectory = utils.getSetting<string>("other-image-upload-directory").replace(/^\/|\/$/g, "");

    this.useItemAC = utils.getSetting<boolean>("munching-policy-monster-use-item-ac");
    this.legacyName = utils.getSetting<boolean>("munching-policy-legacy-postfix");
    this.addMonsterEffects = utils.getSetting<boolean>("munching-policy-add-monster-midi-effects");
    this.addChrisPremades = utils.getSetting<boolean>("munching-policy-use-chris-premades");
    const spellChoice = utils.getSetting<string>("munching-policy-force-spell-version");
    this.use2024Spells = spellChoice === "FORCE_2024"
      ? true
      : null;
    this.currentDocument = 1;
    this.totalDocuments = 0;
    this.overallProgress = new MunchProgressTracker();
    this.monstersParsed = [];
  }

  /**
   * Update the overall run progress bar. Silent unless a run total is known, so
   * callers that use parse() on its own are unaffected.
   * @param {string} message text to display above the bar
   * @param {boolean} clear hide the bar after updating it
   */
  #notifyOverall(message: string, clear = false) {
    if (!this.notifierV2 || !this.overallProgress.active) return;
    this.notifierV2(this.overallProgress.payload(message, clear));
  }

  /**
   * Fetch monsters from DDB
   * @param {object} options
   * @param {number[]|number} [options.ids] limit monsters fetched to specific ids
   * @param {string} [options.searchTerm] search term for monsters
   * @param {string[]} [options.sources] sources to search in
   * @param {boolean} [options.homebrew=false] include homebrew monsters
   * @param {boolean} [options.homebrewOnly=false] only search homebrew monsters
   * @param {boolean} [options.exactMatch=false] search for exact monster name
   * @param {boolean} [options.excludeLegacy=false] exclude legacy content
   * @param {number[]} [options.excludedCategories] excluded category IDs
   * @param {number[]} [options.monsterTypes] monster type IDs to include
   * @returns {Promise<object[]>} a promise that resolves with an array of monsters
   */
  async fetchDDBMonsterSourceData({
    ids = [], searchTerm = "", sources = [], homebrew = false,
    homebrewOnly = false, exactMatch = false, excludeLegacy = false, excludedCategories = [],
    monsterTypes = [] }: IDDBMonsterFactoryFetchOptions,
  ) {
    // getCobalt treats a null and undefined postfix identically
    const keyPostfix = this.keys.keyPostfix ?? DDBRunContext.keyPostfix ?? undefined;
    const useLocal = this.keys.useLocal ?? DDBRunContext.useLocal;
    const cobaltCookie = Secrets.getCobalt(keyPostfix);
    const betaKey = PatreonHelper.getPatreonKey(useLocal);
    const parsingApi = DDBProxy.getProxy();

    const body: IDDBMonsterFetchBody = {
      cobalt: cobaltCookie,
      betaKey: betaKey,
      sources,
    };

    if (ids && !Array.isArray(ids)) {
      body.ids = [ids];
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      body.ids = [...new Set(ids)];
    } else {
      body.sources = sources;
      body.search = searchTerm;
      body.homebrew = homebrew;
      body.homebrewOnly = homebrewOnly;
      body.searchTerm = encodeURIComponent(searchTerm);
      body.exactMatch = exactMatch;
      body.excludeLegacy = excludeLegacy;
      body.excludedCategories = excludedCategories;
      body.monsterTypes = monsterTypes;
    }

    const debugJson = utils.getSetting<boolean>("debug-json");

    const defaultUrl = ids && Array.isArray(ids) && ids.length > 0
      ? `${parsingApi}/proxy/monsters/ids`
      : `${parsingApi}/proxy/monster`;
    const url = CONFIG.DDBI.monsterURL ?? defaultUrl;

    const isIdLookup = !!(ids && Array.isArray(ids) && ids.length > 0);
    const streamElement = isIdLookup ? "monsters-by-id" : "all-monsters";
    const buildStartParams = () => {
      if (isIdLookup) {
        return { ids: body.ids ?? [], cobalt: cobaltCookie };
      }
      return {
        searchTerm: body.searchTerm ?? "",
        search: body.search ?? "",
        sources: body.sources ?? [],
        excludedCategories: body.excludedCategories ?? [],
        monsterTypes: body.monsterTypes ?? [],
        homebrew: !!body.homebrew,
        homebrewOnly: !!body.homebrewOnly,
        excludeLegacy: !!body.excludeLegacy,
        exactMatch: !!body.exactMatch,
        cobalt: cobaltCookie,
      };
    };

    const applyCategoryFilter = (data: IDDBMonsterSourceData[]) => {
      if (isIdLookup) return data;
      logger.debug("Processing categories");
      return data
        .map((monster) => {
          monster.sources = (monster.sources ?? []).filter((source) =>
            source.sourceType === 1
            && DDBSources.isSourceInAllowedCategory(source),
          );
          return monster;
        })
        .filter((monster) => {
          if (monster.isHomebrew) return true;
          return (monster.sources?.length ?? 0) > 0;
        });
    };

    const fetchOverHttp = async () => {
      const result = await postJson(url, body, { mode: "cors" }) as {
        success: boolean;
        message?: string;
        data: IDDBMonsterSourceData[];
      };
      if (!result.success) {
        this.notifier(`API Failure: ${result.message}`);
        logger.error(`API Failure:`, result.message);
        return Promise.reject(result.message);
      }
      if (debugJson) {
        FileHelper.download(JSON.stringify(result), `monsters-raw.json`, "application/json");
      }
      downloadRawMonstersByCategoryAndVersion(result.data);
      this.notifier(`Retrieved ${result.data.length} monsters from DDB`, { nameField: true, monsterNote: false });
      logger.info(`Retrieved ${result.data.length} monsters from DDB`);
      this.source = applyCategoryFilter(result.data);
      return this.source;
    };

    const fetchOverStream = async () => {
      const socket = new DDBMonsterSocket(parsingApi);
      socket.connect();
      try {
        const authRes = await socket.auth({ betaKey, cobalt: cobaltCookie, characterId: null });
        if (!authRes.ok) throw new Error(`Auth failed: ${authRes.message}`);

        let raw: IDDBMonsterSourceData[] = [];
        // Monster bulk fetches can be very long-running for large catalogues
        // (paginated, sometimes 1000+ monsters). Give it plenty of headroom.
        await socket.runJob(streamElement, buildStartParams(), {
          timeoutMs: 180000,
          onEvent: (event: DDBMonsterEvent) => {
            if (event.kind === "monsters" && Array.isArray(event.payload)) {
              raw = event.payload;
            }
          },
        });

        if (debugJson) {
          FileHelper.download(JSON.stringify({ success: true, data: raw }), `monsters-raw.json`, "application/json");
        }
        downloadRawMonstersByCategoryAndVersion(raw);
        this.notifier(`Retrieved ${raw.length} monsters from DDB`, { nameField: true, monsterNote: false });
        logger.info(`Retrieved ${raw.length} monsters from DDB`);
        this.source = applyCategoryFilter(raw);
        return this.source;
      } finally {
        socket.close();
      }
    };

    // By-id lookups reuse one shared socket across the run and cache results by
    // monster id, so the many companion/summon lookups during spell parsing
    // don't each open a socket or re-fetch the same monsters.
    const fetchByIdShared = async () => {
      const requestedIds: number[] = body.ids ?? [];
      const missing = requestedIds.filter((id) => !_idCache.has(Number(id)));
      let _lastByIdRawCount = 0;

      if (missing.length > 0) {
        await _fetchQueue.add(async () => {
          const socket = await _getSharedMonsterSocket(parsingApi, { betaKey, cobalt: cobaltCookie, characterId: null });
          const raw: IDDBMonsterSourceData[] = [];
          await socket.runJob("monsters-by-id", { ids: missing, cobalt: cobaltCookie }, {
            timeoutMs: 180000,
            onEvent: (event: DDBMonsterEvent) => {
              // Accumulate across batches - a multi-event or terminal-empty
              // stream would otherwise clobber earlier results if we assigned.
              if (event.kind === "monsters" && Array.isArray(event.payload)) raw.push(...event.payload);
            },
          });
          _lastByIdRawCount = raw.length;
          for (const monster of raw) {
            // Coerce the key: tokens request numeric ids but the server may
            // return string ids; a strict Map key mismatch would drop everything.
            const key = Number(monster?.id);
            if (Number.isFinite(key)) _idCache.set(key, monster);
          }
          // requested ids the server returned nothing for: cache as null so we
          // don't keep re-querying them.
          for (const id of missing) {
            if (!_idCache.has(Number(id))) _idCache.set(Number(id), null);
          }
          _bumpSharedIdle();
        });
      }

      this.source = requestedIds.map((id) => _idCache.get(Number(id))).filter(Boolean);
      if (debugJson) {
        FileHelper.download(JSON.stringify({ success: true, data: this.source }), `monsters-raw.json`, "application/json");
      }
      this.notifier(`Retrieved ${this.source.length} monsters from DDB`, { nameField: true, monsterNote: false });
      logger.info(`Retrieved ${this.source.length} monsters from DDB (by id; ${missing.length} requested, raw=${_lastByIdRawCount}, source=${this.source.length}, ${requestedIds.length - missing.length} cached)`);
      return this.source;
    };

    // If the user has wired a custom monsterURL (custom proxy), trust their
    // override and skip streaming. Same logic applies to both bulk and by-id.
    const customMonsterUrl = url !== defaultUrl;
    if (_monsterSocketDisabled || customMonsterUrl) return fetchOverHttp();

    try {
      if (isIdLookup) {
        const streamed = await fetchByIdShared();
        // An empty by-id streaming result is treated as a failure: use fallback.
        if (streamed.length === 0 && (body.ids?.length ?? 0) > 0) {
          logger.warn(`[monsters] by-id streaming returned 0 for ${body.ids?.length} id(s); falling back to HTTP`);
          _closeSharedMonsterSocket();
          return fetchOverHttp();
        }
        return streamed;
      }
      return await fetchOverStream();
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      logger.warn(`[monsters] streaming failed, falling back to HTTP: ${msg}`);
      _monsterSocketDisabled = true;
      if (isIdLookup) _closeSharedMonsterSocket();
      return fetchOverHttp();
    }
  }

  /** Close the shared by-id monster socket and clear its cache (e.g. on teardown). */
  static closeSharedSocket(): void {
    _closeSharedMonsterSocket();
  }

  /**
   * Parses the downloaded (or provided) DDB Source data for monsters and generates actors
   * Use this.fetchDDBMonsterSourceData() if you need to get monster data from ddb
   * @param {object[]} [monsters] Optional monster data to parse. If not provided, will use data from fetchDDBMonsterSourceData()
   * @returns {object} Object with two properties: actors (an array of parsed actor documents) and failedMonsterNames (an array of names of monsters that failed to parse)
   */
  async parse(monsters: IDDBMonsterSourceData[] = []): Promise<{ actors: I5eMonsterData[]; failedMonsterNames: string[] }> {
    const foundryActors: I5eMonsterData[] = [];
    const failedMonsterNames: string[] = [];

    const monsterSource = monsters.length > 0 ? monsters : this.source;

    const totalMonsters = this.source.length;
    let i = this.currentDocument;
    logger.time("Monster Parsing");
    for (const monster of monsterSource) {
      const name = `${monster.name}${monster.isLegacy ? " legacy" : ""}`;
      try {
        if (this.notifierV2) {
          this.notifierV2?.({
            progress: { current: i - this.currentDocument + 1, total: monsterSource.length },
            section: "monster",
            message: `Parsing monster: ${name}`,
            progressBar: "primary",
          });
        } else {
          this.notifier(`[${i}/${this.currentDocument + monsterSource.length - 1} of ${totalMonsters}] Parsing data for guest ${name}`, { nameField: false, monsterNote: true });
        }
        i++;
        logger.debug(`Attempting to parse ${i}/${totalMonsters} ${monster.name}`);
        logger.time(`Monster Parse ${name}`);
        const ddbMonster = new DDBMonster(monster, {
          extra: this.extra,
          useItemAC: this.useItemAC,
          legacyName: this.legacyName,
          addMonsterEffects: this.addMonsterEffects,
          addChrisPremades: this.addChrisPremades,
          use2024Spells: this.use2024Spells,
        });
        await ddbMonster.parse();
        foundryActors.push(foundry.utils.duplicate(ddbMonster.npc) as unknown as I5eMonsterData);
        logger.timeEnd(`Monster Parse ${name}`);
      } catch (err) {
        logger.error(`Failed parsing ${name}`);
        logger.error(err);
        if (err instanceof Error) logger.error(err.stack);
        failedMonsterNames.push(name);
      }
      // outside the try/catch so failures still count towards the run
      this.overallProgress.advanceHalf();
      this.#notifyOverall("Monsters Parsed");
    }

    const result = {
      actors: await Promise.all(foundryActors),
      failedMonsterNames: failedMonsterNames,
    };

    logger.timeEnd("Monster Parsing");

    this.notifierV2?.({ progress: { current: monsterSource.length, total: monsterSource.length }, message: "", progressBar: "primary", clear: true });

    this.notifier(
      `Parsed ${result.actors.length} monsters, failed ${result.failedMonsterNames.length} monsters`,
      { nameField: false, monsterNote: true },
    );
    logger.info(`Parsed ${result.actors.length} monsters, failed ${result.failedMonsterNames.length} monsters`);
    if (result.failedMonsterNames && result.failedMonsterNames.length !== 0) {
      logger.error(`Failed to parse`, result.failedMonsterNames);
    }

    this.npcs.push(...result.actors);
    return result;
  }

  async #prepareImporter() {
    // to speed up file checking we pregenerate existing files now.
    await DDBReferenceLinker.importCacheLoad();
    logger.info("Checking for existing files...");
    this.notifier(`Checking existing image files...`);
    CONFIG.DDBI.KNOWN.TOKEN_LOOKUPS.clear();
    CONFIG.DDBI.KNOWN.AVATAR_LOOKUPS.clear();
    await Iconizer.preFetchDDBIconImages();
    await FileHelper.generateCurrentFiles(this.uploadDirectory);
    await FileHelper.generateCurrentFiles("[data] modules/ddb-importer/data");

    if ((game as any).canvas3D?.CONFIG?.UI?.TokenBrowser) {
      // generate 3d model cache
      await (game as any).canvas3D.CONFIG.UI.TokenBrowser.preloadData();
    }
  }

  /**
   * Downloads, parses, prepares
   * Takes a list of monsters and parses them into a format suitable for importing
   * into Foundry.
   * @param {object} opts
   * @param {IDDBMonsterSourceData[]} [opts.monsters=[]] A list of monsters to import
   * @param {number} [opts.i=0] The number of monsters imported so far
   * @returns {Promise<I5eMonsterData[]>} A promise that resolves with an array of parsed
   * monster documents
   */
  async #createMonsterDocuments({ monsters = [], i = 0 }: { monsters?: IDDBMonsterSourceData[]; i?: number } = {}): Promise<I5eMonsterData[]> {
    logger.time(`Monster Process Time ${i}`);

    const monsterResults = await this.parse(monsters);

    const itemHandler = new DDBItemImporter<I5eMonsterData>(this.type, monsterResults.actors, {
      notifier: this.notifier,
      notifierV2: this.notifierV2,
      matchFlags: ["id"],
    });
    await itemHandler.init();

    logger.debug("Item Importer Loaded");
    if (!this.update || !this.updateImages) {
      this.notifier(`Calculating which monsters to update...`, { nameField: true });
      const existingMonsters = await itemHandler.loadPassedItemsFromCompendium(itemHandler.documents, {
        keepDDBId: true,
        indexFilter: { fields: ["name", "flags.ddbimporter.id"] },
      }) as I5eMonsterData[];
      const existingMonstersTotal = existingMonsters.length + 1;
      if (!this.update) {
        logger.debug("Removing existing monsters from import list");
        logger.debug(`Matched ${existingMonstersTotal}`);
        this.notifier(`Removing ${existingMonstersTotal} from update...`);
        itemHandler.removeItems(existingMonsters, true);
      }
      if (!this.updateImages) {
        logger.debug("Copying monster images across...");
        this.notifier(`Copying images for ${existingMonstersTotal} monsters...`);
        itemHandler.documents = DDBMonsterFactory.copyExistingMonsterImages<I5eMonsterData>(itemHandler.documents, existingMonsters);
      }
    }
    this.notifier("");
    await itemHandler.iconAdditions();
    this.notifier(`Generating Icon Map..`, { nameField: true });
    await itemHandler.generateIconMap();
    await itemHandler.useSRDMonsterImages();

    logger.timeEnd(`Monster Process Time ${i}`);
    logger.debug(`Monster Document Generation ${i}`, {
      itemHandler,
    });

    return itemHandler.documents;

  }

  async #loadIntoCompendiums(documents: I5eMonsterData[]) {
    const startingCount = this.currentDocument;
    for (const monster of documents) {
      if (this.notifierV2) {
        this.notifierV2?.({
          progress: { current: this.currentDocument - startingCount + 1, total: documents.length },
          section: "monster",
          message: `Importing ${monster.name}`,
          progressBar: "secondary",
        });
      } else {
        this.notifier(`[${this.currentDocument}/${documents.length + startingCount - 1} of ${this.totalDocuments}] Importing ${monster.name} to compendium`, { monsterNote: true });
      }
      logger.debug(`Preparing ${monster.name} data for import`);
      const munched = await DDBMonsterImporter.addNPC(monster, "monsters");
      if (munched) this.monstersParsed.push(munched);
      this.currentDocument += 1;
      this.overallProgress.advanceHalf();
      this.#notifyOverall("Monsters Imported");
    }
    this.notifierV2?.({ progress: { current: documents.length, total: documents.length }, message: "", progressBar: "secondary", clear: true });
  }


  static copyExistingMonsterImages<T extends I5eMonsterData | I5eVehicleData>(monsters: T[], existingMonsters: T[]): T[] {
    const updated = monsters.map((monster) => {
      const existing = existingMonsters.find((m) =>
        monster.name === m.name
        && monster.system.source?.rules === m.system.source?.rules,
      );
      if (existing) {
        monster.img = existing.img;
        const skipKeys = ["name", "sight", "detectionModes", "flags", "light", "ring", "occludable"];
        const monsterToken = monster.prototypeToken;
        const existingToken = existing.prototypeToken;
        if (monsterToken && existingToken) {
          const copyTokenKey = <K extends keyof I5ePrototypeToken>(key: K): void => {
            monsterToken[key] = foundry.utils.deepClone(existingToken[key]);
          };
          for (const key of Object.keys(monsterToken) as (keyof I5ePrototypeToken)[]) {
            if (!skipKeys.includes(key) && foundry.utils.hasProperty(existingToken, key)) {
              copyTokenKey(key);
            }
          }
        }
        return monster;
      } else {
        return monster;
      }
    });
    return updated;
  }

  /**
   * Downloads, parses and imports monsters into a compendium
   * @param {Array} ids a list of monster ids to import, if null imports all monsters
   * @param {string} searchTerm an optional search term
   * @returns {Promise<number|Array>} If ids is null, returns the total number of monsters processed
   * If ids is not null, returns a Promise that resolves with an array of the parsed monster documents
   */
  async processIntoCompendium(ids: number[] | null = null, searchTerm: string | null = null): Promise<number | any[]> {

    logger.time("Monster Import Time");
    await this.#prepareImporter();

    logger.info("Check complete getting monster data...");
    this.notifier(`Getting monster data from DDB...`);
    await this.fetchDDBMonsterSourceData(DDBMonsterFactory.defaultFetchOptions(ids, searchTerm));
    this.notifier("");

    this.notifier(`Checking compendium folders..`, { nameField: true });
    await this.compendiumFolders.loadCompendium("monsters", true);
    this.notifier("", { nameField: true });

    this.totalDocuments = this.source.length;
    this.overallProgress.start(this.totalDocuments);
    this.#notifyOverall("Monsters to Process");

    for (let i = 0; i < this.source.length; i += 100) {
      const sourceDocuments = this.source.slice(i, i + 100);
      logger.debug(`Processing documents for ${i + 1} to ${i + 100}`, { sourceDocuments, this: this });
      const documents = await this.#createMonsterDocuments({ monsters: this.source.slice(i, i + 100), i });
      const monsterCount = this.currentDocument + documents.length - 1;
      this.notifier(`Setting the table for monsters ${i + 1} to ${monsterCount} of ${this.totalDocuments}!`, { nameField: true });
      await this.compendiumFolders.createMonsterFoldersForDocuments({ documents });
      this.notifier(`Preparing dinner for monsters ${i + 1} to ${monsterCount} of ${this.totalDocuments}!`, { nameField: true });
      await this.#loadIntoCompendiums(documents);
      // documents can be culled before import (existing monsters skipped), so
      // realign with the source count actually consumed by this batch
      this.overallProgress.snapTo(Math.min(i + 100, this.totalDocuments));
      this.#notifyOverall("Importing Monsters...");
    }

    this.overallProgress.finish();
    // leave the bar full; the muncher hides it once the run is closed out
    this.#notifyOverall("Monsters Processed");

    logger.debug("Monsters Parsed", this.monstersParsed);
    this.notifier("", { monsterNote: true });

    logger.timeEnd("Monster Import Time");
    if (ids !== null) {
      return Promise.all(this.monstersParsed);
    }
    return this.monstersParsed.length;
  }
}
