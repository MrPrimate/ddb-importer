import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import DDBMuleHandler from "../../src/muncher/DDBMuleHandler";
import DDBMuleSocket from "../../src/lib/streaming/DDBMuleSocket";
import DDBProxyCache from "../../src/lib/DDBProxyCache";
import { resetMockSettings, setMockSettings } from "../_setup/foundryMocks";

const aarakocra = { data: { race: { fullName: "Aarakocra", entityRaceId: 4, entityRaceTypeId: 1743923279 } } };
const dwarf = { data: { race: { fullName: "Mountain Dwarf", entityRaceId: 4, entityRaceTypeId: 1228963568 } } };
const keys = ["1743923279:4", "1228963568:4"];

function handler(speciesKeys: string[] = keys) {
  return new DDBMuleHandler({ characterId: "123", type: "species", sources: [2, 15], speciesKeys });
}

function socketWith(entries = [aarakocra, dwarf], cached = false) {
  vi.spyOn(DDBMuleSocket.prototype, "connect").mockImplementation(function (this: DDBMuleSocket, handlers) {
    this.handlers = handlers; 
  });
  vi.spyOn(DDBMuleSocket.prototype, "auth").mockResolvedValue({ ok: true });
  return vi.spyOn(DDBMuleSocket.prototype, "start").mockImplementation(async function (this: DDBMuleSocket) {
    if (cached) {
      this.handlers?.onEvent({ kind: "cacheHit", payload: { data: { speciesOptions: entries } } });
    } else {
      for (const payload of entries) this.handlers?.onEvent({ kind: "speciesOptions", payload, raceTotal: entries.length });
    }
    this.handlers?.onDone?.({});
    return { ok: true };
  });
}

describe("species mule response identity and cache isolation", () => {
  beforeEach(async () => {
    resetMockSettings();
    setMockSettings({
      "proxy-cache-enabled": true, "proxy-cache-ttl-hours": 168,
      "custom-proxy": false, "cobalt-cookie-local": false, "cobalt-cookie": "test-cobalt", "campaign-id": "",
      "munching-policy-character-class-rules-version": "2014", "dnd5e.rulesVersion": "modern",
      "munching-policy-character-optional-class-features": false,
      "munching-policy-use-source-filter": false, "munching-policy-muncher-included-source-categories": [],
      "munching-policy-muncher-sources": [],
    });
    await DDBProxyCache._resetForTests();
    globalThis.indexedDB = new IDBFactory();
    vi.spyOn(DDBMuleHandler.prototype, "_getStreamMockActor").mockReturnValue({} as TImporterActor);
    vi.spyOn(DDBMuleHandler.prototype, "_buildDDBStub").mockResolvedValue({} as IDDBData);
    vi.spyOn(DDBMuleHandler.prototype, "_speciesProcess").mockResolvedValue();
    vi.spyOn(DDBMuleHandler.prototype, "notifier").mockImplementation(() => undefined);
  });
  afterEach(async () => {
    await DDBProxyCache._resetForTests(); vi.restoreAllMocks(); resetMockSettings(); 
  });

  it.each([false, true])("imports both colliding species and preserves them on local replay (proxy cache=%s)", async (cached) => {
    const start = socketWith([aarakocra, dwarf, aarakocra], cached);
    const first = handler();
    await first._fetchMuleData();
    expect(start.mock.calls[0][1].speciesKeys).toEqual(keys);
    expect(first._streamSecondaryUnits).toEqual(new Set(keys));
    const [entry] = await DDBProxyCache.list();
    expect(entry.params.speciesIdentityVersion).toBe(1);
    expect(entry.label).toBe("Species: 2 selected");
    const second = handler();
    await second._fetchMuleData();
    expect(start).toHaveBeenCalledTimes(1);
    expect(second._streamSecondaryTotal).toBe(2);
    expect(second._streamSecondaryUnits).toEqual(new Set(keys));
    expect(DDBMuleHandler.prototype._speciesProcess).toHaveBeenCalledTimes(6);
  });

  it.each([false, true])("rejects another species before parsing (proxy cache=%s)", async (cached) => {
    socketWith([dwarf], cached);
    await expect(handler([keys[0]])._fetchMuleData()).rejects.toThrow(/unexpected species/);
    expect(DDBMuleHandler.prototype._speciesProcess).not.toHaveBeenCalled();
    expect(await DDBProxyCache.list()).toEqual([]);
  });

  it("rejects mismatched local cache content before any cached entry is parsed", async () => {
    socketWith([aarakocra]);
    await handler([keys[0]])._fetchMuleData();
    const [entry] = await DDBProxyCache.list();
    await DDBProxyCache.set({ domain: "mule-stream", params: entry.params }, { speciesOptions: [aarakocra, dwarf] });
    vi.mocked(DDBMuleHandler.prototype._speciesProcess).mockClear();
    await expect(handler([keys[0]])._fetchMuleData()).rejects.toThrow(/unexpected species/);
    expect(DDBMuleHandler.prototype._speciesProcess).not.toHaveBeenCalled();
  });

  it("does not reuse old numeric-only cache entries even for an all-species request", async () => {
    const start = socketWith();
    await handler([])._fetchMuleData();
    const [entry] = await DDBProxyCache.list();
    const { speciesIdentityVersion: _version, speciesKeys: _keys, ...oldParams } = entry.params;
    await DDBProxyCache.deleteKeys([entry.key]);
    await DDBProxyCache.set({ domain: "mule-stream", params: oldParams }, { speciesOptions: [dwarf] });
    await handler([])._fetchMuleData();
    expect(start).toHaveBeenCalledTimes(2);
  });

  it("keeps typed selections in labels and diagnostic filenames", () => {
    expect(handler([keys[0]])._rawExampleFileName()).toContain("f1743923279-4");
    expect(handler([keys[1]])._rawExampleFileName()).toContain("f1228963568-4");
    expect(handler()._cacheLabel()).toBe("Species: 2 selected");
    expect(handler([])._cacheLabel()).toBe("Species: all");
    expect(() => handler(["4"])).toThrow(/Invalid species selection/);
  });
});
