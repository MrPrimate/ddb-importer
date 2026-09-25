import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import DDBProxyCache, {
  buildKey,
  currentNamespace,
  fnv1a64,
  sanitiseParams,
  stableStringify,
  CACHE_SCHEMA,
} from "../../src/lib/DDBProxyCache";
import DDBRunContext from "../../src/lib/DDBRunContext";
import { setMockSettings, resetMockSettings } from "../_setup/foundryMocks";

const COBALT = "cobalt-token-a";
const OTHER_COBALT = "cobalt-token-b";

function enableCache(overrides: Record<string, unknown> = {}) {
  setMockSettings({
    "proxy-cache-enabled": true,
    "proxy-cache-ttl-hours": 168,
    "custom-proxy": false,
    "cobalt-cookie-local": false,
    "cobalt-cookie": COBALT,
    ...overrides,
  });
}

async function resetDatabase() {
  await DDBProxyCache._resetForTests();
  (globalThis as any).indexedDB = new IDBFactory();
}

describe("DDBProxyCache", () => {

  beforeEach(async () => {
    resetMockSettings();
    enableCache();
    await resetDatabase();
  });

  // fake-indexeddb delivers its events through timers, so tests that need to move the clock fake
  // only Date (see the toFake option); faking setTimeout stalls every request and hangs the suite
  afterEach(async () => {
    vi.useRealTimers();
    await DDBProxyCache._resetForTests();
    resetMockSettings();
  });

  describe("key derivation", () => {
    it("strips secrets and undefined values", () => {
      expect(sanitiseParams({
        cobalt: "secret", betaKey: "secret", updateId: "x", useCache: true, className: "Wizard", missing: undefined,
      })).toEqual({ className: "Wizard" });
    });

    it("sorts primitive arrays but leaves object arrays in order", () => {
      expect(sanitiseParams({ sources: [3, 1, 2], nested: [{ b: 1 }, { a: 2 }] }))
        .toEqual({ sources: [1, 2, 3], nested: [{ b: 1 }, { a: 2 }] });
    });

    it("is independent of key order and array order", () => {
      const a = buildKey({ domain: "spells", params: { cobalt: COBALT, className: "Wizard", sources: [2, 1] } });
      const b = buildKey({ domain: "spells", params: { sources: [1, 2], className: "Wizard", cobalt: COBALT } });
      expect(a).toBe(b);
    });

    it("sorts nested object keys in stableStringify", () => {
      expect(stableStringify({ b: { d: 1, c: [2, { f: 1, e: 2 }] }, a: null })).toBe("{\"a\":null,\"b\":{\"c\":[2,{\"e\":2,\"f\":1}],\"d\":1}}");
    });

    it("separates accounts, proxies and schema versions in the namespace", () => {
      const params = { className: "Wizard" };
      const mine = buildKey({ domain: "spells", params: { ...params, cobalt: COBALT } });
      const theirs = buildKey({ domain: "spells", params: { ...params, cobalt: OTHER_COBALT } });
      expect(mine).not.toBe(theirs);
      expect(mine.startsWith(`${CACHE_SCHEMA}|https://proxy.ddb.mrprimate.co.uk|${fnv1a64(COBALT)}::spells::`)).toBe(true);

      setMockSettings({ "custom-proxy": true, "api-endpoint": "http://localhost:3000" });
      expect(currentNamespace({ cobalt: COBALT })).toBe(`${CACHE_SCHEMA}|http://localhost:3000|${fnv1a64(COBALT)}`);
    });

    it("falls back to the configured cobalt cookie when params carry none", () => {
      expect(currentNamespace()).toBe(currentNamespace({ cobalt: COBALT }));
    });

    it("hashes deterministically", () => {
      expect(fnv1a64("")).toBe("cbf29ce484222325");
      expect(fnv1a64("a")).toBe("af63dc4c8601ec8c");
    });
  });

  describe("wrap", () => {
    const request = { domain: "spells" as const, params: { cobalt: COBALT, className: "Wizard", rulesVersion: "2024" } };

    it("fetches on a miss, stores, and serves the stored clone afterwards", async () => {
      const fetcher = vi.fn(async () => ({ spells: [{ id: 1 }] }));
      const first = await DDBProxyCache.wrap(request, fetcher);
      expect(first).toEqual({ spells: [{ id: 1 }] });
      // the caller mutating its result must not leak into what the cache serves later
      first.spells.push({ id: 2 });

      const second = await DDBProxyCache.wrap(request, fetcher);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(second).toEqual({ spells: [{ id: 1 }] });
      expect(second).not.toBe(first);
    });

    it("re-fetches once an entry has expired", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
      const fetcher = vi.fn(async () => "value");
      await DDBProxyCache.wrap({ ...request, ttlMs: 1000 }, fetcher);
      vi.setSystemTime(new Date("2026-09-01T00:00:02Z"));
      await DDBProxyCache.wrap({ ...request, ttlMs: 1000 }, fetcher);
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("uses the ttl setting for the expiry", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
      setMockSettings({ "proxy-cache-ttl-hours": 2 });
      await DDBProxyCache.set(request, "value");
      const [entry] = await DDBProxyCache.list();
      expect(entry.expiresAt - entry.createdAt).toBe(2 * 3600000);
    });

    it("passes straight through when disabled and stores nothing", async () => {
      setMockSettings({ "proxy-cache-enabled": false });
      const fetcher = vi.fn(async () => "live");
      expect(await DDBProxyCache.wrap(request, fetcher)).toBe("live");
      expect(await DDBProxyCache.wrap(request, fetcher)).toBe("live");
      expect(fetcher).toHaveBeenCalledTimes(2);
      setMockSettings({ "proxy-cache-enabled": true });
      expect(await DDBProxyCache.get(request)).toBeUndefined();
    });

    it("skips reads but still writes through under a bypass run", async () => {
      await DDBProxyCache.set(request, "stale");
      const fetcher = vi.fn(async () => "fresh");
      const result = await DDBRunContext.runWith({ bypassProxyCache: true }, () => DDBProxyCache.wrap(request, fetcher));
      expect(result).toBe("fresh");
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(await DDBProxyCache.get(request)).toBe("fresh");
    });

    it("shares one fetch between concurrent identical requests", async () => {
      let release: (value: string) => void = () => undefined;
      const fetcher = vi.fn(() => new Promise<string>((resolve) => {
        release = resolve;
      }));
      const a = DDBProxyCache.wrap(request, fetcher);
      const b = DDBProxyCache.wrap(request, fetcher);
      // both callers have to pass their miss before the second can join the in-flight fetch
      await new Promise((resolve) => setTimeout(resolve, 10));
      release("shared");
      expect(await Promise.all([a, b])).toEqual(["shared", "shared"]);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it("gives a caller joining a shared fetch its own copy of the payload", async () => {
      let release: (value: { list: number[] }) => void = () => undefined;
      const fetcher = vi.fn(() => new Promise<{ list: number[] }>((resolve) => {
        release = resolve;
      }));
      const a = DDBProxyCache.wrap(request, fetcher);
      const b = DDBProxyCache.wrap(request, fetcher);
      await new Promise((resolve) => setTimeout(resolve, 10));
      release({ list: [1] });
      const [first, second] = await Promise.all([a, b]);
      first.list.push(2);
      expect(second).toEqual({ list: [1] });
      expect(await DDBProxyCache.get(request)).toEqual({ list: [1] });
    });

    it("does not let a fetch that started before a clear repopulate the cache", async () => {
      let release: (value: string) => void = () => undefined;
      const fetcher = vi.fn(() => new Promise<string>((resolve) => {
        release = resolve;
      }));
      const pending = DDBProxyCache.wrap(request, fetcher);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await DDBProxyCache.clear();
      release("stale");
      expect(await pending).toBe("stale");
      expect(await DDBProxyCache.get(request)).toBeUndefined();
    });

    it("does not let a fetch that started before a delete of its key repopulate the cache", async () => {
      const other = { domain: "spells" as const, params: { cobalt: COBALT, className: "Cleric" } };
      let release: (value: string) => void = () => undefined;
      const fetcher = vi.fn(() => new Promise<string>((resolve) => {
        release = resolve;
      }));
      const pending = DDBProxyCache.wrap(request, fetcher);
      const unrelated = DDBProxyCache.wrap(other, async () => "kept");
      await new Promise((resolve) => setTimeout(resolve, 10));
      await DDBProxyCache.deleteKeys([buildKey(request)]);
      release("stale");
      await Promise.all([pending, unrelated]);
      expect(await DDBProxyCache.get(request)).toBeUndefined();
      expect(await DDBProxyCache.get(other)).toBe("kept");
    });

    it("propagates fetcher rejections without caching them", async () => {
      const fetcher = vi.fn(async () => {
        throw new Error("proxy down");
      });
      await expect(DDBProxyCache.wrap(request, fetcher)).rejects.toThrow("proxy down");
      expect(await DDBProxyCache.get(request)).toBeUndefined();
    });

    it("treats a stored null as a hit", async () => {
      const fetcher = vi.fn(async () => null);
      await DDBProxyCache.wrap(request, fetcher);
      expect(await DDBProxyCache.wrap(request, fetcher)).toBeNull();
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe("bulk, listing and clearing", () => {
    it("stores the original mule selection without changing the request key", async () => {
      const params = { cobalt: COBALT, element: "class", classId: 12, sources: [2], optionSources: [2, 3] };
      const request = { domain: "mule-stream" as const, params };
      const sourceSelection = { categories: [1], books: [], runSources: [2, 3] };
      const labelled = { ...request, sourceSelection };
      expect(buildKey(labelled)).toBe(buildKey(request));
      await DDBProxyCache.set(labelled, { class: { name: "Fighter" } });
      sourceSelection.runSources.push(4);
      expect((await DDBProxyCache.list())[0].sourceSelection)
        .toEqual({ categories: [1], books: [], runSources: [2, 3] });
      expect(await DDBProxyCache.get(request)).toEqual({ class: { name: "Fighter" } });
      expect((await DDBProxyCache.list())[0].params).not.toHaveProperty("sourceSelection");
    });

    it("getMany and setMany round trip with misses interleaved", async () => {
      await DDBProxyCache.setMany("monster-id", [
        { params: { id: 1, cobalt: COBALT }, data: { id: 1, name: "Goblin" } },
        { params: { id: 2, cobalt: COBALT }, data: null, ttlMs: 1000 },
      ]);
      const results = await DDBProxyCache.getMany("monster-id", [
        { id: 1, cobalt: COBALT }, { id: 3, cobalt: COBALT }, { id: 2, cobalt: COBALT },
      ]);
      expect(results).toEqual([{ id: 1, name: "Goblin" }, undefined, null]);
    });

    it("getManyHits carries each hit's expiry", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
      await DDBProxyCache.setMany("monster-id", [
        { params: { id: 1, cobalt: COBALT }, data: { id: 1 } },
        { params: { id: 2, cobalt: COBALT }, data: null, ttlMs: 1000 },
      ]);
      const hits = await DDBProxyCache.getManyHits("monster-id", [{ id: 2, cobalt: COBALT }, { id: 1, cobalt: COBALT }, { id: 3, cobalt: COBALT }]);
      expect(hits[0]).toEqual({ data: null, expiresAt: Date.now() + 1000 });
      expect(hits[1]?.data).toEqual({ id: 1 });
      expect(hits[1]!.expiresAt).toBeGreaterThan(Date.now() + 1000);
      expect(hits[2]).toBeUndefined();
    });

    it("keeps a writer-supplied label with the entry", async () => {
      await DDBProxyCache.set({ domain: "mule-stream", params: { cobalt: COBALT, classId: 12 }, label: "Fighter: Champion" }, { big: true });
      await DDBProxyCache.set({ domain: "mule-stream", params: { cobalt: COBALT, classId: 13 } }, { big: true });
      const entries = await DDBProxyCache.list();
      expect(entries.map((entry) => entry.label).sort()).toEqual(["Fighter: Champion", undefined]);
    });

    it("lists only the current namespace, without payloads", async () => {
      await DDBProxyCache.set({ domain: "spells", params: { cobalt: COBALT, className: "Wizard" } }, ["big"]);
      await DDBProxyCache.set({ domain: "items", params: { cobalt: OTHER_COBALT, campaignId: null } }, ["theirs"]);
      const entries = await DDBProxyCache.list();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({ domain: "spells", params: { className: "Wizard" } });
      expect(entries[0]).not.toHaveProperty("data");
      expect(entries[0].params).not.toHaveProperty("cobalt");
    });

    it("clears one domain or everything across namespaces", async () => {
      await DDBProxyCache.set({ domain: "spells", params: { cobalt: COBALT, className: "Wizard" } }, 1);
      await DDBProxyCache.set({ domain: "items", params: { cobalt: COBALT, campaignId: null } }, 2);
      await DDBProxyCache.set({ domain: "items", params: { cobalt: OTHER_COBALT, campaignId: null } }, 3);

      await DDBProxyCache.clear("spells");
      expect(await DDBProxyCache.get({ domain: "spells", params: { cobalt: COBALT, className: "Wizard" } })).toBeUndefined();
      expect(await DDBProxyCache.get({ domain: "items", params: { cobalt: COBALT, campaignId: null } })).toBe(2);

      await DDBProxyCache.clear();
      expect(await DDBProxyCache.get({ domain: "items", params: { cobalt: COBALT, campaignId: null } })).toBeUndefined();
      expect(await DDBProxyCache.get({ domain: "items", params: { cobalt: OTHER_COBALT, campaignId: null } })).toBeUndefined();
      expect((await DDBProxyCache.stats()).entries).toBe(0);
    });

    it("deletes individual entries by the keys the listing reports", async () => {
      await DDBProxyCache.set({ domain: "subclasses", params: { cobalt: COBALT, className: "Fighter", rulesVersion: "2024" } }, ["a"]);
      await DDBProxyCache.set({ domain: "subclasses", params: { cobalt: COBALT, className: "Wizard", rulesVersion: "2024" } }, ["b"]);
      const fighter = (await DDBProxyCache.list()).find((entry) => entry.params.className === "Fighter")!;

      await DDBProxyCache.deleteKeys([fighter.key]);

      const remaining = await DDBProxyCache.list();
      expect(remaining.map((entry) => entry.params.className)).toEqual(["Wizard"]);
      expect(await DDBProxyCache.get({ domain: "subclasses", params: { cobalt: COBALT, className: "Wizard", rulesVersion: "2024" } })).toEqual(["b"]);
      await expect(DDBProxyCache.deleteKeys([])).resolves.toBeUndefined();
    });

    it("counts entries per domain in stats", async () => {
      await DDBProxyCache.set({ domain: "spells", params: { cobalt: COBALT, className: "Wizard" } }, 1);
      await DDBProxyCache.set({ domain: "spells", params: { cobalt: COBALT, className: "Cleric" } }, 1);
      await DDBProxyCache.set({ domain: "vehicles", params: { cobalt: COBALT } }, 1);
      const stats = await DDBProxyCache.stats();
      expect(stats).toMatchObject({ available: true, enabled: true, entries: 3 });
      expect(stats.byDomain).toMatchObject({ spells: 2, vehicles: 1, items: 0 });
    });

    it("prunes expired records from both stores on first open", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
      await DDBProxyCache.set({ domain: "spells", params: { cobalt: COBALT, className: "Wizard" }, ttlMs: 1000 }, "old");
      await DDBProxyCache.set({ domain: "spells", params: { cobalt: COBALT, className: "Cleric" } }, "new");
      vi.setSystemTime(new Date("2026-09-02T00:00:00Z"));
      // a fresh session against the same database
      await DDBProxyCache._resetForTests();

      expect((await DDBProxyCache.stats()).entries).toBe(1);
      const db = await new Promise<IDBDatabase>((resolve) => {
        const open = indexedDB.open("ddb-importer-proxy-cache", 1);
        open.onsuccess = () => resolve(open.result);
      });
      const payloads = await new Promise<number>((resolve) => {
        const count = db.transaction("payloads").objectStore("payloads").count();
        count.onsuccess = () => resolve(count.result);
      });
      db.close();
      expect(payloads).toBe(1);
    });
  });

  describe("failure handling", () => {
    it("falls through to the fetcher when IndexedDB cannot open, and latches unavailable", async () => {
      (globalThis as any).indexedDB = {
        open: () => {
          throw new Error("no storage here");
        },
      };
      const fetcher = vi.fn(async () => "live");
      expect(await DDBProxyCache.wrap({ domain: "spells", params: { cobalt: COBALT } }, fetcher)).toBe("live");
      expect(DDBProxyCache.isAvailable()).toBe(false);
      expect(DDBProxyCache.isEnabled()).toBe(false);
      expect(await DDBProxyCache.list()).toEqual([]);
      expect((await DDBProxyCache.stats()).available).toBe(false);
    });

    it("reports unavailable when the open request errors", async () => {
      (globalThis as any).indexedDB = {
        open: () => {
          const request: any = { error: new Error("denied") };
          setTimeout(() => request.onerror?.(), 0);
          return request;
        },
      };
      const fetcher = vi.fn(async () => "live");
      expect(await DDBProxyCache.wrap({ domain: "spells", params: { cobalt: COBALT } }, fetcher)).toBe("live");
      expect(DDBProxyCache.isAvailable()).toBe(false);
    });

    it("gives up on an open that never completes and closes it if it finishes later", async () => {
      await DDBProxyCache._resetForTests({ openTimeoutMs: 20 });
      const close = vi.fn();
      let openRequest: any = null;
      (globalThis as any).indexedDB = {
        open: () => {
          openRequest = {};
          return openRequest;
        },
      };
      const fetcher = vi.fn(async () => "live");
      expect(await DDBProxyCache.wrap({ domain: "spells", params: { cobalt: COBALT } }, fetcher)).toBe("live");
      expect(DDBProxyCache.isAvailable()).toBe(false);
      // the abandoned open finally succeeds: its connection must not be kept
      openRequest.result = { close, onversionchange: null };
      openRequest.onsuccess();
      expect(close).toHaveBeenCalledTimes(1);
    });

    it("drops registered session caches on clear, delete and explicit invalidation", async () => {
      const spellsHandler = vi.fn();
      const allHandler = vi.fn();
      DDBProxyCache.registerSessionCache(["spells"], spellsHandler);
      DDBProxyCache.registerSessionCache("all", allHandler);
      await DDBProxyCache.set({ domain: "spells", params: { cobalt: COBALT, className: "Wizard" } }, 1);

      (globalThis as any).CONFIG.DDBI.KNOWN = { MULE_LISTS: { feat: {} }, SUBCLASSES: { 1: {} } };
      await DDBProxyCache.clear("items");
      expect(spellsHandler).not.toHaveBeenCalled();
      expect(allHandler).toHaveBeenCalledTimes(1);
      expect((globalThis as any).CONFIG.DDBI.KNOWN).toEqual({ MULE_LISTS: { feat: {} }, SUBCLASSES: { 1: {} } });

      await DDBProxyCache.clear("subclasses");
      expect((globalThis as any).CONFIG.DDBI.KNOWN).toEqual({ MULE_LISTS: { feat: {} }, SUBCLASSES: {} });

      await DDBProxyCache.deleteKeys([buildKey({ domain: "spells", params: { cobalt: COBALT, className: "Wizard" } })]);
      expect(spellsHandler).toHaveBeenCalledTimes(1);

      await DDBProxyCache.clear();
      DDBProxyCache.invalidateSessionCaches();
      expect(spellsHandler).toHaveBeenCalledTimes(3);
      expect(allHandler).toHaveBeenCalledTimes(5);
    });

    it("skips values that cannot be structured-cloned without throwing", async () => {
      const request = { domain: "spells" as const, params: { cobalt: COBALT, className: "Wizard" } };
      await expect(DDBProxyCache.set(request, { fn: () => undefined })).resolves.toBeUndefined();
      expect(await DDBProxyCache.get(request)).toBeUndefined();
      expect(DDBProxyCache.isAvailable()).toBe(true);
    });
  });

});
