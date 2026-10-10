import { logger, utils, DDBProxy, DDBProxyCache, DDBSources, PatreonHelper, postJson, Secrets } from "../../../lib/_module";

/**
 * A still-open handle on the downloaded book zip, so callers can read the
 * `files.txt` manifest and any bundled assets after the `.db3` is extracted.
 * Call `close()` when done.
 */
export class NativeBookZip {
  private reader: any;
  private entries: any[];

  constructor(reader: any, entries: any[]) {
    this.reader = reader;
    this.entries = entries;
  }

  listEntries(): string[] {
    return this.entries.map((e) => e.filename);
  }

  #find(name: string): any | undefined {
    return this.entries.find((e) => e.filename === name)
      ?? this.entries.find((e) => e.filename.toLowerCase().endsWith(name.toLowerCase()));
  }

  async getText(name: string): Promise<string | null> {
    const entry = this.#find(name);
    if (!entry) return null;
    const zip = (globalThis.window as any).zip;
    return entry.getData(new zip.TextWriter());
  }

  async getBlob(name: string): Promise<Blob | null> {
    const entry = this.#find(name);
    if (!entry) return null;
    const zip = (globalThis.window as any).zip;
    return entry.getData(new zip.BlobWriter(zip.getMimeType(entry.filename)));
  }

  async close(): Promise<void> {
    try {
      await this.reader.close();
    } catch (error) {
      logger.warn(`NativeBookZip: error closing reader: ${(error as Error).message}`);
    }
  }
}

// AcquiredBook is declared globally in ./types.d.ts.

/**
 * Browser-side data acquisition for adventures - replaces the Node muncher's
 * ddb.js/Config.js download flow.
 *
 * Proxy routes (in the proxy repo):
 *   POST /proxy/adventure/book-codes       -> SQLCipher key (base64)
 *   POST /proxy/adventure/book-url/{bookId} -> signed CDN url + bookCode
 *
 * The book zip is downloaded through the CORS-proxy. The
 * `.db3` is extracted; the zip stays open (NativeBookZip) for the asset phase.
 */
const BookData = {

  async fetchKey(bookId: number | string, cobalt: string, betaKey: string): Promise<string> {
    const api = DDBProxy.getProxy();
    const json = await postJson(`${api}/proxy/adventure/book-codes`, {
      cobalt,
      betaKey,
      sources: [{ sourceID: Number(bookId), versionID: null }],
    });
    if (!json.success) throw new Error(`book-codes proxy call failed: ${json.message ?? "unknown"}`);
    // a book the account cannot open still answers success, just without a key
    if (typeof json.data !== "string" || json.data === "") {
      throw new Error(`No key for book ${bookId}: this D&D Beyond account does not have access to it`);
    }
    // proxy returns the DDB base64 payload; decode to the ascii key string
    return atob(json.data);
  },

  async fetchBookUrl(bookId: number | string, cobalt: string, betaKey: string): Promise<{ url: string; bookCode: string }> {
    const api = DDBProxy.getProxy();
    const json = await postJson(`${api}/proxy/adventure/book-url/${bookId}`, { cobalt, betaKey });
    if (!json.success) throw new Error(`book-url proxy call failed: ${json.message ?? "unknown"}`);
    return { url: json.data.url, bookCode: json.data.bookCode };
  },

  // Route a (signed) url through the CORS proxy, preserving its query string.
  corsUrl(url: string): string {
    const urlEncode = utils.getSetting<boolean>("cors-encode");
    const stripProtocol = utils.getSetting<boolean>("cors-strip-protocol");
    const corsPathPrefix = utils.getSetting<string>("cors-path-prefix");
    const proxyEndpoint = DDBProxy.getCORSProxy();
    const fiddled = stripProtocol ? url.replace(/^https:\/\//, corsPathPrefix) : `${corsPathPrefix}${url}`;
    const target = urlEncode ? encodeURIComponent(fiddled) : fiddled;
    return proxyEndpoint + target;
  },

  // Open the downloaded zip, extract the `.db3` bytes, and keep the reader open.
  async openZip(zipBlob: Blob, bookCode: string): Promise<{ db3Bytes: Uint8Array; zip: NativeBookZip }> {
    const zipApi = (globalThis.window as any).zip;
    const reader = new zipApi.ZipReader(new zipApi.BlobReader(zipBlob));
    const entries = await reader.getEntries();

    const wanted = `${bookCode.toLowerCase()}.db3`;
    const db3Entry = entries.find((e: any) => e.filename.toLowerCase().endsWith(wanted))
      ?? entries.find((e: any) => e.filename.toLowerCase().endsWith(".db3"));
    if (!db3Entry) {
      await reader.close();
      throw new Error(`No .db3 found in book zip for ${bookCode}`);
    }
    const dataBlob = await db3Entry.getData(new zipApi.BlobWriter());
    const db3Bytes = new Uint8Array(await dataBlob.arrayBuffer());

    return { db3Bytes, zip: new NativeBookZip(reader, entries) };
  },

  /** The zip version headers of a response: ETag first, Last-Modified as the fallback. */
  versionOf(response: Response): IBookZipVersion {
    return { etag: response.headers.get("etag"), lastModified: response.headers.get("last-modified") };
  },

  /**
   * Whether a cached zip is still the current one. ETags are compared when both sides have one
   * (the CORS proxy exposes it for zips, which it always fetches from S3); otherwise Last-Modified.
   * With neither comparable the cached copy is kept and only the cache TTL limits it.
   */
  isSameVersion(cached: IBookZipVersion, current: IBookZipVersion): boolean {
    if (cached.etag && current.etag) return cached.etag === current.etag;
    if (cached.lastModified && current.lastModified) return cached.lastModified === current.lastModified;
    return true;
  },

  /** Download the book zip through the CORS proxy, keeping its version headers. */
  async downloadZip(url: string, attempt = 1): Promise<{ blob: Blob } & IBookZipVersion> {
    try {
      const response = await fetch(BookData.corsUrl(url), { headers: { "x-requested-with": "foundry" } });
      if (!response.ok) throw new Error(`book download failed: ${response.status}`);
      return { blob: await response.blob(), ...BookData.versionOf(response) };
    } catch (error) {
      if (attempt >= 5) throw error;
      const delay = 1000 * Math.pow(2, attempt - 1);
      logger.warn(`BookData: download attempt ${attempt} failed, retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return BookData.downloadZip(url, attempt + 1);
    }
  },

  /** The zip's current version headers, from a one-byte ranged request. Null when unreadable. */
  async probeVersion(url: string): Promise<IBookZipVersion | null> {
    try {
      const response = await fetch(BookData.corsUrl(url), { headers: { "x-requested-with": "foundry", "Range": "bytes=0-0" } });
      // drain the single byte (or a whole body from a server ignoring Range) so the socket is freed
      await response.arrayBuffer();
      return response.ok ? BookData.versionOf(response) : null;
    } catch (_error) {
      return null;
    }
  },

  /**
   * The book zip, from the browser's proxy cache when it is still current, else downloaded (and
   * stored when the proxy cache is on). Only the zip is cached: it holds the encrypted `.db3`,
   * `files.txt` and css, while images are fetched separately. The decryption key is never stored.
   * A one-byte probe checks a cached zip against the current one (`isSameVersion`).
   */
  async fetchZip(bookId: number | string, url: string, bookCode: string): Promise<Blob> {
    if (!DDBProxyCache.isEnabled()) return (await BookData.downloadZip(url)).blob;

    const bookName = DDBSources.getBookName(bookCode);
    const request: IProxyCacheRequest = {
      domain: "books",
      params: { bookId: Number(bookId) },
      label: bookName ? `${bookName} (${bookCode})` : bookCode,
    };
    if (!DDBProxyCache.isRefreshing()) {
      const cached = await DDBProxyCache.get<IBookZipCacheRecord>(request);
      if (cached?.blob) {
        // records stored before ETags were kept have no etag field
        const cachedVersion = { etag: cached.etag ?? null, lastModified: cached.lastModified };
        const current = await BookData.probeVersion(url);
        if (!current || BookData.isSameVersion(cachedVersion, current)) {
          logger.info(`BookData: using cached ${bookCode} zip (${cached.blob.size} bytes)`);
          return cached.blob;
        }
        logger.info(`BookData: ${bookCode} changed since it was cached`, { cached: cachedVersion, current });
      }
    }

    const stamp = DDBProxyCache.stampFor(request);
    logger.info(`BookData: downloading ${bookCode} zip`);
    const { blob, etag, lastModified } = await BookData.downloadZip(url);
    await DDBProxyCache.set<IBookZipCacheRecord>(request, { blob, bookCode, etag, lastModified }, { stamp });
    return blob;
  },

  async acquire(bookId: number | string): Promise<AcquiredBook> {
    const cobalt = Secrets.getCobalt();
    const betaKey = PatreonHelper.getPatreonKey();
    if (!cobalt) throw new Error("No cobalt cookie set  cannot acquire adventure");

    logger.info(`BookData: acquiring book ${bookId}`);
    // both calls stay live: the key is never cached, and the signed url is what checks a cached zip
    const key = await BookData.fetchKey(bookId, cobalt, betaKey);
    const { url, bookCode } = await BookData.fetchBookUrl(bookId, cobalt, betaKey);
    const zipBlob = await BookData.fetchZip(bookId, url, bookCode);
    const { db3Bytes, zip } = await BookData.openZip(zipBlob, bookCode);
    logger.info(`BookData: extracted ${bookCode}.db3 (${db3Bytes.length} bytes), ${zip.listEntries().length} zip entries`);

    return { bookCode, bookName: bookCode, key, db3Bytes, zip };
  },
};

export default BookData;
