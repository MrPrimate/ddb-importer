import { logger, utils, DDBProxy, FileHelper, PatreonHelper, Secrets } from "../../../lib/_module";

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
 *   POST /proxy/adventure/book-codes       → SQLCipher key (base64)
 *   POST /proxy/adventure/book-url/{bookId} → signed CDN url + bookCode
 *
 * The book zip is downloaded through the CORS-proxy. The
 * `.db3` is extracted; the zip stays open (NativeBookZip) for the asset phase.
 */
const BookData = {

  async fetchKey(bookId: number | string, cobalt: string, betaKey: string): Promise<string> {
    const api = DDBProxy.getProxy();
    const response = await fetch(`${api}/proxy/adventure/book-codes`, {
      method: "POST",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cobalt, betaKey, sources: [{ sourceID: Number(bookId), versionID: null }] }),
    });
    const json = await response.json();
    if (!json.success) throw new Error(`book-codes proxy call failed: ${json.message ?? "unknown"}`);
    // proxy returns the DDB base64 payload; decode to the ascii key string
    return atob(json.data);
  },

  async fetchBookUrl(bookId: number | string, cobalt: string, betaKey: string): Promise<{ url: string; bookCode: string }> {
    const api = DDBProxy.getProxy();
    const response = await fetch(`${api}/proxy/adventure/book-url/${bookId}`, {
      method: "POST",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cobalt, betaKey }),
    });
    const json = await response.json();
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

  async acquire(bookId: number | string): Promise<AcquiredBook> {
    const cobalt = Secrets.getCobalt();
    const betaKey = PatreonHelper.getPatreonKey();
    if (!cobalt) throw new Error("No cobalt cookie set  cannot acquire adventure");

    logger.info(`BookData: acquiring book ${bookId}`);
    const key = await BookData.fetchKey(bookId, cobalt, betaKey);
    const { url, bookCode } = await BookData.fetchBookUrl(bookId, cobalt, betaKey);
    logger.info(`BookData: downloading ${bookCode} zip`);
    const zipBlob = await FileHelper.downloadImage(BookData.corsUrl(url));
    const { db3Bytes, zip } = await BookData.openZip(zipBlob, bookCode);
    logger.info(`BookData: extracted ${bookCode}.db3 (${db3Bytes.length} bytes), ${zip.listEntries().length} zip entries`);

    return { bookCode, bookName: bookCode, key, db3Bytes, zip };
  },
};

export default BookData;
