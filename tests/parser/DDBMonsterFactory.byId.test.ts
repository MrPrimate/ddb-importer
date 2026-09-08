import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import DDBProxyCache from "../../src/lib/DDBProxyCache";
import DDBRunContext from "../../src/lib/DDBRunContext";
import {
  shouldFallbackAfterByIdStream,
  _readPersistedIds,
  _writePersistedIds,
  _idCacheGet,
  _idCacheSet,
} from "../../src/parser/DDBMonsterFactory";
import { setMockSettings, resetMockSettings } from "../_setup/foundryMocks";

const COBALT = "cobalt-token";

function monster(id: number): IDDBMonsterSourceData {
  return { id, name: `Monster ${id}` } as unknown as IDDBMonsterSourceData;
}

describe("DDBMonsterFactory by-id persistence", () => {

  beforeEach(async () => {
    resetMockSettings();
    setMockSettings({
      "proxy-cache-enabled": true,
      "proxy-cache-ttl-hours": 168,
      "custom-proxy": false,
      "cobalt-cookie-local": false,
      "cobalt-cookie": COBALT,
    });
    await DDBProxyCache._resetForTests();
    (globalThis as any).indexedDB = new IDBFactory();
  });

  // fake-indexeddb delivers its events through timers, so tests that need to move the clock fake
  // only Date (see the toFake option); faking setTimeout stalls every request and hangs the suite
  afterEach(async () => {
    vi.useRealTimers();
    await DDBProxyCache._resetForTests();
    resetMockSettings();
  });

  describe("shouldFallbackAfterByIdStream", () => {
    it("falls back only when ids were actually fetched and nothing came back", () => {
      expect(shouldFallbackAfterByIdStream(3, 0)).toBe(true);
      expect(shouldFallbackAfterByIdStream(3, 2)).toBe(false);
      // every id served from the caches: no fetch happened, so an empty raw count means nothing
      expect(shouldFallbackAfterByIdStream(0, 0)).toBe(false);
    });
  });

  describe("persisted ids", () => {
    it("remembers returned monsters and, briefly, the ids the proxy had nothing for", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
      await _writePersistedIds([1, 2, 3], [monster(1), monster(3)], { cobalt: COBALT });

      const found = await _readPersistedIds([1, 2, 3, 4], { cobalt: COBALT });
      expect(found.get(1)?.data).toMatchObject({ id: 1 });
      expect(found.get(2)?.data).toBeNull();
      expect(found.get(3)?.data).toMatchObject({ id: 3 });
      expect(found.has(4)).toBe(false);
      // the hits carry their own expiry so the in-memory layer can honour it
      expect(found.get(2)?.expiresAt).toBe(Date.parse("2026-09-01T01:00:00Z"));
      expect(found.get(1)!.expiresAt).toBeGreaterThan(found.get(2)!.expiresAt);

      // the null is forgotten after an hour, the monsters are kept for the full ttl
      vi.setSystemTime(new Date("2026-09-01T02:00:00Z"));
      const later = await _readPersistedIds([1, 2], { cobalt: COBALT });
      expect(later.has(1)).toBe(true);
      expect(later.has(2)).toBe(false);
    });

    it("does not remember anything from an empty response", async () => {
      await _writePersistedIds([1, 2], [], { cobalt: COBALT });
      expect((await _readPersistedIds([1, 2], { cobalt: COBALT })).size).toBe(0);
    });

    it("coerces string ids from the proxy onto the numeric keys that were requested", async () => {
      await _writePersistedIds([7], [{ id: "7", name: "Seven" } as unknown as IDDBMonsterSourceData], { cobalt: COBALT });
      expect((await _readPersistedIds([7], { cobalt: COBALT })).get(7)?.data).toMatchObject({ name: "Seven" });
    });

    it("reads nothing when the cache is disabled or bypassed", async () => {
      await _writePersistedIds([1], [monster(1)], { cobalt: COBALT });
      expect((await DDBRunContext.runWith({ bypassProxyCache: true }, () => _readPersistedIds([1], { cobalt: COBALT }))).size).toBe(0);
      setMockSettings({ "proxy-cache-enabled": false });
      expect((await _readPersistedIds([1], { cobalt: COBALT })).size).toBe(0);
    });

    it("keeps accounts apart", async () => {
      await _writePersistedIds([1], [monster(1)], { cobalt: COBALT });
      expect((await _readPersistedIds([1], { cobalt: "someone-else" })).size).toBe(0);
    });

    it("keeps a custom monster endpoint's records apart from the configured proxy's", async () => {
      await _writePersistedIds([1], [monster(1)], { cobalt: COBALT });
      await _writePersistedIds([2], [monster(2)], { cobalt: COBALT, endpoint: "https://other.example/monsters" });
      expect((await _readPersistedIds([1, 2], { cobalt: COBALT })).has(2)).toBe(false);
      const other = await _readPersistedIds([1, 2], { cobalt: COBALT, endpoint: "https://other.example/monsters" });
      expect(other.has(1)).toBe(false);
      expect(other.get(2)?.data).toMatchObject({ id: 2 });
    });

    it("drops a write whose fetch started before the cache was cleared", async () => {
      const generation = DDBProxyCache.generation;
      await DDBProxyCache.clear();
      await _writePersistedIds([1], [monster(1)], { cobalt: COBALT, generation });
      expect((await _readPersistedIds([1], { cobalt: COBALT })).size).toBe(0);
      await _writePersistedIds([1], [monster(1)], { cobalt: COBALT, generation: DDBProxyCache.generation });
      expect((await _readPersistedIds([1], { cobalt: COBALT })).size).toBe(1);
    });
  });

  describe("in-memory id cache", () => {
    it("lets a record lapse at the expiry it was seeded with", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
      _idCacheSet(1, monster(1), Number.POSITIVE_INFINITY);
      _idCacheSet(2, null, Date.now() + 3600000);
      expect(_idCacheGet(1)?.data).toMatchObject({ id: 1 });
      expect(_idCacheGet(2)?.data).toBeNull();

      // the remembered miss is forgotten after its hour; the monster stays for the session
      vi.setSystemTime(new Date("2026-09-01T01:00:00Z"));
      expect(_idCacheGet(2)).toBeUndefined();
      expect(_idCacheGet(1)?.data).toMatchObject({ id: 1 });
    });
  });

});
