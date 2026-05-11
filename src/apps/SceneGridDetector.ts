import {
  logger,
  detectGrid,
  IGridDetectionResult,
  buildCandidateSummary,
  getMapScaleMultiplier,
  resolveGrid,
  IResolvedGrid,
  ICandidateEntry,
  ICandidateSummary,
  GridSource,
} from "../lib/_module";

interface ISceneLike {
  id?: string;
  name?: string;
  background?: { src?: string | null; offsetX?: number; offsetY?: number };
  width?: number;
  height?: number;
  grid?: { size?: number; type?: number; distance?: number; units?: string };
  flags?: Record<string, any>;
  toObject?: () => any;
  getFlag?: (scope: string, key: string) => any;
  update: (data: any) => Promise<any>;
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
const SOURCE_TO_KEY: Partial<Record<GridSource, CandidateKey>> = {
  "detected": "autocorrelation",
  "template": "template",
  "tokenScale-snapped": "priorPeriod",
  "tokenScale": "priorPeriod",
};

export interface ICandidateChoice {
  key: CandidateKey;
  label: string;
  entry: ICandidateEntry;
  source: GridSource;
}

function getDDBImporterFlag(scene: ISceneLike, key: string): any {
  try {
    if (typeof scene.getFlag === "function") {
      return scene.getFlag("ddb-importer", key);
    }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) { /* fall through */ }
  return scene.flags?.["ddb-importer"]?.[key];
}

async function fetchBackgroundBlob(src: string): Promise<Blob> {
  // Scene backgrounds live under the user's data folder so plain fetch is enough.
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Could not fetch background ${src}: HTTP ${response.status}`);
  return response.blob();
}

async function readBitmapDimensions(blob: Blob): Promise<{ width: number; height: number }> {
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
}

export interface ISceneGridApplyResult {
  applied: boolean;
  reason?: string;
  run?: ISceneGridDetectionRun;
  selectedKey?: CandidateKey;
}

function buildCandidateList(candidates: ICandidateSummary): ICandidateChoice[] {
  const order: { key: CandidateKey; source: GridSource }[] = [
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
}

// Run detectGrid against either the full image or a single ROI crop.
// Returns the result with offsets wrapped back to full-image space.
async function runDetectionOnRoi(
  fullBlob: Blob,
  fullDims: { width: number; height: number },
  scene: ISceneLike,
  roi: IRoi | null,
  detectorOpts: { multiplier?: number; searchPaddingFraction?: number } = {},
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
  const baseExpectedScale = (typeof tokenScale === "number" && tokenScale > 0)
    ? tokenScale * multiplier
    : undefined;
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

  let detection: IGridDetectionResult | null = null;
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

// Run grid detection on a scene's background image and return the proposed
// grid + candidate list. Does not modify the scene.
export async function runDetectionForScene(
  scene: ISceneLike,
  options: IRunDetectionOptions = {},
): Promise<ISceneGridDetectionRun> {
  const src = scene.background?.src;
  if (!src) throw new Error("Scene has no background image");

  const fullBlob = await fetchBackgroundBlob(src);
  const fullDims = await readBitmapDimensions(fullBlob);

  const rois = (options.rois?.length ? options.rois : null)
    ?? (options.roi ? [options.roi] : null);

  const detectorOpts = {
    multiplier: options.multiplier,
    searchPaddingFraction: options.searchPaddingFraction,
  };

  let detection: IGridDetectionResult | null = null;
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
  };
}

// Rebuild a detection run from a cached IGridDetectionResult without
// re-fetching the image or re-running detectGrid. Used when the user
// changes the per-detection multiplier in the picker - the painted period
// and offsets don't change, only how the resolver projects them onto the
// Foundry grid.
export function rebuildDetectionRun(
  scene: ISceneLike,
  detection: IGridDetectionResult | null,
  imageDimensions: { x: number; y: number },
  multiplier?: number,
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
  return { detection, grid, candidates, candidateList, recommendedKey, imageDimensions };
}

// Apply a chosen candidate (or the resolveGrid default) to a scene.
export async function applyChoiceToScene(
  scene: ISceneLike,
  run: ISceneGridDetectionRun,
  choice: ICandidateChoice | null,
): Promise<void> {
  const { imageDimensions, detection, candidates, grid } = run;

  let gridSize: number;
  let offsetX: number;
  let offsetY: number;
  let sceneScale: number;
  let gridSource: GridSource;

  if (choice) {
    gridSize = Math.max(1, Math.round(choice.entry.gridSize));
    offsetX = Math.round(choice.entry.offsetX);
    offsetY = Math.round(choice.entry.offsetY);
    sceneScale = choice.entry.sceneScale;
    gridSource = choice.source;
  } else {
    gridSize = Math.max(1, Math.round(grid.size));
    offsetX = Math.round(grid.offsetX);
    offsetY = Math.round(grid.offsetY);
    sceneScale = grid.sceneScale;
    gridSource = grid.source;
  }

  const sceneWidth = Math.max(1, Math.round(imageDimensions.x * sceneScale));
  const sceneHeight = Math.max(1, Math.round(imageDimensions.y * sceneScale));

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

  await scene.update({
    width: sceneWidth,
    height: sceneHeight,
    background: {
      src: scene.background?.src,
      offsetX,
      offsetY,
    },
    grid: {
      type: ensureNumber(scene.grid?.type, 1),
      size: gridSize,
      distance: ensureNumber(scene.grid?.distance, 5),
      units: scene.grid?.units || "ft",
    },
    flags: {
      "ddb-importer": {
        gridSize,
        gridSource,
        gridSceneScale: sceneScale,
        gridMultiplier: appliedMultiplier,
        gridChoiceKey: choice?.key ?? null,
        imageDimensions,
        gridDetection: detection ?? null,
        gridCandidates: candidates,
        gridDetectedAt: Date.now(),
      },
    },
  });
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
export async function detectAndApplyGridToScene(scene: ISceneLike): Promise<ISceneGridApplyResult> {
  const sceneName = scene.name ?? "scene";
  if (!scene.background?.src) {
    ui.notifications?.warn(`"${sceneName}" has no background image to scan.`);
    return { applied: false, reason: "no-background" };
  }

  ui.notifications?.info(`Detecting grid for "${sceneName}"...`);
  let run: ISceneGridDetectionRun;
  try {
    run = await runDetectionForScene(scene);
  } catch (error) {
    const msg = (error as Error).message;
    logger.error(`Grid detection failed for "${sceneName}": ${msg}`, error);
    ui.notifications?.error(`Grid detection failed: ${msg}`);
    return { applied: false, reason: msg };
  }

  if (run.candidateList.length === 0) {
    await foundry.applications.api.DialogV2.prompt({
      rejectClose: false,
      window: { title: `Detect Grid: ${sceneName}` },
      content: buildSelectionForm(run, sceneName),
      ok: { label: "Close" },
    });
    return { applied: false, reason: "no-candidates", run };
  }

  const selectedKey = await foundry.applications.api.DialogV2.wait({
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
          const formData = new FormDataExtended(button.form).object as { candidate?: string };
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
