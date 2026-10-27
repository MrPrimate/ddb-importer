// Small, dependency-free helpers shared across the native adventure importer.
// Kept import-free (no lib/_module chain) so the dependency-free, unit-tested
// modules (NativeNoteResolution, NativeHeadingAnchors) can use them too.

/**
 * Tell the user some adventure content could not be imported, as the zip importer does
 * (AdventureMunchHelpers.tryCheckForMissingDocuments); the import carries on without it.
 */
export function warnImportFailure(what: string): void {
  ui.notifications?.warn(`Could not import the missing ${what} from DDB; the adventure will be imported without them.`, { permanent: true });
}

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

// trailing version markers a player/DM pair of map files differ by
const MAP_VARIANT_SUFFIX = /-(player|map|unlabeled|ungridded|dm|gm)$/i;

/**
 * URLs to try for an asset that neither the book zip, its files.txt download nor the enhancement data
 * produced. DDB keeps a book's images in one CDN folder, but files.txt often lists only the DM version of
 * a map whose player version the book html links, so the file is looked for next to its sibling (same
 * name without the `-player` style suffix) and then in the book's most used compendium image folder.
 */
export function remoteAssetCandidates(assetPath: string, remoteUrls: string[], bookCode: string, max = 3): string[] {
  const file = assetPath.replace(/^assets\//, "").split("/").pop()?.trim() ?? "";
  if (!file) return [];
  const stem = (name: string) => name.replace(/\.[a-z0-9]+$/i, "").replace(MAP_VARIANT_SUFFIX, "").toLowerCase();
  const wanted = stem(file);
  const dirOf = (url: string) => url.split("?")[0].replace(/[^/]*$/, "");
  const nameOf = (url: string) => decodeURIComponentSafe(url.split("?")[0].split("/").pop() ?? "");

  const siblingDirs: string[] = [];
  const bookDirCounts = new Map<string, number>();
  const bookFolder = new RegExp(`/compendium[-_]images/${bookCode}/`, "i");
  for (const url of remoteUrls) {
    if (typeof url !== "string" || !(/^https?:\/\//i).test(url)) continue;
    const dir = dirOf(url);
    if (stem(nameOf(url)) === wanted) siblingDirs.push(dir);
    if (bookFolder.test(url)) bookDirCounts.set(dir, (bookDirCounts.get(dir) ?? 0) + 1);
  }
  const bookDirs = [...bookDirCounts].sort((a, b) => b[1] - a[1]).map(([dir]) => dir);
  const dirs = [...new Set([...siblingDirs, ...bookDirs])];
  return dirs.slice(0, max).map((dir) => `${dir}${encodeURIComponent(file)}`);
}

/** decodeURIComponent that returns its input for a malformed escape. */
export function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
}

/**
 * True for a download that is an S3 error document rather than the image: the CORS proxy passes a denied
 * object through as a 200 with the image's content type and a ~250 byte `<Error><Code>AccessDenied...`
 * body, which would otherwise be uploaded as the image. Only small bodies are read.
 */
export async function isErrorDocument(blob: Blob): Promise<boolean> {
  if (blob.size === 0) return true;
  if (blob.size > 4096) return false;
  const text = await blob.text();
  return (/^\s*(<\?xml[^>]*>\s*)?<Error>/i).test(text);
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
