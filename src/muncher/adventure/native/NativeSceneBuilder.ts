import { logger } from "../../../lib/_module";
import NativeIdFactory from "./NativeIdFactory";
import { scanForScenes } from "./NativeSceneParser";
import { probeImage } from "./NativeImageProbe";
import { buildMasterSceneFolder, buildSceneChapterFolder } from "./NativeFolderBuilder";
import { DEFAULT_LEVEL_ID } from "../AdventureMunch";
import AdventureMunchHelpers from "../AdventureMunchHelpers";
import DDBMapMetaData from "../DDBMapMetaData";
import { ensureAssetsPrefix } from "./NativeShared";
// DetectedScene, ProcessedRow, ItemNotify, BuiltScene + BuiltScenes are declared
// globally in ./types.d.ts.

/**
 * Build the per-book Scene docs from the processed Content rows.
 *
 * Pipeline per row:
 *   1. NativeSceneParser → DetectedScene[] (HTML scan, muncher-parity).
 *   2. NativeImageProbe → real image dimensions (or 2000x2000 fallback).
 *   3. assemble base Scene doc (deterministic id, V14 levels[0].background, default grid,
 *      chapter folder).
 *
 * NO adjustment merging here. Walls/lights/drawings/notes/tokens are applied AFTER
 * scenes are created in the world via NativeSceneApplier (which delegates to
 * `DDBMapMetaData.enrich`, the existing meta-apply path with cleansing + token
 * world-actor resolution + Iconizer-generated note icons).
 *
 * Cross-row dedup: same image used in two pages → only the first becomes a scene
 * (matches the muncher's adventure.sceneImages Set).
 */

const SCENE_SORT_BASE = 100000;
const DEFAULT_PADDING = 0.25;
const DEFAULT_BG_COLOR = "#999999";
const DEFAULT_GRID = { type: 1, size: 100, distance: 5, units: "ft", color: "#000000", alpha: 0.2 };

// BuiltScene + BuiltScenes are declared globally in ./types.d.ts.

/**
 * Resolve a scene background image path to its uploaded Foundry URL.
 * Tries (in order):
 *   1. The run's assetMap (populated by NativeAssetHandler from files.txt +
 *      enhancement-only + bundled-zip phases).
 *   2. `CONFIG.DDBI.KNOWN.LOOKUPS` via the canonical upload path from
 *      `AdventureMunchHelpers.getImportFilePaths` - catches files already
 *      uploaded by a previous session, the legacy AdventureMunch flow, or any
 *      other code path that wrote into the same cache.
 *   3. The raw asset path (warn) - file truly isn't uploaded; Foundry will
 *      404 but the scene still imports.
 *
 * Mirrors what `AdventureMunch.importImage` returns for an already-uploaded
 * path (without lazily downloading, which we can't do without the source).
 */
function resolveBackgroundSrc(assetPath: string, adventureName: string, assetMap: Map<string, string>): string | null {
  const fromMap = assetMap.get(assetPath);
  if (fromMap) return fromMap;
  try {
    const paths = AdventureMunchHelpers.getImportFilePaths({
      adventureName, path: assetPath, misc: false,
    }) as any;
    const cached = CONFIG.DDBI.KNOWN.LOOKUPS.get(paths.pathKey);
    if (cached) return cached as string;
  } catch (error) {
    logger.debug(`NativeSceneBuilder: getImportFilePaths failed for ${assetPath} (${(error as Error).message})`);
  }
  return null;
}

function buildBaseScene(args: {
  detection: DetectedScene;
  row: ProcessedRow;
  bookCode: string;
  bgSrc: string;
  width: number;
  height: number;
  edgeColor: string | null;
  idFactory: NativeIdFactory;
  folderId: string;
}): any {
  const { detection, row, bookCode, bgSrc, width, height, edgeColor, idFactory, folderId } = args;
  const _id = idFactory.getId(NativeIdFactory.makeKey({
    docType: "Scene",
    ddbId: detection.syntheticIdOffset,
    cobaltId: row.cobaltId,
    parentId: row.parentId,
    contentChunkId: detection.contentChunkId,
    name: detection.name,
  }));
  // sampled edge color → matches the painted image edge, so the canvas
  // border blends in (parity with DDBMap.createScene).
  const bgColor = edgeColor ?? DEFAULT_BG_COLOR;

  return {
    _id,
    name: detection.name,
    navName: detection.name.split(":").pop()?.trim() ?? detection.name,
    width,
    height,
    padding: DEFAULT_PADDING,
    initialLevel: DEFAULT_LEVEL_ID,
    levels: [{
      _id: DEFAULT_LEVEL_ID,
      name: "Level",
      background: {
        src: bgSrc,
        color: bgColor,
        tint: "#ffffff",
        alphaThreshold: 0.75,
      },
      foreground: null,
      textures: {
        anchorX: 0.5, anchorY: 0.5, offsetX: 0, offsetY: 0,
        fit: "fill", scaleX: 1, scaleY: 1, rotation: 0,
      },
    }],
    shiftX: 0,
    shiftY: 0,
    grid: { ...DEFAULT_GRID },
    folder: folderId,
    sort: SCENE_SORT_BASE + row.id + detection.syntheticIdOffset,
    ownership: { default: 0 },
    flags: {
      ddbimporter: {
        bookCode,
        sceneAdjustment: false,
        edgeBackgroundColor: edgeColor,
      },
      ddb: {
        ddbId: row.id,
        cobaltId: row.cobaltId,
        parentId: row.parentId,
        contentChunkId: detection.contentChunkId,
        slug: row.slug,
        bookCode,
        source: detection.source,
        player: detection.isPlayer,
        imageFilename: detection.imagePath.split("/").pop() ?? null,
      },
    },
  };
}

/** Build all Scene docs + matching scene folders. Empty book → `{ scenes: [], folders: [] }`. */
export async function buildScenes(
  rows: ProcessedRow[],
  bookCode: string,
  bookName: string,
  assetMap: Map<string, string>,
  idFactory: NativeIdFactory,
  notify?: ItemNotify,
): Promise<BuiltScenes> {
  // 1. Scan every row, collect detections with their owning row. Cross-row
  //    dedup: first row to mention an image wins (muncher behaviour).
  interface Detection { detection: DetectedScene; row: ProcessedRow }
  const all: Detection[] = [];
  const seenImages = new Set<string>();
  for (const row of rows) {
    for (const detection of scanForScenes(row, bookCode)) {
      if (seenImages.has(detection.imagePath)) continue;
      seenImages.add(detection.imagePath);
      all.push({ detection, row });
    }
  }
  if (all.length === 0) {
    logger.info(`NativeSceneBuilder: no scenes detected in ${rows.length} rows`);
    return { scenes: [], folders: [] };
  }
  logger.info(`NativeSceneBuilder: ${all.length} scene(s) detected from ${rows.length} rows`);

  // 2. Lazy folder resolver - master scene folder + per-chapter subfolder keyed
  //    by cobaltId/parentId (matches the muncher's FolderFactory).
  const masterFolder = buildMasterSceneFolder(idFactory, bookCode, bookName);
  const titleByCobalt = new Map<number, string>();
  for (const row of rows) {
    if (row.cobaltId !== null) titleByCobalt.set(row.cobaltId, row.title);
  }
  const folders = new Map<string, I5eFolderData>([[masterFolder._id, masterFolder]]);
  const resolveFolder = (row: ProcessedRow): string => {
    const key = row.cobaltId ?? row.parentId;
    if (key === null) return masterFolder._id;
    const chapter = buildSceneChapterFolder(
      idFactory, masterFolder._id, bookCode, key, titleByCobalt.get(key) ?? `Chapter ${key}`,
    );
    if (!folders.has(chapter._id)) folders.set(chapter._id, chapter);
    return chapter._id;
  };

  // 3. Build base scene docs. probeImage fetches each background once (Blob)
  //    for dimensions + edge-colour sampling; the cache dedupes shared images.
  //    DDBMapMetaData.cleanseSceneInfo runs on every doc to share AdventureMunch's
  //    V14 migration + doorSound/perfect-vision/drawing fixes; no-op for our bare
  //    base docs today, defensive for future embedded-data additions.
  const scenes: BuiltScene[] = [];
  for (let sceneNum = 0; sceneNum < all.length; sceneNum++) {
    const { detection, row } = all[sceneNum];
    notify?.(sceneNum + 1, all.length, "Building scenes");
    const assetKey = ensureAssetsPrefix(detection.imagePath);
    const resolved = resolveBackgroundSrc(assetKey, bookName, assetMap);
    const bgSrc = resolved ?? detection.imagePath;
    if (!resolved) {
      logger.warn(`NativeSceneBuilder: no uploaded asset for ${assetKey}; using raw path (will 404)`);
    }
    const { width, height, edgeColor } = await probeImage(bgSrc);
    const folderId = resolveFolder(row);

    const doc = buildBaseScene({
      detection, row, bookCode, bgSrc, width, height, edgeColor, idFactory, folderId,
    });
    DDBMapMetaData.cleanseSceneInfo(doc);
    scenes.push({ doc, detection, row });
  }

  logger.info(`NativeSceneBuilder: built ${scenes.length} base scene docs in ${folders.size} folders`);
  return { scenes, folders: [...folders.values()] };
}
