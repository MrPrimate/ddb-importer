import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BookData from "../../../src/muncher/adventure/native/BookData";
import DDBProxyCache from "../../../src/lib/DDBProxyCache";
import DDBRunContext from "../../../src/lib/DDBRunContext";
import { setMockSettings, resetMockSettings } from "../../_setup/foundryMocks";

const SIGNED_URL = "https://bucket.example/mobile/v3/tb.zip?Signature=abc";

interface IFetchCall { url: string; range: boolean }

interface IStubState { lastModified: string; body: string; etag?: string }

/** Stub fetch: a full GET returns the zip bytes, a ranged GET one byte; both carry the version headers. */
function stubFetch(state: IStubState): IFetchCall[] {
  const calls: IFetchCall[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const range = "Range" in headers;
    calls.push({ url: String(url), range });
    const body = range ? state.body.slice(0, 1) : state.body;
    const version: Record<string, string> = { "last-modified": state.lastModified };
    if (state.etag) version.etag = state.etag;
    return new Response(body, { status: range ? 206 : 200, headers: version });
  }));
  return calls;
}

async function zipText(blob: Blob): Promise<string> {
  return new TextDecoder().decode(await blob.arrayBuffer());
}

describe("BookData.fetchZip", () => {
  beforeEach(async () => {
    resetMockSettings();
    setMockSettings({
      "proxy-cache-enabled": true,
      "proxy-cache-ttl-hours": 168,
      "custom-proxy": false,
      "cobalt-cookie-local": false,
      "cobalt-cookie": "cobalt-token-a",
      "cors-encode": false,
      "cors-strip-protocol": true,
      "cors-path-prefix": "ddb/",
    });
    await DDBProxyCache._resetForTests();
    (globalThis as any).indexedDB = new IDBFactory();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("downloads once, then reuses the cached zip while Last-Modified is unchanged", async () => {
    const calls = stubFetch({ lastModified: "Wed, 09 Sep 2026 22:04:13 GMT", body: "zip-v1" });
    expect(await zipText(await BookData.fetchZip(1, SIGNED_URL, "tb"))).toBe("zip-v1");
    expect(await zipText(await BookData.fetchZip(1, SIGNED_URL, "tb"))).toBe("zip-v1");
    expect(calls.map((call) => call.range)).toEqual([false, true]);
    expect(calls[0].url).toContain("ddb/bucket.example/mobile/v3/tb.zip");
  });

  it("downloads again when the book changed", async () => {
    const state = { lastModified: "Wed, 09 Sep 2026 22:04:13 GMT", body: "zip-v1" };
    const calls = stubFetch(state);
    await BookData.fetchZip(1, SIGNED_URL, "tb");
    state.lastModified = "Thu, 08 Oct 2026 16:21:10 GMT";
    state.body = "zip-v2";
    expect(await zipText(await BookData.fetchZip(1, SIGNED_URL, "tb"))).toBe("zip-v2");
    // the new copy replaces the old one
    expect(await zipText(await BookData.fetchZip(1, SIGNED_URL, "tb"))).toBe("zip-v2");
    expect(calls.map((call) => call.range)).toEqual([false, true, false, true]);
  });

  it("compares ETags when both sides have one, whatever Last-Modified says", async () => {
    const state: IStubState = { lastModified: "Wed, 09 Sep 2026 22:04:13 GMT", body: "zip-v1", etag: "\"aaa\"" };
    const calls = stubFetch(state);
    await BookData.fetchZip(1, SIGNED_URL, "tb");
    // same object, new date (e.g. a proxy re-fetch): reused
    state.lastModified = "Thu, 08 Oct 2026 16:21:10 GMT";
    expect(await zipText(await BookData.fetchZip(1, SIGNED_URL, "tb"))).toBe("zip-v1");
    // new object, same date: downloaded again
    state.etag = "\"bbb\"";
    state.body = "zip-v2";
    expect(await zipText(await BookData.fetchZip(1, SIGNED_URL, "tb"))).toBe("zip-v2");
    expect(calls.map((call) => call.range)).toEqual([false, true, true, false]);
  });

  it("falls back to Last-Modified for a record stored without an ETag", async () => {
    const state: IStubState = { lastModified: "Wed, 09 Sep 2026 22:04:13 GMT", body: "zip-v1" };
    const calls = stubFetch(state);
    await BookData.fetchZip(1, SIGNED_URL, "tb");
    // the proxy now sends an ETag, but the old record has none: the date decides
    state.etag = "\"aaa\"";
    expect(await zipText(await BookData.fetchZip(1, SIGNED_URL, "tb"))).toBe("zip-v1");
    state.lastModified = "Thu, 08 Oct 2026 16:21:10 GMT";
    state.body = "zip-v2";
    expect(await zipText(await BookData.fetchZip(1, SIGNED_URL, "tb"))).toBe("zip-v2");
    expect(calls.map((call) => call.range)).toEqual([false, true, true, false]);
  });

  it("keeps the decryption key and signed url out of the stored record", async () => {
    stubFetch({ lastModified: "Wed, 09 Sep 2026 22:04:13 GMT", body: "zip-v1", etag: "\"aaa\"" });
    await BookData.fetchZip(1, SIGNED_URL, "tb");
    const [entry] = await DDBProxyCache.list();
    expect(entry.domain).toBe("books");
    expect(entry.params).toEqual({ bookId: 1 });
    const record = await DDBProxyCache.get<IBookZipCacheRecord>({ domain: "books", params: { bookId: 1 } });
    expect(Object.keys(record ?? {}).sort()).toEqual(["blob", "bookCode", "etag", "lastModified"]);
  });

  it("always downloads when the run bypasses the cache, and refreshes the stored copy", async () => {
    const state = { lastModified: "Wed, 09 Sep 2026 22:04:13 GMT", body: "zip-v1" };
    const calls = stubFetch(state);
    await BookData.fetchZip(1, SIGNED_URL, "tb");
    state.body = "zip-v2";
    await DDBRunContext.runWith({ bypassProxyCache: true }, () => BookData.fetchZip(1, SIGNED_URL, "tb"));
    expect(await zipText(await BookData.fetchZip(1, SIGNED_URL, "tb"))).toBe("zip-v2");
    expect(calls.map((call) => call.range)).toEqual([false, false, true]);
  });

  it("neither reads nor stores when the proxy cache is off", async () => {
    setMockSettings({ "proxy-cache-enabled": false });
    const calls = stubFetch({ lastModified: "Wed, 09 Sep 2026 22:04:13 GMT", body: "zip-v1" });
    await BookData.fetchZip(1, SIGNED_URL, "tb");
    await BookData.fetchZip(1, SIGNED_URL, "tb");
    expect(calls.map((call) => call.range)).toEqual([false, false]);
    setMockSettings({ "proxy-cache-enabled": true });
    expect(await DDBProxyCache.list()).toEqual([]);
  });
});

describe("BookData.fetchKey", () => {
  beforeEach(() => {
    resetMockSettings();
    setMockSettings({ "custom-proxy": false });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubKeyResponse(payload: Record<string, unknown>) {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    })));
  }

  it("decodes the key the proxy returns", async () => {
    stubKeyResponse({ success: true, data: btoa("book-key") });
    await expect(BookData.fetchKey(1, "cobalt", "beta")).resolves.toBe("book-key");
  });

  it("names missing access when the proxy answers success without a key", async () => {
    stubKeyResponse({ success: true });
    await expect(BookData.fetchKey(1, "cobalt", "beta")).rejects.toThrow("does not have access");
  });

  it("passes the proxy's own failure message through", async () => {
    stubKeyResponse({ success: false, message: "You must supply a valid cobalt value." });
    await expect(BookData.fetchKey(1, "cobalt", "beta")).rejects.toThrow("You must supply a valid cobalt value.");
  });
});
