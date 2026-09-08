// The list and subclass lookups memoise their results on CONFIG.DDBI.KNOWN in front of the
// persistent cache. A clear or delete that lands while a download is in flight already stops the
// persistent write; the memo must be skipped too, or the next lookup serves the stale list without
// ever fetching.

import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";

vi.mock("../../src/lib/FetchHelper", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  postJson: vi.fn(),
}));

import { postJson } from "../../src/lib/FetchHelper";
import DDBProxyCache from "../../src/lib/DDBProxyCache";
import DDBMuleHandler from "../../src/muncher/DDBMuleHandler";
import { setMockSettings, resetMockSettings } from "../_setup/foundryMocks";

const post = vi.mocked(postJson);

function defer() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("DDBMuleHandler session memos", () => {

  beforeEach(async () => {
    resetMockSettings();
    setMockSettings({
      "proxy-cache-enabled": true,
      "proxy-cache-ttl-hours": 168,
      "custom-proxy": false,
      "cobalt-cookie-local": false,
      "cobalt-cookie": "cobalt-token",
      "campaign-id": "",
    });
    await DDBProxyCache._resetForTests();
    (globalThis as any).indexedDB = new IDBFactory();
    // the memos live under KNOWN, which the pristine test CONFIG does not carry
    foundry.utils.setProperty(CONFIG.DDBI, "KNOWN.MULE_LISTS", {});
    foundry.utils.setProperty(CONFIG.DDBI, "KNOWN.SUBCLASSES", {});
    post.mockReset();
  });

  afterEach(async () => {
    await DDBProxyCache._resetForTests();
    resetMockSettings();
  });

  it("memoises a list once it has been downloaded", async () => {
    post.mockResolvedValue({ success: true, data: [{ id: 1 }] });
    await DDBMuleHandler.getList("feat");
    await DDBMuleHandler.getList("feat");
    expect(post).toHaveBeenCalledTimes(1);
    expect(foundry.utils.getProperty(CONFIG.DDBI.KNOWN, "MULE_LISTS.feat.all")).toEqual([{ id: 1 }]);
  });

  it("does not memoise a list whose download the cache was cleared during", async () => {
    const held = defer();
    const started = defer();
    post.mockImplementationOnce(() => {
      started.resolve();
      return held.promise.then(() => ({ success: true, data: [{ id: 1 }] }));
    });
    const pending = DDBMuleHandler.getList("feat");
    // clear once the download is under way: a clear before it starts is simply followed by a fresh fetch
    await started.promise;
    await DDBProxyCache.clear();
    held.resolve();
    expect(await pending).toEqual([{ id: 1 }]);

    expect(foundry.utils.getProperty(CONFIG.DDBI.KNOWN, "MULE_LISTS.feat.all")).toBeUndefined();
    post.mockResolvedValueOnce({ success: true, data: [{ id: 2 }] });
    expect(await DDBMuleHandler.getList("feat")).toEqual([{ id: 2 }]);
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("does not memoise a subclass list whose download the cache was cleared during", async () => {
    const options = { className: "Fighter", classId: 12, rulesVersion: "2024" as const };
    const held = defer();
    const started = defer();
    post.mockImplementationOnce(() => {
      started.resolve();
      return held.promise.then(() => ({ success: true, data: [{ id: 1 }] }));
    });
    const pending = DDBMuleHandler.getSubclassesCached(options);
    await started.promise;
    await DDBProxyCache.clear();
    held.resolve();
    expect(await pending).toEqual([{ id: 1 }]);

    expect(foundry.utils.getProperty(CONFIG.DDBI.KNOWN, "SUBCLASSES.12.2024")).toBeUndefined();
    post.mockResolvedValueOnce({ success: true, data: [{ id: 2 }] });
    expect(await DDBMuleHandler.getSubclassesCached(options)).toEqual([{ id: 2 }]);
    expect(post).toHaveBeenCalledTimes(2);

    // with nothing cleared the memo takes over
    expect(await DDBMuleHandler.getSubclassesCached(options)).toEqual([{ id: 2 }]);
    expect(post).toHaveBeenCalledTimes(2);
  });

});
