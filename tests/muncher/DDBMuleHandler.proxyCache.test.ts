import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import DDBMuleHandler from "../../src/muncher/DDBMuleHandler";
import DDBMuleSocket from "../../src/lib/streaming/DDBMuleSocket";
import DDBProxyCache from "../../src/lib/DDBProxyCache";
import DDBSources from "../../src/lib/DDBSources";
import { buildCacheGroups } from "../../src/apps/DDBSourceBookBrowser";
import { setMockSettings, resetMockSettings } from "../_setup/foundryMocks";

describe("class mule proxy cache", () => {
  const originalCategories = CONFIG.DDB.sourceCategories;
  const originalSources = CONFIG.DDB.sources;

  beforeEach(async () => {
    resetMockSettings();
    setMockSettings({
      "proxy-cache-enabled": true,
      "proxy-cache-ttl-hours": 168,
      "custom-proxy": false,
      "cobalt-cookie-local": false,
      "cobalt-cookie": "test-cobalt",
      "campaign-id": "",
      "munching-policy-character-class-rules-version": "2024",
      "dnd5e.rulesVersion": "modern",
      "munching-policy-character-optional-class-features": false,
      "munching-policy-use-source-filter": false,
      "munching-policy-muncher-included-source-categories": [1, 26],
      "munching-policy-muncher-sources": [],
    });
    CONFIG.DDB.sourceCategories = [
      { id: 1, name: "Core 2014", description: null },
      { id: 26, name: "Core 2024", description: null },
    ];
    CONFIG.DDB.sources = [[2, 1], [3, 1], [145, 26]].map(([id, category]) => ({
      id, name: `Book ${id}`, description: "Test book", sourceCategoryId: category,
      isReleased: true, avatarURL: "", sourceURL: "",
    }));
    await DDBProxyCache._resetForTests();
    globalThis.indexedDB = new IDBFactory();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Unexpected HTTP request"); }));

  });

  afterEach(async () => {
    await DDBProxyCache._resetForTests();
    CONFIG.DDB.sourceCategories = originalCategories;
    CONFIG.DDB.sources = originalSources;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    resetMockSettings();
  });

  it("replays a narrowed class run after reopening and restoring its original selection", async () => {
    const connect = vi.spyOn(DDBMuleSocket.prototype, "connect").mockImplementation(function (this: DDBMuleSocket, handlers) {
      this.handlers = handlers;
    });
    vi.spyOn(DDBMuleSocket.prototype, "auth").mockResolvedValue({ ok: true });
    const start = vi.spyOn(DDBMuleSocket.prototype, "start").mockImplementation(async function (this: DDBMuleSocket) {
      this.handlers?.onEvent({ kind: "class", payload: { id: 12, name: "Test Class" } });
      this.handlers?.onEvent({ kind: "subClasses", payload: [{ id: 10, classId: 12, name: "Test Subclass" }] });
      this.handlers?.onEvent({ kind: "subClassChoices", payload: { debug: { subClassId: 10 }, data: {} } });
      this.handlers?.onDone?.({});
      return { ok: true };
    });
    // Verify both paths replay the same source through the parser boundary without writing compendiums.
    const process = vi.spyOn(DDBMuleHandler.prototype, "_processStreamSubClassChoice").mockResolvedValue();
    const handler = () => new DDBMuleHandler({
      characterId: "123", classId: 12, type: "class", sources: [2], filterIds: [10],
      optionSourceIds: Array.from(DDBSources.getChosenSourceIdSet()),
    });
    await handler()._fetchMuleData();
    const [entry] = await DDBProxyCache.list();
    expect(entry.params.sources).toEqual([2]);
    expect(entry.sourceSelection).toEqual({ categories: [1, 26], books: [], runSources: [2, 3] });
    expect(start.mock.calls[0][1]).not.toHaveProperty("sourceSelection");
    expect(buildCacheGroups([entry])[0].rows[0]).toMatchObject({ matchesSettings: true, adoptable: false });

    // A fresh connection and handler represent reopening the muncher without changing settings.
    await DDBProxyCache._resetForTests();
    await handler()._fetchMuleData();
    expect(connect).toHaveBeenCalledTimes(1);

    setMockSettings({ "munching-policy-muncher-included-source-categories": [26] });
    expect(buildCacheGroups([entry])[0].rows[0].matchesSettings).toBe(false);
    setMockSettings({ "munching-policy-muncher-included-source-categories": [1, 26] });
    expect(buildCacheGroups([entry])[0].rows[0]).toMatchObject({ matchesSettings: true, adoptable: false });
    await handler()._fetchMuleData();
    expect(connect).toHaveBeenCalledTimes(1);
    expect(process).toHaveBeenCalledTimes(3);
    expect(process.mock.calls.every(([payload]) => payload.debug.subClassId === 10)).toBe(true);
    expect((await DDBProxyCache.list()).map((cached) => cached.key)).toEqual([entry.key]);
  });
});
