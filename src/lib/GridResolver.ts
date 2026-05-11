import utils from "./Utils";
import { IGridDetectionResult } from "./GridDetector";

export type GridSource =
  | "detected"
  | "template"
  | "tokenScale-snapped"
  | "tokenScale"
  | "default";

export interface IResolvedGrid {
  size: number;
  offsetX: number;
  offsetY: number;
  sceneScale: number;
  source: GridSource;
}

export interface IGridResolverInput {
  detection: IGridDetectionResult | null;
  tokenScale?: number | null;
  width: number;
  multiplier: number;
  // When set, the resolver clamps the Foundry grid.size to at least this
  // many pixels by scaling sceneScale up. Used to keep scenes playable when
  // the detected painted period is so small the default cell would be too
  // tiny to interact with (e.g. low-resolution DDB exports).
  minGridSize?: number;
}

export interface ICandidateEntry {
  paintedSize: number;
  gridSize: number;
  sceneScale: number;
  sceneWidth: number;
  offsetX: number;
  offsetY: number;
  rawPaintedOffsetX: number;
  rawPaintedOffsetY: number;
}

export interface ICandidateSummary {
  autocorrelation: ICandidateEntry | null;
  template: ICandidateEntry | null;
  priorPeriod: ICandidateEntry | null;
  tokenScale: ICandidateEntry | null;
  tokenScaleDoubled: ICandidateEntry | null;
  tokenScaleHalved: ICandidateEntry | null;
  multiplier: number;
}

export function isGridDetectionEnabled(): boolean {
  try {
    const v = utils.getSetting<boolean>("munching-policy-maps-detect-grid");
    return typeof v === "boolean" ? v : true;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return true;
  }
}

export function getMapScaleMultiplier(): number {
  // When "double-scale" is on, the painted square represents 10 ft. The
  // multiplier is applied to tokenScale (which is per-5-ft) when seeding the
  // detector and is divided out again when we set the Foundry grid.size, so
  // each painted square ends up as 2x2 Foundry cells.
  try {
    const v = utils.getSetting<boolean>("munching-policy-maps-double-scale");
    return v ? 2 : 1;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return 1;
  }
}

export function getMinGridSize(): number {
  try {
    const v = utils.getSetting<number>("munching-policy-maps-min-grid-size");
    if (typeof v === "number" && v > 0 && Number.isFinite(v)) return Math.round(v);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) { /* fall through */ }
  return 50;
}

function priorFromTokenScale(tokenScale: number | null | undefined, width: number): number | null {
  if (typeof tokenScale !== "number" || !(tokenScale > 0) || tokenScale >= 1) return null;
  return width * tokenScale;
}

// Project a painted period (in image pixels) onto a Foundry grid.size +
// sceneScale pair. When the natural cell size (paintedSize / multiplier)
// falls below `minGridSize`, the cell is clamped to `minGridSize` and
// sceneScale increases proportionally - effectively scaling the scene up
// so small painted periods still produce playable grids.
function projectGrid(
  paintedSize: number,
  multiplier: number,
  minGridSize: number,
): { gridSize: number; sceneScale: number } {
  let gridSize = Math.max(1, Math.round(paintedSize / multiplier));
  if (Number.isFinite(minGridSize) && minGridSize > 0 && gridSize < minGridSize) {
    gridSize = Math.round(minGridSize);
  }
  const sceneScale = (gridSize * multiplier) / paintedSize;
  return { gridSize, sceneScale };
}

export function resolveGrid(input: IGridResolverInput): IResolvedGrid {
  const { detection, tokenScale, width, multiplier } = input;
  const priorSize = priorFromTokenScale(tokenScale ?? null, width);
  const minGridSize = typeof input.minGridSize === "number" && input.minGridSize > 0
    ? input.minGridSize
    : getMinGridSize();

  if (detection?.detected && detection.size >= 30 && detection.size <= 600) {
    let chosenSize = detection.size;
    let chosenOffsetX = detection.offsetX;
    let chosenOffsetY = detection.offsetY;
    let source: GridSource = "detected";

    const tSize = detection.templateSize;
    const tOffsetX = detection.templateOffsetX;
    const tOffsetY = detection.templateOffsetY;
    const validTemplate = typeof tSize === "number" && tSize >= 30 && tSize <= 600
      && typeof tOffsetX === "number" && typeof tOffsetY === "number";

    // Template-prior consensus: template and prior agree on the period (within
    // 10%) and autocorrelation is the outlier (>5% off both). Prefer template.
    if (validTemplate && priorSize !== null) {
      const tPriorDev = Math.abs((tSize as number) - priorSize) / priorSize;
      const aPriorDev = Math.abs(detection.size - priorSize) / priorSize;
      const aTemplateDev = Math.abs(detection.size - (tSize as number)) / (tSize as number);
      if (tPriorDev <= 0.10 && aPriorDev > 0.05 && aTemplateDev > 0.05) {
        chosenSize = tSize as number;
        chosenOffsetX = tOffsetX as number;
        chosenOffsetY = tOffsetY as number;
        source = "template";
      }
    }

    if (source === "detected" && validTemplate && detection.confidence < 0.40) {
      const tDev = Math.abs((tSize as number) - detection.size) / detection.size;
      const tPriorOk = priorSize === null || Math.abs((tSize as number) - priorSize) / priorSize <= 0.15;
      if (tDev > 0.01 && tPriorOk) {
        chosenSize = tSize as number;
        chosenOffsetX = tOffsetX as number;
        chosenOffsetY = tOffsetY as number;
        source = "template";
      }
    }

    // Phase consensus: when autocorrelation and template agree on period
    // (sizes within ~3%) but their offsets differ by more than a small
    // fraction of a cell, prefer template. Autocorrelation reports the
    // peak location, which can phase-lock to a sub-period harmonic and
    // produce an offset that is off by a fraction of a cell; template
    // matching locks onto actual painted lines so its offset is more
    // reliable when both methods agree on the period.
    if (source === "detected" && validTemplate) {
      const sizeDev = Math.abs(detection.size - (tSize as number)) / (tSize as number);
      const offsetDiffX = Math.abs(detection.offsetX - (tOffsetX as number));
      const offsetDiffY = Math.abs(detection.offsetY - (tOffsetY as number));
      const offsetThreshold = Math.max(4, detection.size * 0.05);
      if (sizeDev <= 0.03 && (offsetDiffX > offsetThreshold || offsetDiffY > offsetThreshold)) {
        chosenSize = tSize as number;
        chosenOffsetX = tOffsetX as number;
        chosenOffsetY = tOffsetY as number;
        source = "template";
      }
    }

    if (source === "detected"
      && priorSize !== null
      && detection.confidence >= 0.30
      && detection.priorOffsetX !== null && detection.priorOffsetX !== undefined
      && detection.priorOffsetY !== null && detection.priorOffsetY !== undefined) {
      const dev = Math.abs(detection.size - priorSize) / priorSize;
      if (dev <= 0.03) {
        const offsetDiffX = Math.abs(detection.priorOffsetX - detection.offsetX);
        const offsetDiffY = Math.abs(detection.priorOffsetY - detection.offsetY);
        const tolerance = Math.max(5, priorSize * 0.10);
        if (offsetDiffX <= tolerance && offsetDiffY <= tolerance) {
          chosenSize = priorSize;
          chosenOffsetX = detection.priorOffsetX;
          chosenOffsetY = detection.priorOffsetY;
          source = "tokenScale-snapped";
        }
      }
    }

    const { gridSize, sceneScale } = projectGrid(chosenSize, multiplier, minGridSize);
    return {
      size: gridSize,
      offsetX: chosenOffsetX * sceneScale,
      offsetY: chosenOffsetY * sceneScale,
      sceneScale,
      source,
    };
  }

  const expectedPainted = priorSize !== null ? priorSize * multiplier : null;
  if (
    detection
    && typeof detection.templateSize === "number"
    && detection.templateSize >= 30 && detection.templateSize <= 600
    && typeof detection.templateOffsetX === "number"
    && typeof detection.templateOffsetY === "number"
    && expectedPainted !== null
  ) {
    const tDev = Math.abs(detection.templateSize - expectedPainted) / expectedPainted;
    if (tDev <= 0.15) {
      const { gridSize, sceneScale } = projectGrid(detection.templateSize, multiplier, minGridSize);
      return {
        size: gridSize,
        offsetX: detection.templateOffsetX * sceneScale,
        offsetY: detection.templateOffsetY * sceneScale,
        sceneScale,
        source: "template",
      };
    }
  }

  if (priorSize !== null && priorSize >= 30 && priorSize <= 400) {
    const offsetX = detection?.priorOffsetX ?? 0;
    const offsetY = detection?.priorOffsetY ?? 0;
    // The "tokenScale" branch treats priorSize as both the painted period
    // and the target grid (multiplier=1 by construction); reuse projectGrid
    // so the min-grid clamp still applies.
    const { gridSize, sceneScale } = projectGrid(priorSize, 1, minGridSize);
    return {
      size: gridSize,
      offsetX: offsetX * sceneScale,
      offsetY: offsetY * sceneScale,
      sceneScale,
      source: "tokenScale",
    };
  }

  // Default fallback: 100px cells, scene at 1:1 - still clamp to the
  // configured minimum just in case the user has bumped it above 100.
  const fallbackGrid = Math.max(100, minGridSize);
  return {
    size: fallbackGrid,
    offsetX: 0,
    offsetY: 0,
    sceneScale: fallbackGrid / 100,
    source: "default",
  };
}

export function buildCandidateSummary(input: IGridResolverInput): ICandidateSummary {
  const { detection, tokenScale, width, multiplier } = input;
  const priorSize = priorFromTokenScale(tokenScale ?? null, width);
  const minGridSize = typeof input.minGridSize === "number" && input.minGridSize > 0
    ? input.minGridSize
    : getMinGridSize();

  const summarise = (
    paintedSize: number | null | undefined,
    offsetX: number | null | undefined,
    offsetY: number | null | undefined,
  ): ICandidateEntry | null => {
    if (typeof paintedSize !== "number" || paintedSize <= 0) return null;
    const ox = typeof offsetX === "number" ? offsetX : 0;
    const oy = typeof offsetY === "number" ? offsetY : 0;
    const { gridSize, sceneScale } = projectGrid(paintedSize, multiplier, minGridSize);
    return {
      paintedSize,
      gridSize,
      sceneScale: Number(sceneScale.toFixed(6)),
      sceneWidth: Math.round(width * sceneScale),
      offsetX: Math.round(ox * sceneScale),
      offsetY: Math.round(oy * sceneScale),
      rawPaintedOffsetX: Number(ox.toFixed(3)),
      rawPaintedOffsetY: Number(oy.toFixed(3)),
    };
  };

  return {
    autocorrelation: detection
      ? summarise(detection.size, detection.offsetX, detection.offsetY)
      : null,
    template: detection && typeof detection.templateSize === "number"
      ? summarise(detection.templateSize, detection.templateOffsetX, detection.templateOffsetY)
      : null,
    priorPeriod: detection && typeof detection.priorSize === "number"
      ? summarise(detection.priorSize, detection.priorOffsetX, detection.priorOffsetY)
      : null,
    tokenScale: priorSize !== null
      ? summarise(priorSize * multiplier, 0, 0)
      : null,
    tokenScaleDoubled: priorSize !== null
      ? summarise(priorSize * 2, 0, 0)
      : null,
    tokenScaleHalved: priorSize !== null && priorSize / 2 >= 20
      ? summarise(priorSize / 2, 0, 0)
      : null,
    multiplier,
  };
}
