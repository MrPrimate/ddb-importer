import { logger, FileHelper } from "../../../lib/_module";
import AdventureMunchHelpers from "../AdventureMunchHelpers";
import BookData, { type NativeBookZip } from "./BookData";
import { buildEnhancedUrlMap } from "./NativeEnhancements";
import { IMAGE_EXT } from "./NativeShared";
// ItemNotify is declared globally in ./types.d.ts.

/**
 * Downloads adventure images and uploads them to the Foundry path the
 * external ddb-adventure-muncher produces, so a book imported by either tool
 * shares files (no duplicates) and journal image links resolve.
 *
 * Path/dedupe is delegated to AdventureMunchHelpers.getImportFilePaths +
 * FileHelper.uploadImage + the CONFIG.DDBI.KNOWN cache to match the existing
 * AdventureMunch.importImage uses for zip-based imports.
 *
 * Returns a map of `assets/<rest>` → uploaded stored path, for the HTML rewrite.
 */

// Upload one asset to its muncher-matching path (dir-ensure + dedupe + cache).
// `getBlob` is lazy so a cached/known file is never downloaded again.
async function uploadOne(
  assetPath: string,
  adventureName: string,
  getBlob: () => Promise<Blob | null>,
  map: Map<string, string>,
): Promise<void> {
  const paths = AdventureMunchHelpers.getImportFilePaths({ adventureName, path: assetPath, misc: false }) as any;

  if (paths.fullUploadPath && !CONFIG.DDBI.KNOWN.CHECKED_DIRS.has(paths.fullUploadPath)) {
    await FileHelper.verifyPath(paths.parsedBaseUploadPath, `${paths.uploadPath}`);
    await FileHelper.generateCurrentFiles(paths.fullUploadPath);
    CONFIG.DDBI.KNOWN.CHECKED_DIRS.add(paths.fullUploadPath);
  }

  if (!CONFIG.DDBI.KNOWN.FILES.has(paths.pathKey)) {
    const blob = await getBlob();
    if (!blob) return;
    const stored = await FileHelper.uploadImage(blob, paths.fullUploadPath, paths.filename, paths.forcingWebp);
    CONFIG.DDBI.KNOWN.FILES.add(paths.pathKey);
    CONFIG.DDBI.KNOWN.LOOKUPS.set(paths.pathKey, stored);
  }

  const stored = CONFIG.DDBI.KNOWN.LOOKUPS.get(paths.pathKey);
  if (stored) map.set(assetPath, stored);
}

export async function importAssets(
  { zip, adventureName, enhancements = [], notify }:
  { zip: NativeBookZip; adventureName: string; enhancements?: any[]; notify?: ItemNotify },
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const enhancedByPath = buildEnhancedUrlMap(enhancements);
  // Rough total for the secondary bar: manifest local urls + enhancement-only +
  // bundled images. Some are skipped via dedupe, so we force-complete at the end.
  let done = 0;
  let total = 0;
  const tick = (label: string) => notify?.(++done, total, label);
  const zipImageCount = zip.listEntries().filter((n) => IMAGE_EXT.test(n)).length;

  // CORS download with per-url dedupe (same url reused across LocalUrl targets).
  const urlCache = new Map<string, Promise<Blob | null>>();
  const downloadCors = (url: string): Promise<Blob | null> => {
    let p = urlCache.get(url);
    if (!p) {
      p = FileHelper.downloadImage(BookData.corsUrl(url))
        // proxy returns access-denied as application/xml  treat as a miss
        .then((blob) => (blob && blob.type !== "application/xml" ? blob : null))
        .catch(() => null);
      urlCache.set(url, p);
    }
    return p;
  };

  // 1. files.txt manifest - enhanced hiresImg wins over the original RemoteUrl.
  const filesText = await zip.getText("files.txt");
  if (filesText) {
    let manifest: any = {};
    try {
      manifest = JSON.parse(filesText);
    } catch (error) {
      logger.warn(`NativeAssetHandler: could not parse files.txt: ${(error as Error).message}`);
    }
    const files: any[] = manifest.files ?? [];
    logger.info(`NativeAssetHandler: ${files.length} manifest images, ${enhancedByPath.size} enhancements`);
    const manifestUrlCount = files.reduce((acc, f) => acc + (f.LocalUrl?.length ?? 0), 0);
    total = manifestUrlCount + enhancedByPath.size + zipImageCount;
    for (const file of files) {
      const localUrls: string[] = file.LocalUrl ?? [];
      if (localUrls.length === 0 || !file.RemoteUrl) continue;
      for (const localUrl of localUrls) {
        const assetPath = `assets/${localUrl.replace(/^\//, "")}`;
        const url = enhancedByPath.get(assetPath) ?? file.RemoteUrl;
        try {
          await uploadOne(assetPath, adventureName, () => downloadCors(url), map);
        } catch (error) {
          logger.warn(`NativeAssetHandler: failed manifest image ${assetPath}: ${(error as Error).message}`);
        }
        tick(assetPath);
      }
    }
  } else {
    logger.info("NativeAssetHandler: no files.txt in book zip");
    total = enhancedByPath.size + zipImageCount;
  }

  // 2. Enhancement-only images (e.g. scene backgrounds not in files.txt).
  for (const [assetPath, hiresUrl] of enhancedByPath) {
    if (map.has(assetPath)) {
      tick(assetPath); continue;
    }
    try {
      await uploadOne(assetPath, adventureName, () => downloadCors(hiresUrl), map);
    } catch (error) {
      logger.warn(`NativeAssetHandler: failed enhancement image ${assetPath}: ${(error as Error).message}`);
    }
    tick(assetPath);
  }

  // 3. Bundled images already inside the book zip.
  for (const name of zip.listEntries()) {
    if (!IMAGE_EXT.test(name)) continue;
    const assetPath = name.startsWith("assets/") ? name : `assets/${name.replace(/^\//, "")}`;
    if (map.has(assetPath)) {
      tick(assetPath); continue;
    }
    try {
      await uploadOne(assetPath, adventureName, () => zip.getBlob(name), map);
    } catch (error) {
      logger.warn(`NativeAssetHandler: failed bundled image ${name}: ${(error as Error).message}`);
    }
    tick(assetPath);
  }

  if (total > 0) notify?.(total, total, "assets uploaded");
  logger.info(`NativeAssetHandler: uploaded/mapped ${map.size} assets`);
  return map;
}
