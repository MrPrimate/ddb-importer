// The list and subclass lookups memoise their results on CONFIG.DDBI.KNOWN in front of the
// persistent cache. A clear or delete that lands while a download is in flight already stops the
// persistent write; the memo must be skipped too, or the next lookup serves the stale list without
// ever fetching. The memo is keyed like the persistent cache, so a different account or campaign
// misses it rather than being handed the previous one's list, and a change of account or campaign
// drops every cached list outright. Both layers keep a list for ten
// minutes only: what DDB returns depends on purchases and campaign sharing, which the key cannot see.

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

/** The values memoised in one session bucket, whatever keys they sit under. */
function memoised(bucket: "MULE_LISTS" | "SUBCLASSES"): unknown[] {
  return Object.values((foundry.utils.getProperty(CONFIG.DDBI.KNOWN, bucket) ?? {}) as Record<string, IDDBMuleSessionMemoEntry>)
    .map((entry) => entry.data);
}

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
    vi.useRealTimers();
    await DDBProxyCache._resetForTests();
    resetMockSettings();
  });

  it("memoises a list once it has been downloaded", async () => {
    post.mockResolvedValue({ success: true, data: [{ id: 1 }] });
    await DDBMuleHandler.getList("feat");
    await DDBMuleHandler.getList("feat");
    expect(post).toHaveBeenCalledTimes(1);
    expect(memoised("MULE_LISTS")).toEqual([[{ id: 1 }]]);
  });

  it("downloads a list again once it is ten minutes old, in the session and the persistent cache", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    post.mockResolvedValueOnce({ success: true, data: [{ id: 1 }] });
    expect(await DDBMuleHandler.getList("class")).toEqual([{ id: 1 }]);

    vi.setSystemTime(Date.now() + 9 * 60 * 1000);
    expect(await DDBMuleHandler.getList("class")).toEqual([{ id: 1 }]);
    expect(post).toHaveBeenCalledTimes(1);

    // an empty memo still finds the persistent entry while it is fresh
    foundry.utils.setProperty(CONFIG.DDBI, "KNOWN.MULE_LISTS", {});
    expect(await DDBMuleHandler.getList("class")).toEqual([{ id: 1 }]);
    expect(post).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + 2 * 60 * 1000);
    post.mockResolvedValueOnce({ success: true, data: [{ id: 1 }, { id: 2 }] });
    expect(await DDBMuleHandler.getList("class")).toEqual([{ id: 1 }, { id: 2 }]);
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("downloads a subclass list again once it is ten minutes old", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const options = { className: "Artificer", classId: 252717, rulesVersion: "2024" as const };
    post.mockResolvedValueOnce({ success: true, data: [{ id: 1 }] });
    expect(await DDBMuleHandler.getSubclassesCached(options)).toEqual([{ id: 1 }]);
    expect(await DDBMuleHandler.getSubclassesCached(options)).toEqual([{ id: 1 }]);
    expect(post).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + 11 * 60 * 1000);
    post.mockResolvedValueOnce({ success: true, data: [{ id: 2 }] });
    expect(await DDBMuleHandler.getSubclassesCached(options)).toEqual([{ id: 2 }]);
    expect(post).toHaveBeenCalledTimes(2);
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

    expect(memoised("MULE_LISTS")).toEqual([]);
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

    expect(memoised("SUBCLASSES")).toEqual([]);
    post.mockResolvedValueOnce({ success: true, data: [{ id: 2 }] });
    expect(await DDBMuleHandler.getSubclassesCached(options)).toEqual([{ id: 2 }]);
    expect(post).toHaveBeenCalledTimes(2);

    // with nothing cleared the memo takes over
    expect(await DDBMuleHandler.getSubclassesCached(options)).toEqual([{ id: 2 }]);
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("does not serve one account's list to another", async () => {
    post.mockResolvedValueOnce({ success: true, data: [{ id: 1 }] });
    expect(await DDBMuleHandler.getList("feat")).toEqual([{ id: 1 }]);

    setMockSettings({ "cobalt-cookie": "other-cobalt-token" });
    post.mockResolvedValueOnce({ success: true, data: [{ id: 2 }] });
    expect(await DDBMuleHandler.getList("feat")).toEqual([{ id: 2 }]);
    expect(post).toHaveBeenCalledTimes(2);

    // the switch dropped every cached list, so switching back downloads again
    setMockSettings({ "cobalt-cookie": "cobalt-token" });
    post.mockResolvedValueOnce({ success: true, data: [{ id: 3 }] });
    expect(await DDBMuleHandler.getList("feat")).toEqual([{ id: 3 }]);
    expect(post).toHaveBeenCalledTimes(3);
  });

  it("drops the persistent and session lists when the cobalt or campaign changes", async () => {
    post.mockResolvedValue({ success: true, data: [{ id: 1 }] });
    await DDBMuleHandler.getList("class");
    await DDBMuleHandler.getSubclassesCached({ className: "Artificer", classId: 252717, rulesVersion: "2024" });
    expect((await DDBProxyCache.stats()).byDomain).toMatchObject({ "mule-list": 1, "subclasses": 1 });

    setMockSettings({ "cobalt-cookie": "other-cobalt-token" });
    await DDBMuleHandler.getList("feat");
    // the other account's class and subclass lists are gone, only the new feat list remains
    expect((await DDBProxyCache.stats()).byDomain).toMatchObject({ "mule-list": 1, "subclasses": 0 });
    expect(memoised("SUBCLASSES")).toEqual([]);
    expect(memoised("MULE_LISTS")).toHaveLength(1);

    setMockSettings({ "campaign-id": "12345" });
    await DDBMuleHandler.getSubclassesCached({ className: "Artificer", classId: 252717, rulesVersion: "2024" });
    expect((await DDBProxyCache.stats()).byDomain).toMatchObject({ "mule-list": 0, "subclasses": 1 });
    expect(memoised("MULE_LISTS")).toEqual([]);
  });

  it("does not serve one campaign's list to another", async () => {
    post.mockResolvedValueOnce({ success: true, data: [{ id: 1 }] });
    expect(await DDBMuleHandler.getList("feat")).toEqual([{ id: 1 }]);

    setMockSettings({ "campaign-id": "12345" });
    post.mockResolvedValueOnce({ success: true, data: [{ id: 2 }] });
    expect(await DDBMuleHandler.getList("feat")).toEqual([{ id: 2 }]);
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1][1]).toMatchObject({ campaignId: "12345" });
  });

  it("keeps the memo per source selection", async () => {
    post.mockResolvedValueOnce({ success: true, data: [{ id: 1 }] });
    post.mockResolvedValueOnce({ success: true, data: [{ id: 2 }] });
    expect(await DDBMuleHandler.getList("feat", [1])).toEqual([{ id: 1 }]);
    expect(await DDBMuleHandler.getList("feat", [2])).toEqual([{ id: 2 }]);
    expect(await DDBMuleHandler.getList("feat", [1])).toEqual([{ id: 1 }]);
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("does not serve one account's subclasses to another", async () => {
    const options = { className: "Fighter", classId: 12, rulesVersion: "2024" as const };
    post.mockResolvedValueOnce({ success: true, data: [{ id: 1 }] });
    expect(await DDBMuleHandler.getSubclassesCached(options)).toEqual([{ id: 1 }]);
    expect(await DDBMuleHandler.getSubclassesCached(options)).toEqual([{ id: 1 }]);
    expect(post).toHaveBeenCalledTimes(1);

    setMockSettings({ "cobalt-cookie": "other-cobalt-token" });
    post.mockResolvedValueOnce({ success: true, data: [{ id: 2 }] });
    expect(await DDBMuleHandler.getSubclassesCached(options)).toEqual([{ id: 2 }]);
    expect(post).toHaveBeenCalledTimes(2);

    setMockSettings({ "campaign-id": "12345" });
    post.mockResolvedValueOnce({ success: true, data: [{ id: 3 }] });
    expect(await DDBMuleHandler.getSubclassesCached(options)).toEqual([{ id: 3 }]);
    expect(post).toHaveBeenCalledTimes(3);
  });

  it("reads the mule character's campaign once per character and account", async () => {
    post.mockResolvedValue({ success: true, data: [{ campaign: { id: 777 } }] });
    expect(await DDBMuleHandler.getMuleCampaignId("mule-memo")).toBe("777");
    expect(await DDBMuleHandler.getMuleCampaignId("mule-memo")).toBe("777");
    expect(post).toHaveBeenCalledTimes(1);

    setMockSettings({ "cobalt-cookie": "other-cobalt-token" });
    expect(await DDBMuleHandler.getMuleCampaignId("mule-memo")).toBe("777");
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("does not memoise a failed campaign lookup, and reads it as no campaign", async () => {
    post.mockResolvedValueOnce({ success: false, message: "offline" });
    expect(await DDBMuleHandler.getMuleCampaignId("mule-failure")).toBeNull();
    post.mockResolvedValueOnce({ success: true, data: [{ campaign: { id: 42 } }] });
    expect(await DDBMuleHandler.getMuleCampaignId("mule-failure")).toBe("42");
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("has no campaign without a mule character or when the character has none", async () => {
    expect(await DDBMuleHandler.getMuleCampaignId(null)).toBeNull();
    expect(post).not.toHaveBeenCalled();
    post.mockResolvedValueOnce({ success: true, data: [{ campaign: null }] });
    expect(await DDBMuleHandler.getMuleCampaignId("mule-no-campaign")).toBeNull();
  });

});
