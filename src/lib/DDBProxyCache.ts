import logger from "./Logger";
import utils from "./Utils";
import DDBProxy from "./DDBProxy";
import { getCobalt } from "./Secrets";
import DDBRunContext from "./DDBRunContext";

/**
 * Persistent (IndexedDB) cache of raw ddb-proxy payloads, keyed on the request parameters.
 *
 * The cache sits above the transport: spells, items, monsters and mules stream over a socket
 * first and only fall back to HTTP, and both return the same raw shape, so callers wrap the
 * "raw payload" boundary rather than `postJson`. A cache failure of any kind (IndexedDB missing,
 * quota, uncloneable data) is logged and the live fetch proceeds
 *
 * Two object stores share the same key: `entries` holds the small metadata used to list and prune,
 * `payloads` holds the (potentially tens of MB) data. An IDB cursor loads whole values, so listing
 * only ever touches `entries`.
 */

export const PROXY_CACHE_DOMAINS: TProxyCacheDomain[] = [
  "spells",
  "items",
  "monsters",
  "monster-id",
  "vehicles",
  "mule-list",
  "subclasses",
  "mule-stream",
];

interface IProxyCachePayload {
  key: string;
  data: unknown;
}

/** Bump whenever the record shape or the sanitisation rules change: old entries become unreachable. */
export const CACHE_SCHEMA = 1;

const DB_NAME = "ddb-importer-proxy-cache";
const DB_VERSION = 1;
const ENTRIES_STORE = "entries";
const PAYLOADS_STORE = "payloads";
const DEFAULT_TTL_HOURS = 168;

// request fields that must never influence the key: credentials, and per-call plumbing the proxy
// ignores for the purposes of the response body
const STRIPPED_KEYS = new Set(["cobalt", "betaKey", "updateId", "useCache"]);

let _dbPromise: Promise<IDBDatabase | null> | null = null;
let _broken = false;
let _pruned = false;
const _inFlight = new Map<string, Promise<unknown>>();

// Invalidation stamps. A write started before a clear or delete must not land after it, so every
// fetch captures the stamp for its key up front and the write is skipped if it moved. Clearing
// bumps the global generation; deleting bumps the affected keys only.
let _tick = 0;
let _generation = 0;
const _keyGenerations = new Map<string, number>();

// Session (in-memory) caches layered in front of the persistent one register a drop handler here
// so clearing, deleting and bypassing can empty them too. Registered at module load by their owners.
type TSessionCacheHandler = () => void;
const _sessionCaches: { domains: TProxyCacheDomain[] | "all"; handler: TSessionCacheHandler }[] = [];

// An IndexedDB open that neither succeeds nor fails (blocked by another connection, or a wedged
// storage backend) must not hang every import behind it.
const DEFAULT_OPEN_TIMEOUT_MS = 10000;
let _openTimeoutMs = DEFAULT_OPEN_TIMEOUT_MS;

/**
 * FNV-1a 64-bit as a hex string. Used to discriminate accounts by cobalt cookie without storing it.
 * Synchronous on purpose: `crypto.subtle` is undefined on the plain-http LAN origins many Foundry
 * servers use, and the cookie is already plaintext in localStorage
 */
export function fnv1a64(input: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * prime) & mask;
  }
  return hash.toString(16).padStart(16, "0");
}

function comparePrimitives(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  const sa = `${typeof a}:${String(a)}`;
  const sb = `${typeof b}:${String(b)}`;
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

function sanitiseValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(sanitiseValue).filter((item) => item !== undefined);
    // order of id / source lists never changes the response, so normalise it out of the key
    const allPrimitive = items.every((item) => item === null || typeof item !== "object");
    return allPrimitive ? items.sort(comparePrimitives) : items;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (STRIPPED_KEYS.has(key) || entry === undefined) continue;
      out[key] = sanitiseValue(entry);
    }
    return out;
  }
  return value;
}

/** Strip secrets and undefined values, and sort primitive arrays, so equivalent requests share a key. */
export function sanitiseParams(params: Record<string, unknown>): Record<string, unknown> {
  return sanitiseValue(params ?? {}) as Record<string, unknown>;
}

/** JSON with recursively sorted object keys, so key order in the caller's body does not matter. */
export function stableStringify(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

function resolveProxyUrl(): string {
  try {
    return DDBProxy.getProxy();
  } catch (_err) {
    return "unknown";
  }
}

function resolveCobalt(params: Record<string, unknown> | undefined): string {
  const fromParams = params?.cobalt;
  if (typeof fromParams === "string") return fromParams;
  try {
    return getCobalt();
  } catch (_err) {
    return "";
  }
}

/** Namespace prefix for the proxy and account a request will actually be served by. */
export function currentNamespace(params?: Record<string, unknown>): string {
  return `${CACHE_SCHEMA}|${resolveProxyUrl()}|${fnv1a64(resolveCobalt(params))}`;
}

export function buildKey(request: IProxyCacheRequest): string {
  return `${currentNamespace(request.params)}::${request.domain}::${stableStringify(sanitiseParams(request.params))}`;
}

function invalidationStamp(key: string): number {
  return Math.max(_generation, _keyGenerations.get(key) ?? 0);
}

function invalidateKeys(keys: string[]): void {
  for (const key of keys) {
    _inFlight.delete(key);
    _keyGenerations.set(key, ++_tick);
  }
}

function invalidateAll(): void {
  _inFlight.clear();
  _keyGenerations.clear();
  _generation = ++_tick;
}

function domainOfKey(key: string): TProxyCacheDomain | undefined {
  return PROXY_CACHE_DOMAINS.find((domain) => key.includes(`::${domain}::`));
}

/** A clone for a caller joining a shared fetch; falls back to the shared value when uncloneable. */
function cloneForCaller<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch (_err) {
    return value;
  }
}

function markBroken(err: unknown): void {
  if (!_broken) {
    logger.warn(`[proxy-cache] disabled for this session: ${(err as Error)?.message ?? String(err)}`);
  }
  _broken = true;
}

function isQuotaError(err: unknown): boolean {
  return (err as DOMException)?.name === "QuotaExceededError";
}

function warnOnFailure(operation: string, err: unknown): void {
  if (isQuotaError(err)) {
    logger.warn(`[proxy-cache] ${operation} failed: browser storage quota exceeded. Clear the cache from the Sources and Cache window.`);
  } else {
    logger.warn(`[proxy-cache] ${operation} failed: ${(err as Error)?.message ?? String(err)}`);
  }
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
  });
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (_broken || typeof indexedDB === "undefined") return Promise.resolve(null);
  _dbPromise ??= new Promise<IDBDatabase | null>((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      markBroken(err);
      resolve(null);
      return;
    }
    let abandoned = false;
    const timer = setTimeout(() => {
      abandoned = true;
      markBroken(new Error(`open did not complete within ${_openTimeoutMs}ms`));
      resolve(null);
    }, _openTimeoutMs);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
        const entries = db.createObjectStore(ENTRIES_STORE, { keyPath: "key" });
        entries.createIndex("domain", "domain", { unique: false });
        entries.createIndex("expiresAt", "expiresAt", { unique: false });
        entries.createIndex("namespace", "namespace", { unique: false });
      }
      if (!db.objectStoreNames.contains(PAYLOADS_STORE)) {
        db.createObjectStore(PAYLOADS_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => {
      clearTimeout(timer);
      const db = request.result;
      if (abandoned) {
        // the callers have already been told the cache is unavailable; do not leak the handle
        db.close();
        return;
      }
      // another tab upgrading the schema: drop our handle so the next call reopens cleanly
      db.onversionchange = () => {
        db.close();
        _dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      clearTimeout(timer);
      if (!abandoned) markBroken(request.error);
      resolve(null);
    };
    request.onblocked = () => {
      logger.warn("[proxy-cache] open blocked by another connection; giving up shortly if it stays blocked");
    };
  });
  return _dbPromise;
}

/**
 * Remove expired records. Namespace-agnostic, so entries orphaned by a rotated cookie, a changed
 * proxy URL or a schema bump disappear within one TTL without special handling.
 */
async function prune(db: IDBDatabase): Promise<number> {
  const tx = db.transaction([ENTRIES_STORE, PAYLOADS_STORE], "readwrite");
  const entries = tx.objectStore(ENTRIES_STORE);
  const payloads = tx.objectStore(PAYLOADS_STORE);
  const range = IDBKeyRange.upperBound(Date.now());
  let removed = 0;
  await new Promise<void>((resolve, reject) => {
    const cursorRequest = entries.index("expiresAt").openCursor(range);
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) {
        resolve();
        return;
      }
      const key = (cursor.value as IProxyCacheEntry).key;
      cursor.delete();
      payloads.delete(key);
      removed++;
      cursor.continue();
    };
    cursorRequest.onerror = () => reject(cursorRequest.error ?? new Error("prune cursor failed"));
  });
  await transactionDone(tx);
  return removed;
}

async function getDatabase(): Promise<IDBDatabase | null> {
  const db = await openDatabase();
  if (db && !_pruned) {
    _pruned = true;
    try {
      const removed = await prune(db);
      if (removed > 0) logger.debug(`[proxy-cache] pruned ${removed} expired entries`);
    } catch (err) {
      warnOnFailure("prune", err);
    }
  }
  return db;
}

type TStoreWork<T> = (entries: IDBObjectStore, payloads: IDBObjectStore) => Promise<T>;

/**
 * Run work against both stores in one transaction. Resolves undefined (never rejects) when the
 * cache is unavailable or the transaction fails, so callers can treat any problem as a miss.
 */
async function withStores<T>(mode: IDBTransactionMode, operation: string, work: TStoreWork<T>): Promise<T | undefined> {
  const db = await getDatabase();
  if (!db) return undefined;
  try {
    const tx = db.transaction([ENTRIES_STORE, PAYLOADS_STORE], mode);
    const done = transactionDone(tx);
    // the same promise is awaited below; this handler only stops an abort surfacing as unhandled
    // when `work` throws first
    done.catch(() => undefined);
    const result = await work(tx.objectStore(ENTRIES_STORE), tx.objectStore(PAYLOADS_STORE));
    await done;
    return result;
  } catch (err) {
    warnOnFailure(operation, err);
    return undefined;
  }
}

function resolveTtlMs(ttlMs: number | undefined): number {
  if (typeof ttlMs === "number" && ttlMs > 0) return ttlMs;
  let hours = DEFAULT_TTL_HOURS;
  try {
    const setting = utils.getSetting<number>("proxy-cache-ttl-hours");
    if (typeof setting === "number" && Number.isFinite(setting) && setting > 0) hours = setting;
  } catch (_err) {
    // settings not registered yet (or no game): fall back to the default
  }
  return hours * 3600000;
}

function cloneForStorage(data: unknown): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: structuredClone(data) };
  } catch (err) {
    logger.warn(`[proxy-cache] payload is not storable, skipping: ${(err as Error)?.message ?? String(err)}`);
    return { ok: false };
  }
}

function buildEntry(request: IProxyCacheRequest, now: number): IProxyCacheEntry {
  const entry: IProxyCacheEntry = {
    key: buildKey(request),
    namespace: currentNamespace(request.params),
    domain: request.domain,
    createdAt: now,
    expiresAt: now + resolveTtlMs(request.ttlMs),
    params: sanitiseParams(request.params),
  };
  if (request.label) entry.label = request.label;
  if (request.sourceSelection) entry.sourceSelection = structuredClone(request.sourceSelection);
  return entry;
}

/**
 * Read one key inside an open transaction. Distinguishes a stored null (a valid hit, used for
 * unknown monster ids) from a miss by returning undefined only when there is no live record.
 */
async function readOneHit<T>(entries: IDBObjectStore, payloads: IDBObjectStore, key: string, now: number): Promise<IProxyCacheHit<T> | undefined> {
  const entry = await requestToPromise(entries.get(key)) as IProxyCacheEntry | undefined;
  if (!entry || entry.expiresAt <= now) return undefined;
  const payload = await requestToPromise(payloads.get(key)) as IProxyCachePayload | undefined;
  if (!payload) return undefined;
  return { data: payload.data as T, expiresAt: entry.expiresAt };
}

async function readOne<T>(entries: IDBObjectStore, payloads: IDBObjectStore, key: string, now: number): Promise<T | undefined> {
  return (await readOneHit<T>(entries, payloads, key, now))?.data;
}

const DDBProxyCache = {

  CACHE_SCHEMA,

  isAvailable(): boolean {
    return !_broken && typeof indexedDB !== "undefined";
  },

  isEnabled(): boolean {
    if (!DDBProxyCache.isAvailable()) return false;
    try {
      return utils.getSetting<boolean>("proxy-cache-enabled") === true;
    } catch (_err) {
      return false;
    }
  },

  /** True when the current run has asked to bypass reads. Writes still happen so the cache refreshes. */
  isRefreshing(): boolean {
    return DDBRunContext.bypassProxyCache;
  },

  buildKey,
  sanitiseParams,
  stableStringify,
  currentNamespace,

  async get<T = unknown>(request: IProxyCacheRequest): Promise<T | undefined> {
    if (!DDBProxyCache.isAvailable()) return undefined;
    const key = buildKey(request);
    const now = Date.now();
    return withStores("readonly", "get", (entries, payloads) => readOne<T>(entries, payloads, key, now));
  },

  /** Invalidation stamp for a request, to pass back to `set` so a write started before a clear is dropped. */
  stampFor(request: IProxyCacheRequest): number {
    return invalidationStamp(buildKey(request));
  },

  /** Global invalidation generation, to pass back to `setMany`. */
  get generation(): number {
    return _generation;
  },

  /**
   * Register an in-memory cache that fronts the persistent one. `clear`, `deleteKeys` and
   * `invalidateSessionCaches` call the handler when one of its domains is affected.
   */
  registerSessionCache(domains: TProxyCacheDomain[] | "all", handler: TSessionCacheHandler): void {
    _sessionCaches.push({ domains, handler });
  },

  /** Drop every registered in-memory cache, or only those covering `domain`. Never throws. */
  invalidateSessionCaches(domain?: TProxyCacheDomain): void {
    // the mule memos live on CONFIG rather than in a module, so they are handled here directly
    // instead of registered from DDBMuleHandler (which cannot register at load: see the monster factory)
    const known = (globalThis as { CONFIG?: { DDBI?: { KNOWN?: Record<string, unknown> } } }).CONFIG?.DDBI?.KNOWN;
    if (known) {
      if (domain === undefined || domain === "mule-list") known.MULE_LISTS = {};
      if (domain === undefined || domain === "subclasses") known.SUBCLASSES = {};
    }
    for (const { domains, handler } of _sessionCaches) {
      if (domain !== undefined && domains !== "all" && !domains.includes(domain)) continue;
      try {
        handler();
      } catch (err) {
        logger.warn(`[proxy-cache] session cache handler failed: ${(err as Error)?.message ?? String(err)}`);
      }
    }
  },

  async set<T = unknown>(request: IProxyCacheRequest, data: T, { stamp }: { stamp?: number } = {}): Promise<void> {
    if (!DDBProxyCache.isAvailable()) return;
    const cloned = cloneForStorage(data);
    if (!cloned.ok) return;
    const entry = buildEntry(request, Date.now());
    if (stamp !== undefined && invalidationStamp(entry.key) !== stamp) return;
    await withStores("readwrite", "set", async (entries, payloads) => {
      entries.put(entry);
      payloads.put({ key: entry.key, data: cloned.value } satisfies IProxyCachePayload);
    });
  },

  async getMany<T = unknown>(domain: TProxyCacheDomain, paramsList: Record<string, unknown>[]): Promise<(T | undefined)[]> {
    const hits = await DDBProxyCache.getManyHits<T>(domain, paramsList);
    return hits.map((hit) => hit?.data);
  },

  /**
   * `getMany` with each hit's expiry, so an in-memory layer seeded from the cache can let a record
   * lapse when the persisted one would have, rather than serving it for the rest of the session.
   */
  async getManyHits<T = unknown>(domain: TProxyCacheDomain, paramsList: Record<string, unknown>[]): Promise<(IProxyCacheHit<T> | undefined)[]> {
    if (paramsList.length === 0) return [];
    if (!DDBProxyCache.isAvailable()) return paramsList.map(() => undefined);
    const now = Date.now();
    const keys = paramsList.map((params) => buildKey({ domain, params }));
    const result = await withStores("readonly", "getManyHits", (entries, payloads) =>
      Promise.all(keys.map((key) => readOneHit<T>(entries, payloads, key, now))),
    );
    return result ?? paramsList.map(() => undefined);
  },

  async setMany<T = unknown>(
    domain: TProxyCacheDomain,
    items: IProxyCacheSetManyEntry<T>[],
    { generation }: { generation?: number } = {},
  ): Promise<void> {
    if (items.length === 0 || !DDBProxyCache.isAvailable()) return;
    if (generation !== undefined && generation !== _generation) return;
    const now = Date.now();
    const records: { entry: IProxyCacheEntry; data: unknown }[] = [];
    for (const item of items) {
      const cloned = cloneForStorage(item.data);
      if (!cloned.ok) continue;
      records.push({ entry: buildEntry({ domain, params: item.params, ttlMs: item.ttlMs }, now), data: cloned.value });
    }
    if (records.length === 0) return;
    await withStores("readwrite", "setMany", async (entries, payloads) => {
      for (const record of records) {
        entries.put(record.entry);
        payloads.put({ key: record.entry.key, data: record.data } satisfies IProxyCachePayload);
      }
    });
  },

  async delete(request: IProxyCacheRequest): Promise<void> {
    await DDBProxyCache.deleteKeys([buildKey(request)]);
  },

  /** Remove specific records by their full keys (as returned by `list()`). */
  async deleteKeys(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    invalidateKeys(keys);
    for (const domain of new Set(keys.map(domainOfKey))) {
      if (domain) DDBProxyCache.invalidateSessionCaches(domain);
    }
    if (!DDBProxyCache.isAvailable()) return;
    await withStores("readwrite", "deleteKeys", async (entries, payloads) => {
      for (const key of keys) {
        entries.delete(key);
        payloads.delete(key);
      }
    });
  },

  /** Clear one domain, or everything (across every namespace, so stale accounts go too). */
  async clear(domain?: TProxyCacheDomain): Promise<void> {
    invalidateAll();
    DDBProxyCache.invalidateSessionCaches(domain);
    if (!DDBProxyCache.isAvailable()) return;
    await withStores("readwrite", "clear", async (entries, payloads) => {
      if (!domain) {
        entries.clear();
        payloads.clear();
        return;
      }
      const keys = await requestToPromise(entries.index("domain").getAllKeys(domain)) as IDBValidKey[];
      for (const key of keys) {
        entries.delete(key);
        payloads.delete(key);
      }
    });
  },

  /** Live entries for the proxy and account the next request will hit. Never loads payloads. */
  async list(): Promise<IProxyCacheEntry[]> {
    if (!DDBProxyCache.isAvailable()) return [];
    const now = Date.now();
    const namespace = currentNamespace();
    const rows = await withStores("readonly", "list", async (entries) =>
      await requestToPromise(entries.index("namespace").getAll(namespace)) as IProxyCacheEntry[],
    );
    return (rows ?? [])
      .filter((entry) => entry.expiresAt > now)
      .sort((a, b) => a.domain.localeCompare(b.domain) || b.createdAt - a.createdAt);
  },

  async stats(): Promise<IProxyCacheStats> {
    const stats: IProxyCacheStats = {
      available: DDBProxyCache.isAvailable(),
      enabled: DDBProxyCache.isEnabled(),
      entries: 0,
      byDomain: {},
    };
    if (!stats.available) return stats;
    const counts = await withStores("readonly", "stats", async (entries) => {
      const total = await requestToPromise(entries.count());
      const byDomain: Record<string, number> = {};
      for (const domain of PROXY_CACHE_DOMAINS) {
        byDomain[domain] = await requestToPromise(entries.index("domain").count(domain));
      }
      return { total, byDomain };
    });
    if (counts) {
      stats.entries = counts.total;
      stats.byDomain = counts.byDomain;
    }
    try {
      const estimate = await navigator.storage?.estimate?.();
      if (estimate) {
        stats.originUsageBytes = estimate.usage;
        stats.originQuotaBytes = estimate.quota;
      }
    } catch (_err) {
      // storage estimate is optional
    }
    return stats;
  },

  /**
   * Serve `request` from the cache, or run `fetcher` and store its result. Concurrent identical
   * requests share one fetch. The store is awaited before returning so the stored clone is taken
   * before the caller mutates the payload in place.
   */
  async wrap<T>(request: IProxyCacheRequest, fetcher: () => Promise<T>): Promise<T> {
    if (!DDBProxyCache.isEnabled()) return fetcher();
    const key = buildKey(request);
    if (!DDBProxyCache.isRefreshing()) {
      const cached = await DDBProxyCache.get<T>(request);
      if (cached !== undefined) {
        logger.debug(`[proxy-cache] hit ${request.domain}`);
        return cached;
      }
    }
    // a joiner gets its own copy: downstream parsing mutates payloads in place
    const pending = _inFlight.get(key);
    if (pending) return (pending as Promise<T>).then(cloneForCaller);

    const stamp = invalidationStamp(key);
    const work = (async () => {
      const data = await fetcher();
      await DDBProxyCache.set(request, data, { stamp });
      return data;
    })();
    _inFlight.set(key, work);
    try {
      return await work;
    } finally {
      _inFlight.delete(key);
    }
  },

  /** Drop the memoised connection and session latches. Tests only. */
  async _resetForTests({ openTimeoutMs = DEFAULT_OPEN_TIMEOUT_MS }: { openTimeoutMs?: number } = {}): Promise<void> {
    // not awaited: a stalled open would otherwise hang the reset itself
    _dbPromise?.then((db) => db?.close()).catch(() => undefined);
    _dbPromise = null;
    _broken = false;
    _pruned = false;
    _inFlight.clear();
    _keyGenerations.clear();
    _openTimeoutMs = openTimeoutMs;
  },

};

export default DDBProxyCache;
