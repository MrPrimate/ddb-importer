/**
 * Deterministic Foundry document id generation for the native (in-browser)
 * adventure importer.
 *
 * The Node muncher (ddb-adventure-muncher IdFactory.js) assigns RANDOM 16-char
 * ids and relies on a persisted key→id map for re-import stability. We cannot
 * reproduce its ids, so instead we derive a *deterministic* id by hashing a
 * composite key built from the DDB identifiers. Same book → same ids on every
 * run, with no persisted map, so re-import updates rather than duplicates.
 *
 * Ids are 16 chars from [A-Za-z0-9], matching Foundry's `randomID()` charset,
 * and are accepted by `createDocuments(..., { keepId: true })`.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

// cyrb128: string → 128-bit seed (four 32-bit ints). Public-domain hash.
function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

// sfc32: seeded PRNG → deterministic stream of floats in [0, 1).
function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

export default class NativeIdFactory {
  // cache so the same key always returns the same id within a run too
  private cache = new Map<string, string>();

  /** Deterministic 16-char id for an arbitrary stable key. */
  getId(key: string): string {
    const cached = this.cache.get(key);
    if (cached) return cached;

    const [a, b, c, d] = cyrb128(key);
    const rand = sfc32(a, b, c, d);
    let id = "";
    for (let i = 0; i < 16; i++) {
      id += ALPHABET[Math.floor(rand() * ALPHABET.length)];
    }
    this.cache.set(key, id);
    return id;
  }

  /** Build a composite key from DDB identifiers (mirrors the muncher's #makeKey). */
  static makeKey(parts: {
    docType: string;
    ddbId?: number | string | null;
    cobaltId?: number | string | null;
    parentId?: number | string | null;
    contentChunkId?: string | null;
    name?: string | null;
  }): string {
    const { docType, ddbId = null, cobaltId = null, parentId = null, contentChunkId = null, name = null } = parts;
    let key = `${docType}|${ddbId}|${cobaltId}|${parentId}`;
    if (contentChunkId) key += `|chunk:${contentChunkId}`;
    if (name) key += `|name:${name}`;
    return key;
  }
}
