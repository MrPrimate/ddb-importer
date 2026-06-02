import logger from "./Logger";

/**
 * PROOF OF CONCEPT: in-browser SQLCipher decryption of DDB adventure `.db3` files.
 *
 * Uses the prebuilt SQLite3MultipleCiphers WASM build (vendored under
 * `vendor/sqlite3mc/jswasm/`). This is the same cipher implementation that
 * `better-sqlite3-multiple-ciphers` wraps natively in ddb-adventure-muncher, so
 * the legacy-SQLCipher (v3) parameters used there apply unchanged here.
 *
 * Replicates ddb-adventure-muncher/munch/adventure/Database.js:60-72.
 *
 * NOTE: throwaway POC scope. Decrypt + query only. No data acquisition (key
 * fetch / zip download) and no pipeline porting - see plan.
 */

const WASM_MODULE_PATH = "modules/ddb-importer/vendor/sqlite3mc/jswasm/sqlite3.mjs";

// SQLCipher legacy-3 read recipe for SQLite3MC. Strict order: cipher first,
// legacy second, key LAST. `legacy=3` configures ALL SQLCipher-v3 defaults
// (1024 page size, 64000 kdf_iter, HMAC-SHA1, PBKDF2-HMAC-SHA1) atomically.
// Do NOT also set cipher_hmac_algorithm / cipher_kdf_algorithm explicitly -
// in the wasm build those override legacy=3 with mis-parsed values, producing
// a header HMAC mismatch (SQLITE_NOTADB) on the first read.
const CIPHER_PRAGMAS = (key: string): string[] => [
  "PRAGMA cipher='sqlcipher'",
  "PRAGMA legacy=3",
  // escape single quotes so arbitrary key bytes can't break the SQL
  `PRAGMA key='${key.replace(/'/g, "''")}'`,
];

// A plaintext SQLite file begins with this 16-byte magic; encrypted files do not.
function isPlaintextSqlite(bytes: Uint8Array): boolean {
  const magic = "SQLite format 3\0";
  if (bytes.length < magic.length) return false;
  return new TextDecoder("latin1").decode(bytes.slice(0, magic.length)) === magic;
}

export interface ContentRow {
  id: number;
  cobaltId: number | null;
  parentId: number | null;
  slug: string | null;
  title: string | null;
  html: string | null;
}

// Cached, lazily-initialised WASM sqlite3 namespace.
let _sqlite3: any = null;

// Hide the ESM URL from webpack so it is fetched natively at runtime from the
// served module directory (the .mjs locates its sibling .wasm via import.meta.url).
const nativeImport = new Function("url", "return import(url);") as (url: string) => Promise<any>;

function moduleUrl(relPath: string): string {
  const getRoute = (globalThis as any).foundry?.utils?.getRoute;
  const routed = getRoute ? getRoute(relPath) : `/${relPath}`;
  return `${globalThis.location.origin}${routed}`;
}

async function initSqlite(): Promise<any> {
  if (_sqlite3) return _sqlite3;
  const url = moduleUrl(WASM_MODULE_PATH);
  logger.debug(`SqliteCipher: loading WASM module from ${url}`);
  const mod = await nativeImport(url);
  const sqlite3InitModule = mod.default;
  _sqlite3 = await sqlite3InitModule({
    print: (msg: string) => logger.debug(`sqlite3: ${msg}`),
    printErr: (msg: string) => logger.warn(`sqlite3: ${msg}`),
  });
  logger.debug(`SqliteCipher: SQLite3MC ${_sqlite3.capi.sqlite3_libversion()} ready`);
  return _sqlite3;
}

const DEFAULT_QUERY
  = "SELECT ID as id, CobaltID as cobaltId, ParentID as parentId, Slug as slug, Title as title, RenderedHTML as html FROM Content";

/**
 * Decrypt an encrypted `.db3` held in memory and run a query against it.
 *
 * @param bytes the raw encrypted database file
 * @param key   the SQLCipher key (from DDB book-codes API; supplied manually for the POC)
 * @param sql   optional query; defaults to the muncher's `Content` extraction
 */
export async function decryptAndQuery(bytes: Uint8Array, key: string, sql: string = DEFAULT_QUERY): Promise<ContentRow[]> {
  const sqlite3 = await initSqlite();
  const filename = `/ddb-poc-${foundry.utils.randomID()}.db3`;

  const plaintext = isPlaintextSqlite(bytes);
  logger.debug(`SqliteCipher: ${bytes.length} bytes, plaintext=${plaintext}, keyLength=${key.length}`);
  if (plaintext) {
    logger.warn("SqliteCipher: file is an UNencrypted SQLite db - no key needed. Decryption is irrelevant for this file.");
  }

  // Load the bytes into the default (in-memory) VFS as a file.
  sqlite3.capi.sqlite3_js_vfs_create_file(0, filename, bytes, bytes.length);

  const db = new sqlite3.oo1.DB(filename, "r");
  try {
    // Cipher config first, key LAST. Skip entirely for a plaintext file.
    if (!plaintext) {
      for (const pragma of CIPHER_PRAGMAS(key)) {
        db.exec(pragma);
      }
    }
    const rows: ContentRow[] = [];
    db.exec({ sql, rowMode: "object", callback: (row: ContentRow) => rows.push(row) });
    return rows;
  } finally {
    db.close();
  }
}

/**
 * Debug harness: prompt for an encrypted `.db3` and a key, decrypt, and log the
 * `Content` table. Callable from the console:
 *   game.modules.get("ddb-importer").api.sqliteCipherRaw()
 */
export async function sqliteCipherRaw(): Promise<ContentRow[] | undefined> {
  const content = `
    <form>
      <div class="form-group">
        <label>Encrypted .db3 file</label>
        <input type="file" name="db3" accept=".db3,.db,.sqlite,.sqlite3" autofocus />
      </div>
      <div class="form-group">
        <label>SQLCipher key</label>
        <input type="text" name="key" placeholder="key from book-codes API" />
      </div>
    </form>`;

  const result = await foundry.applications.api.DialogV2.wait({
    rejectClose: false,
    window: { title: "DDBI SqliteCipher POC" },
    position: { width: 480 },
    content,
    buttons: [
      {
        action: "decrypt",
        label: "Decrypt + Query",
        icon: "fas fa-key",
        default: true,
        callback: async (_event: any, button: any) => {
          const form: HTMLFormElement = button.form;
          const fileInput = form.querySelector("input[name='db3']") as HTMLInputElement;
          const keyInput = form.querySelector("input[name='key']") as HTMLInputElement;
          const file = fileInput?.files?.[0];
          const key = keyInput?.value;
          if (!file || !key) return null;
          return { bytes: new Uint8Array(await file.arrayBuffer()), key, name: file.name };
        },
      },
      { action: "cancel", label: "Cancel", icon: "fas fa-times", callback: () => null },
    ],
  }) as { bytes: Uint8Array; key: string; name: string } | null;

  if (!result) {
    logger.warn("SqliteCipher POC: cancelled or missing file/key");
    return undefined;
  }

  const { bytes, key, name: fileName } = result;
  logger.info(`SqliteCipher POC: decrypting ${fileName} (${bytes.length} bytes)`);

  try {
    const rows = await decryptAndQuery(bytes, key);
    logger.info(`SqliteCipher POC: decrypted OK - Content rows: ${rows.length}`);
    logger.info("SqliteCipher POC: first rows", rows.slice(0, 3));
    // eslint-disable-next-line no-console
    console.log("DDBI SqliteCipher POC rows", rows);
    return rows;
  } catch (err) {
    logger.error("SqliteCipher POC: decryption/query failed (wrong key or cipher mismatch?)", err);
    throw err;
  }
}
