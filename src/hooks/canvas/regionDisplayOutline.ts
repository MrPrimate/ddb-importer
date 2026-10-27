/**
 * The outline a region's highlight actually fills. A region in "coverage" highlight mode on a
 * gridded scene (every template dnd5e places) is drawn by core as the grid spaces it covers,
 * not as its true shape, so a diagonal line shows as a staircase of squares. The display's
 * band, glow and fill mask trace this outline so they follow the squares core fills rather
 * than the rotated rectangle underneath. The world setting, or a region's own flag, can ask for
 * the true shape instead.
 */

import {
  REGION_DISPLAY_OUTLINE_FLAG_PATH,
  REGION_DISPLAY_OUTLINE_SETTING,
  REGION_DISPLAY_OUTLINES,
} from "../../config/regionDisplayProfiles";
import utils from "../../lib/Utils";

/** The grid members the coverage test reads. */
interface ICoverageGrid {
  isGridless: boolean;
  isSquare: boolean;
  sizeX: number;
  sizeY: number;
  getOffsetRange(bounds: PIXI.Rectangle): [number, number, number, number] | readonly number[];
  getCenterPoint(offset: { i: number; j: number }): { x: number; y: number };
  getVertices(offset: { i: number; j: number }): { x: number; y: number }[];
}

const outlineCache = new WeakMap<TCoreRegionPolygonTree, TCoreRegionPolygonTree>();

function coverageGrid(): { grid: ICoverageGrid; sceneRect: PIXI.Rectangle | null } | null {
  const live = (globalThis as { canvas?: { grid?: ICoverageGrid; dimensions?: { rect?: PIXI.Rectangle } } }).canvas;
  if (!live?.grid || live.grid.isGridless) return null;
  return { grid: live.grid, sceneRect: live.dimensions?.rect ?? null };
}

/** Whether core draws this region's highlight as its covered grid spaces. */
export function usesCoverageHighlight(region: TCoreRegionPlaceable): boolean {
  const mode = (region.document as unknown as { highlightMode?: string } | undefined)?.highlightMode;
  return mode === "coverage" && coverageGrid() !== null;
}

function isOutline(value: unknown): value is TRegionDisplayOutline {
  return REGION_DISPLAY_OUTLINES.includes(value as TRegionDisplayOutline);
}

/** The world's outline choice; anything but a known value (a setting not yet registered) means coverage. */
export function worldOutlineChoice(): TRegionDisplayOutline {
  const value = utils.getSetting<TRegionDisplayOutline>(REGION_DISPLAY_OUTLINE_SETTING);
  return isOutline(value) ? value : "coverage";
}

/** A region's own outline choice, or null when it follows the world setting. */
export function regionOutlineFlag(
  doc: RegionDocument.Implementation | null | undefined,
): TRegionDisplayOutline | null {
  const value = foundry.utils.getProperty(doc ?? {}, REGION_DISPLAY_OUTLINE_FLAG_PATH);
  return isOutline(value) ? value : null;
}

/** What the region's display traces: its own choice when it has one, else the world setting's. */
export function outlineChoice(region: TCoreRegionPlaceable): TRegionDisplayOutline {
  return regionOutlineFlag(region.document) ?? worldOutlineChoice();
}

/**
 * The grid spaces core's coverage highlight fills, as Region#_getCoveredGridSpaceOffsets finds
 * them: every space whose (token-rounded) centre lies within 0.75 px of the shape. Core's own
 * method fits and pads the region's bounds in place, growing them a pixel on every call, so it
 * is reproduced here on a copy instead of called.
 */
export function coveredGridOffsets(
  region: TCoreRegionPlaceable,
  grid: ICoverageGrid,
  sceneRect: PIXI.Rectangle | null,
): { i: number; j: number }[] {
  const tree = region.animationState.polygonTree;
  const source = region.animationState.bounds;
  if (!source || !tree.testPoint) return [];
  const bounds = new PIXI.Rectangle(source.x, source.y, source.width, source.height);
  if (sceneRect) bounds.fit(sceneRect);
  bounds.pad(1);
  const [i0, j0, i1, j1] = grid.getOffsetRange(bounds);
  const dx = grid.sizeX / 2;
  const dy = grid.sizeY / 2;
  const offsets: { i: number; j: number }[] = [];
  for (let i = i0; i < i1; i++) {
    for (let j = j0; j < j1; j++) {
      const offset = { i, j };
      const center = grid.getCenterPoint(offset);
      const point = { x: Math.round(center.x - dx) + dx, y: Math.round(center.y - dy) + dy };
      if (tree.testPoint(point, 0.75)) offsets.push(offset);
    }
  }
  return offsets;
}

/** Merge grid spaces into one polygon tree: the staircase outline (with any holes) they cover. */
export function unionGridSpaces(
  grid: Pick<ICoverageGrid, "getVertices">,
  offsets: readonly { i: number; j: number }[],
): TCoreRegionPolygonTree | null {
  if (typeof ClipperLib === "undefined" || offsets.length === 0) return null;
  const scale = CONST.CLIPPER_SCALING_FACTOR;
  // rounding to the Clipper grid makes neighbouring spaces share exact vertices, so hexes merge without slivers
  const paths = offsets.map((offset) =>
    grid.getVertices(offset).map(({ x, y }) => new ClipperLib.IntPoint(Math.round(x * scale), Math.round(y * scale))),
  );
  const clipper = new ClipperLib.Clipper();
  clipper.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
  const solution = new ClipperLib.PolyTree();
  clipper.Execute(
    ClipperLib.ClipType.ctUnion,
    solution,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero,
  );
  return foundry.data.PolygonTree.fromClipperPolyTree(solution) as unknown as TCoreRegionPolygonTree;
}

/**
 * The outline the region's display traces: its covered grid spaces in coverage mode on a
 * gridded scene, unless the region or the world asks for the true shape, otherwise its true
 * shape. Like core, a coverage region that covers no space falls back to its shape. Cached per
 * polygon tree, which core replaces whenever the shape moves.
 */
export function regionDisplayOutline(region: TCoreRegionPlaceable): TCoreRegionPolygonTree {
  const tree = region.animationState.polygonTree;
  if (!usesCoverageHighlight(region) || outlineChoice(region) === "shape") return tree;
  const known = outlineCache.get(tree);
  if (known) return known;
  const live = coverageGrid();
  const outline = live ? unionGridSpaces(live.grid, coveredGridOffsets(region, live.grid, live.sceneRect)) : null;
  const result = outline ?? tree;
  outlineCache.set(tree, result);
  return result;
}
