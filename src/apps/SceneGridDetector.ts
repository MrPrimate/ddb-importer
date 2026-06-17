import {
  logger,
  detectGrid,
  buildCandidateSummary,
  getMapScaleMultiplier,
  resolveGrid,
} from "../lib/_module";

export interface ISceneGridImageSource {
  src: string;
  levelId: string | null;
  levelName: string | null;
  source: "canvas-level" | "initial-level" | "first-level" | "scene-background";
}

type CandidateKey =
  | "autocorrelation"
  | "template"
  | "priorPeriod"
  | "tokenScale"
  | "tokenScaleDoubled"
  | "tokenScaleHalved";

const CANDIDATE_LABELS: Record<CandidateKey, string> = {
  autocorrelation: "Autocorrelation",
  template: "Template scan",
  priorPeriod: "Prior (DDB tokenScale + detected offset)",
  tokenScale: "DDB tokenScale (5 ft)",
  tokenScaleDoubled: "DDB tokenScale x 2 (10 ft / square)",
  tokenScaleHalved: "DDB tokenScale / 2",
};

// Map a chosen GridSource (from resolveGrid) to the matching candidate key so
// we can pre-select that radio button.
const SOURCE_TO_KEY: Partial<Record<TGridSource, CandidateKey>> = {
  "detected": "autocorrelation",
  "template": "template",
  "tokenScale-snapped": "priorPeriod",
  "tokenScale": "priorPeriod",
};

export interface ICandidateChoice {
  key: CandidateKey;
  label: string;
  entry: ICandidateEntry;
  source: TGridSource;
}

function validSrc(src: unknown): string | null {
  return typeof src === "string" && src.trim() !== "" ? src : null;
}

function levelId(level: I5eSceneLevel): string | null {
  // @ts-expect-error - because this could be an instance with derived id or just a data schema, and we don't model the type to that extent
  return validSrc(level?.id) ?? validSrc(level?._id);
}

function levelSource(level: I5eSceneLevel, source: ISceneGridImageSource["source"]): ISceneGridImageSource | null {
  const src = validSrc(level?.background?.src);
  if (!src) return null;
  return {
    src,
    levelId: levelId(level),
    levelName: validSrc(level?.name),
    source,
  };
}

function levelsArray(levels: foundry.utils.Collection<I5eSceneLevel> | I5eSceneLevel[] | null | undefined): I5eSceneLevel[] {
  if (!levels) return [];
  if (Array.isArray(levels)) return levels;
  if (Array.isArray(levels.contents)) return levels.contents;
  if (typeof levels.values === "function") return Array.from(levels.values());
  try {
    return Array.from(levels as Iterable<any>);
  } catch (_e) {
    return [];
  }
}

function getLevel(scene: Scene, id: string | null | undefined): any | null {
  if (!id || !scene.levels) return null;
  if (typeof scene.levels.get === "function") {
    const found = scene.levels.get(id);
    if (found) return found;
  }
  return levelsArray(scene.levels).find((level) => levelId(level) === id) ?? null;
}

export function resolveSceneGridImageSource(scene: Scene): ISceneGridImageSource | null {
  const canvasSceneId = canvas?.scene?.id;
  const canvasLevelId = validSrc(canvas?.level?.id) ?? validSrc(canvas?.level?._id);
  if (scene.id && canvasSceneId === scene.id && canvasLevelId) {
    const source = levelSource(getLevel(scene, canvasLevelId), "canvas-level");
    if (source) return source;
  }

  const initial = levelSource(getLevel(scene, scene.initialLevel), "initial-level");
  if (initial) return initial;

  for (const level of levelsArray(scene.levels)) {
    const source = levelSource(level, "first-level");
    if (source) return source;
  }

  const src = validSrc(scene.background?.src);
  return src
    ? { src, levelId: null, levelName: null, source: "scene-background" }
    : null;
}

function normalizeImageSource(source: IRunDetectionOptions["imageSource"], scene: Scene): ISceneGridImageSource | null {
  if (typeof source === "string") {
    const src = validSrc(source);
    return src ? { src, levelId: null, levelName: null, source: "scene-background" } : null;
  }
  if (source?.src) return source;
  return resolveSceneGridImageSource(scene);
}

function getDDBImporterFlag(scene: Scene, key: string): any {
  try {
    if (typeof scene.getFlag === "function") {
      return scene.getFlag("ddbimporter", key);
    }
  } catch (_e) { /* fall through */ }
  return scene.flags?.["ddbimporter"]?.[key];
}

export async function fetchBackgroundBlob(src: string): Promise<Blob> {
  // Scene backgrounds live under the user's data folder so plain fetch is enough.
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Could not fetch background ${src}: HTTP ${response.status}`);
  return response.blob();
}

export async function readBitmapDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(blob);
  const dims = { width: bitmap.width, height: bitmap.height };
  if (typeof bitmap.close === "function") bitmap.close();
  return dims;
}

// Crop a Blob to the given pixel rect, returning a new image Blob. Used to
// run detection on a user-selected region of interest.
async function cropBlob(blob: Blob, rect: { x: number; y: number; w: number; h: number }): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const x = Math.max(0, Math.min(bitmap.width, Math.round(rect.x)));
  const y = Math.max(0, Math.min(bitmap.height, Math.round(rect.y)));
  const w = Math.max(1, Math.min(bitmap.width - x, Math.round(rect.w)));
  const h = Math.max(1, Math.min(bitmap.height - y, Math.round(rect.h)));
  const canvas = (typeof OffscreenCanvas !== "undefined")
    ? new OffscreenCanvas(w, h)
    : Object.assign(document.createElement("canvas"), { width: w, height: h });
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("cropBlob: could not acquire 2d context");
  (ctx as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D).drawImage(
    bitmap, x, y, w, h, 0, 0, w, h,
  );
  if (typeof bitmap.close === "function") bitmap.close();
  if (canvas instanceof OffscreenCanvas) {
    return await canvas.convertToBlob({ type: "image/png" });
  }
  return await new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob((b) => b ? resolve(b) : reject(new Error("toBlob returned null")), "image/png");
  });
}

// Wrap a sub-pixel offset back into [0, gridSize). Used when running detection
// on a cropped region: detectGrid reports the first grid line within the
// crop, but downstream code expects offsets relative to the full image.
function wrapOffset(offset: number, originX: number, gridSize: number): number {
  if (!(gridSize > 0)) return offset;
  const total = originX + offset;
  const wrapped = ((total % gridSize) + gridSize) % gridSize;
  return wrapped;
}

// Wrap a value into the symmetric range (-period/2, period/2]. Used for the
// per-level texture offset so the level image shifts less than half a grid
// cell from its centered position rather than up to a full cell.
function wrapSymmetric(value: number, period: number): number {
  if (!(period > 0)) return value;
  let wrapped = ((value % period) + period) % period;
  if (wrapped > period / 2) wrapped -= period;
  return wrapped;
}

function ensureNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function fmt(n: number, digits = 0): string {
  return Number(n).toFixed(digits);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]!,
  );
}

export interface ISceneGridDetectionRun {
  detection: IGridDetectionResult | null;
  grid: IResolvedGrid;
  candidates: ICandidateSummary;
  candidateList: ICandidateChoice[];
  recommendedKey: CandidateKey | null;
  imageDimensions: { x: number; y: number };
  imageSource?: ISceneGridImageSource;
}

export interface ISceneGridApplyResult {
  applied: boolean;
  reason?: string;
  run?: ISceneGridDetectionRun;
  selectedKey?: CandidateKey;
}

function buildCandidateList(candidates: ICandidateSummary): ICandidateChoice[] {
  const order: { key: CandidateKey; source: TGridSource }[] = [
    { key: "autocorrelation", source: "detected" },
    { key: "template", source: "template" },
    { key: "priorPeriod", source: "tokenScale-snapped" },
    { key: "tokenScale", source: "tokenScale" },
    { key: "tokenScaleDoubled", source: "tokenScale" },
    { key: "tokenScaleHalved", source: "tokenScale" },
  ];
  const list: ICandidateChoice[] = [];
  for (const { key, source } of order) {
    const entry = candidates[key];
    if (!entry) continue;
    list.push({ key, label: CANDIDATE_LABELS[key], entry, source });
  }
  return list;
}

function pickRecommendedKey(grid: IResolvedGrid, list: ICandidateChoice[]): CandidateKey | null {
  // Prefer an exact (paintedSize, offset) match against the chosen grid - that's
  // the candidate resolveGrid actually used. Falls back to the source-based
  // mapping for the "default" branch and any edge cases.

  // eslint-disable-next-line no-useless-assignment
  const targetSize = grid.size * grid.sceneScale > 0 ? grid.size / (grid.sceneScale || 1) : grid.size;
  // grid.size is rounded; multiply back by sceneScale isn't quite right for
  // painted period, so match by gridSize + offset instead.
  const wantGrid = Math.max(1, Math.round(grid.size));
  const wantOffsetX = Math.round(grid.offsetX);
  const wantOffsetY = Math.round(grid.offsetY);
  const exact = list.find((c) =>
    c.entry.gridSize === wantGrid
    && c.entry.offsetX === wantOffsetX
    && c.entry.offsetY === wantOffsetY,
  );
  if (exact) return exact.key;
  const mapped = SOURCE_TO_KEY[grid.source];
  if (mapped && list.some((c) => c.key === mapped)) return mapped;
  return list.length > 0 ? list[0].key : null;
  // targetSize is unused by the exact-match path but kept here so future
  // callers wanting period-based matching have a clear hook.
  void targetSize;
}

export interface IRoi {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface IRunDetectionOptions {
  // Pixel rect in original image coords. When set, detection runs on this
  // crop only and offsets are wrapped back into the full image.
  roi?: IRoi | null;
  // Multiple disjoint pixel rects in original image coords. When set,
  // detection runs once per rect and the per-region results are merged
  // (mean for size with outlier trim, circular mean for offsets). Used by
  // the picker when the user selects non-contiguous squares.
  rois?: IRoi[] | null;
  // How many Foundry grid cells fit in each detected painted square. Used
  // when a painted "1 square" actually represents N x N Foundry cells (e.g.
  // 10 ft maps where one painted square = 2x2 5-ft cells). Defaults to the
  // global maps-double-scale setting (1 or 2). The picker exposes a 1/2/3/4
  // dropdown.
  multiplier?: number;
  // Override the detector's search padding around the tokenScale prior.
  // Default 0.5 (±50%) is fine when tokenScale matches the painted period.
  // The picker passes 3.0 so detection can find painted periods up to 4x
  // the 5-ft-cell prior - covers the case where a DDB scene's tokenScale
  // represents the 5-ft cell but the actual painted square is 2-4x larger.
  searchPaddingFraction?: number;
  // Painted cell size in original-image pixels. When set, this overrides
  // the tokenScale-derived expectedScale prior so the detector searches
  // around the supplied value instead. Used by the picker's "draw grid
  // hint" workflow - the user draws a 3 x 3 box, we compute cellPx from
  // the box, and pass it here as a precise prior with tight padding.
  expectedCellPx?: number;
  // The already-resolved image source to scan. The picker supplies this so
  // the preview image and detector image cannot diverge if the canvas level
  // changes while the app is open.
  imageSource?: ISceneGridImageSource | string | null;
}

// Run detectGrid against either the full image or a single ROI crop.
// Returns the result with offsets wrapped back to full-image space.
async function runDetectionOnRoi(
  fullBlob: Blob,
  fullDims: { width: number; height: number },
  scene: Scene,
  roi: IRoi | null,
  detectorOpts: { multiplier?: number; searchPaddingFraction?: number; expectedCellPx?: number } = {},
): Promise<IGridDetectionResult | null> {
  let detectorBlob = fullBlob;
  if (roi && roi.w > 0 && roi.h > 0) {
    try {
      detectorBlob = await cropBlob(fullBlob, roi);
    } catch (error) {
      logger.warn(`Grid detection ROI crop failed for "${scene.name}": ${(error as Error).message}`);
      detectorBlob = fullBlob;
    }
  }

  const tokenScale = getDDBImporterFlag(scene, "tokenScale");
  const multiplier = detectorOpts.multiplier ?? getMapScaleMultiplier();
  // expectedScale is "painted period / image width" used as the detector's
  // search anchor. tokenScale is computed against the full image; when we
  // run on a crop, the detector multiplies expectedScale by its own (cropped)
  // width to get an absolute pixel target. We rescale so the same painted
  // period in pixels comes out regardless of crop size.
  //
  // expectedCellPx (user-drawn grid hint) takes priority over tokenScale -
  // when the caller has measured the painted period directly we trust that
  // over DDB's stored prior. cellPx is already the painted period in image
  // pixels, so no multiplier-adjustment.
  let baseExpectedScale: number | undefined;
  if (typeof detectorOpts.expectedCellPx === "number" && detectorOpts.expectedCellPx > 0 && fullDims.width > 0) {
    baseExpectedScale = detectorOpts.expectedCellPx / fullDims.width;
  } else if (typeof tokenScale === "number" && tokenScale > 0) {
    baseExpectedScale = tokenScale * multiplier;
  }
  let expectedScale = baseExpectedScale;
  if (baseExpectedScale !== undefined && roi && roi.w > 0) {
    expectedScale = baseExpectedScale * (fullDims.width / roi.w);
    if (!(expectedScale > 0 && expectedScale < 1)) expectedScale = undefined;
  }

  if (roi && baseExpectedScale !== undefined) {
    const expectedPeriodPx = baseExpectedScale * fullDims.width;
    const minDim = Math.min(roi.w, roi.h);
    if (expectedPeriodPx > 0 && minDim / expectedPeriodPx < 3) {
      logger.warn(
        `Grid detection ROI for "${scene.name}" only spans ~${(minDim / expectedPeriodPx).toFixed(1)} grid cells; results may be unreliable.`,
      );
    }
  }

  let detection: IGridDetectionResult | null;
  try {
    const detectorOptions: any = { expectedScale };
    if (detectorOpts.searchPaddingFraction !== undefined) {
      detectorOptions.searchPaddingFraction = detectorOpts.searchPaddingFraction;
    }
    detection = await detectGrid(detectorBlob, detectorOptions);
  } catch (error) {
    logger.warn(`Grid detection failed for scene "${scene.name}": ${(error as Error).message}`);
    detection = null;
  }

  if (detection && roi) {
    const size = detection.size;
    detection.offsetX = wrapOffset(detection.offsetX, roi.x, size);
    detection.offsetY = wrapOffset(detection.offsetY, roi.y, size);
    if (typeof detection.templateOffsetX === "number" && typeof detection.templateSize === "number") {
      detection.templateOffsetX = wrapOffset(detection.templateOffsetX, roi.x, detection.templateSize);
    }
    if (typeof detection.templateOffsetY === "number" && typeof detection.templateSize === "number") {
      detection.templateOffsetY = wrapOffset(detection.templateOffsetY, roi.y, detection.templateSize);
    }
    if (typeof detection.priorOffsetX === "number" && typeof detection.priorSize === "number") {
      detection.priorOffsetX = wrapOffset(detection.priorOffsetX, roi.x, detection.priorSize);
    }
    if (typeof detection.priorOffsetY === "number" && typeof detection.priorSize === "number") {
      detection.priorOffsetY = wrapOffset(detection.priorOffsetY, roi.y, detection.priorSize);
    }
  }
  return detection;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Trimmed-mean: drop entries that diverge from the median by more than
// `tolerance` (fractional), then average the rest. Falls back to the median
// when every entry would be trimmed.
function trimmedMean(values: number[], tolerance = 0.10): number {
  if (values.length === 0) return NaN;
  if (values.length === 1) return values[0];
  const m = median(values);
  if (!(m > 0)) return values.reduce((s, v) => s + v, 0) / values.length;
  const kept = values.filter((v) => Math.abs(v - m) / m <= tolerance);
  if (kept.length === 0) return m;
  return kept.reduce((s, v) => s + v, 0) / kept.length;
}

// Mean of a set of phase values on a circle of period `period`. Each value
// becomes a unit vector, vectors are summed, and the resultant angle gives
// the consensus phase. Robust to wrap-around (e.g. offsets near 0 vs near
// `period - 1` average correctly).
function circularMean(values: number[], period: number): number {
  if (values.length === 0 || !(period > 0)) return 0;
  let sumX = 0;
  let sumY = 0;
  for (const v of values) {
    const angle = (v / period) * 2 * Math.PI;
    sumX += Math.cos(angle);
    sumY += Math.sin(angle);
  }
  const meanAngle = Math.atan2(sumY, sumX);
  let result = (meanAngle / (2 * Math.PI)) * period;
  while (result < 0) result += period;
  while (result >= period) result -= period;
  return result;
}

// Merge multiple per-ROI detection results into a single consensus result.
// Sizes are averaged with outlier trim; offsets are merged via circular
// mean against the consensus size; confidence is the max across regions.
function mergeDetections(detections: IGridDetectionResult[]): IGridDetectionResult | null {
  const valid = detections.filter((d) => d?.detected && d.size > 0);
  if (valid.length === 0) return null;
  if (valid.length === 1) return valid[0];

  const sizes = valid.map((d) => d.size);
  const size = trimmedMean(sizes, 0.10);

  const offsetX = circularMean(valid.map((d) => d.offsetX), size);
  const offsetY = circularMean(valid.map((d) => d.offsetY), size);

  // Templates may be missing on some regions; merge only the ones that have
  // them. If they all disagree wildly, the candidate UI will surface that.
  const templates = valid.filter((d) => typeof d.templateSize === "number" && d.templateSize > 0);
  const templateSize = templates.length ? trimmedMean(templates.map((d) => d.templateSize as number), 0.10) : null;
  const templateOffsetX = (templates.length && templateSize)
    ? circularMean(templates.map((d) => d.templateOffsetX as number).filter((v) => typeof v === "number"), templateSize)
    : null;
  const templateOffsetY = (templates.length && templateSize)
    ? circularMean(templates.map((d) => d.templateOffsetY as number).filter((v) => typeof v === "number"), templateSize)
    : null;

  // Prior fields propagate from the first region that has them; they're
  // tokenScale-derived so they should match across regions anyway.
  const withPrior = valid.find((d) => typeof d.priorSize === "number");
  const priorSize = withPrior?.priorSize ?? null;
  const priorOffsetX = withPrior?.priorOffsetX ?? null;
  const priorOffsetY = withPrior?.priorOffsetY ?? null;

  const confidence = Math.max(...valid.map((d) => d.confidence ?? 0));

  return {
    detected: true,
    size,
    offsetX,
    offsetY,
    confidence,
    priorSize,
    priorOffsetX,
    priorOffsetY,
    templateSize,
    templateOffsetX,
    templateOffsetY,
    templateScore: valid[0].templateScore ?? null,
    diagnostics: valid[0].diagnostics,
  };
}

// Run grid detection on a scene's resolved level/background image and return the proposed
// grid + candidate list. Does not modify the scene.
export async function runDetectionForScene(
  scene: Scene,
  options: IRunDetectionOptions = {},
): Promise<ISceneGridDetectionRun> {
  const imageSource = normalizeImageSource(options.imageSource, scene);
  const src = imageSource?.src;
  if (!src) throw new Error("Scene has no level/background image");

  const fullBlob = await fetchBackgroundBlob(src);
  const fullDims = await readBitmapDimensions(fullBlob);

  const rois = (options.rois?.length ? options.rois : null)
    ?? (options.roi ? [options.roi] : null);

  const detectorOpts = {
    multiplier: options.multiplier,
    searchPaddingFraction: options.searchPaddingFraction,
    expectedCellPx: options.expectedCellPx,
  };

  let detection: IGridDetectionResult | null;
  if (rois && rois.length > 1) {
    const perRegion = await Promise.all(
      rois.map((r) => runDetectionOnRoi(fullBlob, fullDims, scene, r, detectorOpts)),
    );
    detection = mergeDetections(perRegion.filter((d): d is IGridDetectionResult => !!d));
    if (!detection) {
      logger.warn(`Grid detection: all ${rois.length} ROIs failed for "${scene.name}", falling back to full image.`);
      detection = await runDetectionOnRoi(fullBlob, fullDims, scene, null, detectorOpts);
    }
  } else {
    detection = await runDetectionOnRoi(fullBlob, fullDims, scene, rois?.[0] ?? null, detectorOpts);
  }

  const tokenScale = getDDBImporterFlag(scene, "tokenScale");
  const multiplier = options.multiplier ?? getMapScaleMultiplier();

  const grid = resolveGrid({
    detection,
    tokenScale,
    width: fullDims.width,
    multiplier,
  });
  const candidates = buildCandidateSummary({
    detection,
    tokenScale,
    width: fullDims.width,
    multiplier,
  });
  const candidateList = buildCandidateList(candidates);
  const recommendedKey = pickRecommendedKey(grid, candidateList);

  return {
    detection,
    grid,
    candidates,
    candidateList,
    recommendedKey,
    imageDimensions: { x: fullDims.width, y: fullDims.height },
    imageSource,
  };
}

// Rebuild a detection run from a cached IGridDetectionResult without
// re-fetching the image or re-running detectGrid. Used when the user
// changes the per-detection multiplier in the picker - the painted period
// and offsets don't change, only how the resolver projects them onto the
// Foundry grid.
export function rebuildDetectionRun(
  scene: Scene,
  detection: IGridDetectionResult | null,
  imageDimensions: { x: number; y: number },
  multiplier?: number,
  imageSource?: ISceneGridImageSource,
): ISceneGridDetectionRun {
  const tokenScale = getDDBImporterFlag(scene, "tokenScale");
  const m = multiplier ?? getMapScaleMultiplier();
  const grid = resolveGrid({
    detection,
    tokenScale,
    width: imageDimensions.x,
    multiplier: m,
  });
  const candidates = buildCandidateSummary({
    detection,
    tokenScale,
    width: imageDimensions.x,
    multiplier: m,
  });
  const candidateList = buildCandidateList(candidates);
  const recommendedKey = pickRecommendedKey(grid, candidateList);
  return { detection, grid, candidates, candidateList, recommendedKey, imageDimensions, imageSource };
}

// Apply a chosen candidate (or the resolveGrid default) to a scene.
export async function applyChoiceToScene(
  scene: Scene,
  run: ISceneGridDetectionRun,
  choice: ICandidateChoice | null,
): Promise<void> {
  const { imageDimensions, detection, candidates, grid, imageSource } = run;

  let gridSize: number;
  // Raw painted offset in image pixels (NOT scaled to scene units). The level
  // branch needs this to compute the texture phase; the no-level branch scales
  // it by sceneScale to recover the document shift.
  let rawOffsetX: number;
  let rawOffsetY: number;
  let sceneScale: number;
  let gridSource: TGridSource;

  if (choice) {
    gridSize = Math.max(1, Math.round(choice.entry.gridSize));
    rawOffsetX = choice.entry.rawPaintedOffsetX;
    rawOffsetY = choice.entry.rawPaintedOffsetY;
    sceneScale = choice.entry.sceneScale;
    gridSource = choice.source;
  } else {
    gridSize = Math.max(1, Math.round(grid.size));
    // resolveGrid stores grid.offsetX = rawOffset * sceneScale; divide back out.
    rawOffsetX = grid.offsetX / (grid.sceneScale || 1);
    rawOffsetY = grid.offsetY / (grid.sceneScale || 1);
    sceneScale = grid.sceneScale;
    gridSource = grid.source;
  }

  // Recover the multiplier the caller used by comparing the candidate's
  // painted period to the rounded Foundry grid size. resolveGrid had the
  // raw multiplier available but doesn't surface it on IResolvedGrid; we
  // back-calculate so the scene flags carry it for the picker.
  let appliedMultiplier = 1;
  if (choice) {
    const ratio = choice.entry.paintedSize / Math.max(1, choice.entry.gridSize);
    const rounded = Math.round(ratio);
    if (rounded >= 1 && rounded <= 4 && Math.abs(ratio - rounded) < 0.15) appliedMultiplier = rounded;
  }

  const sharedFlags = {
    gridSize,
    gridSource,
    gridSceneScale: sceneScale,
    gridMultiplier: appliedMultiplier,
    gridChoiceKey: choice?.key ?? null,
    imageDimensions,
    gridDetection: detection ?? null,
    gridCandidates: candidates,
    gridDetectedAt: Date.now(),
  };

  const gridPayload = {
    type: ensureNumber(scene.grid?.type, 1),
    size: gridSize,
    distance: ensureNumber(scene.grid?.distance, 5),
    units: scene.grid?.units || "ft",
  };

  const levelId = imageSource?.levelId ?? null;

  if (levelId) {
    // Align the resolved level's image to the shared (document) grid via its
    // texture, leaving scene.width/height untouched. The level background is
    // rendered centered (anchor 0.5/0.5) and scaled about its center, then
    // shifted by textures.offsetX/offsetY (canvas px). See
    // client/canvas/groups/primary.mjs #drawLevelTexture.
    const texW = imageDimensions.x;
    const texH = imageDimensions.y;
    const W = ensureNumber(scene.width, texW);
    const H = ensureNumber(scene.height, texH);

    // fit:"fill" gives a base scale of sceneRect/texture; the config scale on
    // top of it must bring the painted period to sceneScale relative to the
    // native image. When W == texW (the DDB case) this is just sceneScale.
    const scaleX = sceneScale * (texW / W);
    const scaleY = sceneScale * (texH / H);

    // Phase: a painted line at image px p lands at canvas x
    //   sceneRect.center.x + offsetX + (p - texW/2) * sceneScale
    // and must be congruent to the grid origin (shiftX = 0) modulo gridSize.
    // Solving for offsetX (sceneRect.center.x contributes W/2 over the origin):
    const offsetX = wrapSymmetric(-W / 2 - (rawOffsetX - texW / 2) * sceneScale, gridSize);
    const offsetY = wrapSymmetric(-H / 2 - (rawOffsetY - texH / 2) * sceneScale, gridSize);

    await scene.update({
      shiftX: 0,
      shiftY: 0,
      grid: gridPayload,
      levels: [{
        _id: levelId,
        textures: {
          scaleX,
          scaleY,
          offsetX: Math.round(offsetX),
          offsetY: Math.round(offsetY),
        },
      }],
      flags: { "ddbimporter": { ...sharedFlags, gridLevelId: levelId } },
    } as any);
    return;
  }

  // No-level fallback (image came from scene.background): resize the document
  // canvas and write the document grid shift, as before.
  const sceneWidth = Math.max(1, Math.round(imageDimensions.x * sceneScale));
  const sceneHeight = Math.max(1, Math.round(imageDimensions.y * sceneScale));
  await scene.update({
    width: sceneWidth,
    height: sceneHeight,
    shiftX: Math.round(rawOffsetX * sceneScale),
    shiftY: Math.round(rawOffsetY * sceneScale),
    grid: gridPayload,
    flags: { "ddbimporter": sharedFlags },
  } as any);
}

function renderCandidateRow(c: ICandidateChoice, isRecommended: boolean): string {
  const label = escapeHtml(c.label);
  const recommended = isRecommended ? ` <em style="color:var(--color-text-hyperlink, #0a84ff);">(recommended)</em>` : "";
  return `
    <tr>
      <td style="padding:0.25em 0.5em;"><input type="radio" name="candidate" value="${c.key}"${isRecommended ? " checked" : ""}></td>
      <td style="padding:0.25em 0.5em;">${label}${recommended}</td>
      <td style="padding:0.25em 0.5em;text-align:right;">${c.entry.gridSize}</td>
      <td style="padding:0.25em 0.5em;text-align:right;">${c.entry.offsetX}, ${c.entry.offsetY}</td>
      <td style="padding:0.25em 0.5em;text-align:right;">${c.entry.sceneWidth}</td>
      <td style="padding:0.25em 0.5em;text-align:right;">${fmt(c.entry.sceneScale, 4)}</td>
    </tr>
  `;
}

function buildSelectionForm(run: ISceneGridDetectionRun, sceneName: string): string {
  const { detection, imageDimensions, candidateList, recommendedKey } = run;
  const conf = detection?.detected ? fmt(detection.confidence ?? 0, 3) : "n/a";

  if (candidateList.length === 0) {
    return `
      <div class="ddb-grid-detect-dialog">
        <p><strong>${escapeHtml(sceneName)}</strong></p>
        <p>No grid candidates were produced. The image may not contain a regular grid, or detection failed.</p>
      </div>
    `;
  }

  const rows = candidateList
    .map((c) => renderCandidateRow(c, c.key === recommendedKey))
    .join("");

  return `
    <div class="ddb-grid-detect-dialog">
      <p><strong>${escapeHtml(sceneName)}</strong></p>
      <p>Image: ${imageDimensions.x} x ${imageDimensions.y}px. Detector confidence: ${conf}.</p>
      <p>Pick which candidate to apply. Existing tokens, walls, and lights are not moved.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:0.5em;">
        <thead>
          <tr style="border-bottom:1px solid var(--color-border-light-tertiary, #888);">
            <th style="padding:0.25em 0.5em;"></th>
            <th style="padding:0.25em 0.5em;text-align:left;">Source</th>
            <th style="padding:0.25em 0.5em;text-align:right;">Grid</th>
            <th style="padding:0.25em 0.5em;text-align:right;">Offset</th>
            <th style="padding:0.25em 0.5em;text-align:right;">Scene W</th>
            <th style="padding:0.25em 0.5em;text-align:right;">Scale</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// Top-level entry point: detect, ask the user to pick a candidate, then apply.
export async function detectAndApplyGridToScene(scene: Scene): Promise<ISceneGridApplyResult> {
  const sceneName = scene.name ?? "scene";
  const imageSource = resolveSceneGridImageSource(scene);
  if (!imageSource) {
    ui.notifications?.warn(`"${sceneName}" has no level/background image to scan.`);
    return { applied: false, reason: "no-background" };
  }

  ui.notifications?.info(`Detecting grid for "${sceneName}"...`);
  let run: ISceneGridDetectionRun;
  try {
    run = await runDetectionForScene(scene, { imageSource });
  } catch (error) {
    const msg = (error as Error).message;
    logger.error(`Grid detection failed for "${sceneName}": ${msg}`, error);
    ui.notifications?.error(`Grid detection failed: ${msg}`);
    return { applied: false, reason: msg };
  }

  if (run.candidateList.length === 0) {
    await foundry.applications.api.DialogV2.prompt<foundry.applications.api.DialogV2.PromptConfig>({
      rejectClose: false,
      window: { title: `Detect Grid: ${sceneName}` },
      content: buildSelectionForm(run, sceneName),
      ok: { label: "Close" },
    });
    return { applied: false, reason: "no-candidates", run };
  }

  const selectedKey = await foundry.applications.api.DialogV2.wait<foundry.applications.api.DialogV2.WaitOptions>({
    rejectClose: false,
    window: { title: `Detect Grid: ${sceneName}` },
    content: buildSelectionForm(run, sceneName),
    position: { width: 600 },
    buttons: [
      {
        action: "apply",
        label: "Apply",
        icon: "fas fa-check",
        default: true,
        callback: (_event, button, _dialog) => {
          const formData = new foundry.applications.ux.FormDataExtended(button.form).object as { candidate?: string };
          return formData.candidate ?? run.recommendedKey ?? null;
        },
      },
      {
        action: "cancel",
        label: "Cancel",
        icon: "fas fa-times",
        callback: () => null,
      },
    ],
  }) as CandidateKey | null;

  if (!selectedKey) return { applied: false, reason: "cancelled", run };

  const choice = run.candidateList.find((c) => c.key === selectedKey) ?? null;
  if (!choice) {
    ui.notifications?.warn(`Selected candidate "${selectedKey}" not found.`);
    return { applied: false, reason: "selection-missing", run };
  }

  try {
    await applyChoiceToScene(scene, run, choice);
    ui.notifications?.info(
      `Grid updated on "${sceneName}" (size ${choice.entry.gridSize}px from ${choice.label}).`,
    );
    return { applied: true, run, selectedKey };
  } catch (error) {
    const msg = (error as Error).message;
    logger.error(`Failed to apply grid to "${sceneName}": ${msg}`, error);
    ui.notifications?.error(`Failed to update scene: ${msg}`);
    return { applied: false, reason: msg, run, selectedKey };
  }
}
