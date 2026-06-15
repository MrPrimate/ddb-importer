// Small, dependency-free helpers shared across the native adventure importer.
// Kept import-free (no lib/_module chain) so the dependency-free, unit-tested
// modules (NativeNoteResolution, NativeHeadingAnchors) can use them too.

/** Image file extensions we treat as assets (download/upload + drop href on links). */
export const IMAGE_EXT = /\.(jpe?g|png|gif|webp|webm|svg|bmp|tiff?)$/i;

/** Key an asset path the same way our asset map does: strip a leading slash and
 * ensure the `assets/` prefix. */
export function ensureAssetsPrefix(path: string): string {
  const clean = path.replace(/^\//, "");
  const parts = clean.split("/");
  const idx = parts.lastIndexOf("assets"); // segment-exact, not substring
  // already-localized paths (e.g. ddb-images/adventures/<Name>/assets/<file>)
  // collapse to the canonical assets/<...> key rather than doubling the prefix.
  if (idx !== -1) return parts.slice(idx).join("/");
  return `assets/${clean}`;
}

/** Collect the first capture group of `regex` across every row's html. */
export function scanIds(rows: { html?: string | null }[], regex: RegExp): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) {
    if (!row.html) continue;
    for (const match of row.html.matchAll(regex)) ids.add(match[1]);
  }
  return ids;
}

/** Slugify text into the DDB heading/`slugLink` form: drop everything that is
 * not a word/digit char, case and order preserved (`text.replace(/[^\w\d]+/g, "")`). */
export function ddbSlugify(text: string): string {
  return text.replace(/[^\w\d]+/g, "");
}

/** Build the common `ddb` flag object for journal/table docs. `slug` and
 * `contentChunkId` are always emitted; `cobaltId`/`parentId` are omitted when
 * null/undefined (chapters carry a cobaltId, sections a parentId). */
export function buildDdbFlags(args: {
  ddbId: number;
  bookCode: string;
  slug?: string | null;
  contentChunkId?: string | null;
  cobaltId?: number | null;
  parentId?: number | null;
}): I5eTableDDBFlags | I5eJournalDDBFlags {
  const { ddbId, bookCode, slug, contentChunkId, cobaltId, parentId } = args;
  const ddb: I5eTableDDBFlags = { ddbId, bookCode, slug, contentChunkId };
  if (cobaltId !== null && cobaltId !== undefined) ddb.cobaltId = cobaltId;
  if (parentId !== null && parentId !== undefined) ddb.parentId = parentId;
  return ddb;
}
