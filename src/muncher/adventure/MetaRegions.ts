// Converts Perfect Vision darkness areas (drawings carrying flags.perfect-vision) into core
// adjustDarknessLevel regions, and decides which meta drawings Foundry 14 would reject.

export const META_REGION_SOURCE = "meta-data";

// adjustDarknessLevel MODES.OVERRIDE (client/data/region-behaviors/adjust-darkness-level.mjs).
const DARKNESS_MODE_OVERRIDE = 0;

// CONST.DRAWING_FILL_TYPES.NONE
const DRAWING_FILL_NONE = 0;

/**
 * Foundry 14's DrawingDocument joint validation (BaseDrawing._validateVisibleContent): a drawing must
 * have a non-degenerate shape and visible text, fill or line, or the whole create call rejects it.
 * Mirrored here so meta drawings can be filtered before create.
 */
export function drawingHasVisibleContent(drawing: any): boolean {
  const shape = drawing?.shape ?? {};
  const strokeWidth = drawing.strokeWidth ?? 8;
  let isEmpty = false;
  switch (shape.type) {
    case "r":
    case "e": isEmpty = (shape.width <= strokeWidth) || (shape.height <= strokeWidth); break;
    case "p": isEmpty = ((shape.width === 0) && (shape.height === 0)) || ((shape.points?.length ?? 0) < 4); break;
    case "c": isEmpty = (shape.radius <= (strokeWidth / 2)); break;
    // no default
  }
  if (isEmpty) return false;
  const hasText = (drawing.text ?? "") !== "" && (drawing.textAlpha ?? 1) > 0;
  const hasFill = (drawing.fillType ?? DRAWING_FILL_NONE) !== DRAWING_FILL_NONE && (drawing.fillAlpha ?? 0.5) > 0;
  const hasLine = strokeWidth > 0 && (drawing.strokeAlpha ?? 1) > 0;
  return hasText || hasFill || hasLine;
}

/** A Perfect Vision lighting area that sets its own darkness level. */
export function isPerfectVisionDarknessArea(drawing: any): boolean {
  const pv = drawing?.flags?.["perfect-vision"];
  return !!pv?.active && Number.isFinite(pv.darkness);
}

function rotatePoint(x: number, y: number, cx: number, cy: number, radians: number): [number, number] {
  if (!radians) return [x, y];
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = x - cx;
  const dy = y - cy;
  return [cx + (dx * cos) - (dy * sin), cy + (dx * sin) + (dy * cos)];
}

/**
 * Convert a Perfect Vision darkness drawing to a core region. Perfect Vision set the area's darkness level
 * to `darkness` outright (scripts/core/lighting-system.js), which is adjustDarknessLevel's OVERRIDE mode.
 * Drawing points are relative to the drawing's x/y and rotate about its centre; region shapes are
 * absolute, so rotated rectangles become polygons. Returns null for a shape it cannot place.
 */
export function perfectVisionDrawingToRegion(drawing: any, levelIds: string[]): any | null {
  if (!isPerfectVisionDarknessArea(drawing)) return null;
  const shape = drawing.shape ?? {};
  const x = Number(drawing.x ?? 0);
  const y = Number(drawing.y ?? 0);
  const width = Number(shape.width ?? 0);
  const height = Number(shape.height ?? 0);
  const cx = x + (width / 2);
  const cy = y + (height / 2);
  const radians = (Number(drawing.rotation ?? 0) * Math.PI) / 180;

  let regionShape: any = null;
  if (shape.type === "p" && Array.isArray(shape.points) && shape.points.length >= 6) {
    const points: number[] = [];
    for (let i = 0; i < shape.points.length - 1; i += 2) {
      points.push(...rotatePoint(x + shape.points[i], y + shape.points[i + 1], cx, cy, radians));
    }
    regionShape = { type: "polygon", points, hole: false };
  } else if (shape.type === "r" && width > 0 && height > 0) {
    if (radians) {
      const corners = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
      regionShape = {
        type: "polygon",
        points: corners.flatMap(([px, py]) => rotatePoint(px, py, cx, cy, radians)),
        hole: false,
      };
    } else {
      regionShape = { type: "rectangle", x, y, width, height, rotation: 0, hole: false };
    }
  } else if (shape.type === "e" && width > 0 && height > 0) {
    regionShape = {
      type: "ellipse", x: cx, y: cy, radiusX: width / 2, radiusY: height / 2,
      rotation: Number(drawing.rotation ?? 0), hole: false,
    };
  }
  if (!regionShape) return null;

  const darkness = Math.min(1, Math.max(0, Number(drawing.flags["perfect-vision"].darkness)));
  return {
    name: `Darkness ${darkness}`,
    color: "#000000",
    shapes: [regionShape],
    levels: levelIds,
    elevation: { bottom: null, top: null },
    visibility: 0,
    behaviors: [{
      name: "Adjust Darkness Level",
      type: "adjustDarknessLevel",
      system: { mode: DARKNESS_MODE_OVERRIDE, modifier: darkness },
      disabled: false,
    }],
    flags: { ddbimporter: { source: META_REGION_SOURCE, convertedFrom: "perfect-vision" } },
  };
}
