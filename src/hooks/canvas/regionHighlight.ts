import { FOUNDRY_REGION_HIGHLIGHT, REGION_HIGHLIGHT_PATTERN_IDS } from "../../config/regionHighlightProfiles";
import logger from "../../lib/Logger";
import RegionHighlightProfiles, { REGION_HIGHLIGHT_PROFILES_CHANGED } from "../../lib/RegionHighlightProfiles";
import { getCoreHighlightShaderClass, getDDBHighlightShaderClass } from "./DDBHighlightRegionShader";

/**
 * Region highlight rendering for regions that carry a `flags.ddbimporter.highlight` choice.
 *
 * Foundry draws every region highlight through a private `RegionMesh` at alpha 0.5 with a
 * diagonal hatch (client/canvas/placeables/region.mjs `_draw` and `_refreshState`). The mesh
 * itself is public: it lives in the region layer's `_highlights` container, names its region,
 * and can swap its shader class. `drawRegion` fires after `_draw` and `refreshRegion` after
 * `_refreshState`, so a hook can override alpha, tint and shader uniforms right after core
 * sets them, and nothing needs wrapping or replacing. Regions without the flag are never
 * touched, and a region that loses its flag gets the core shader and alpha back.
 */

const LOG = "RegionHighlight |";

interface IHighlightState {
  /** The DDB shader is installed on the mesh. */
  styled: boolean;
  /** The edge band graphic, when the style uses the edge pattern. */
  band: PIXI.Graphics | null;
}

const states = new WeakMap<TCoreRegionPlaceable, IHighlightState>();

/** Canvas facts the style needs, separated so applyStyle can be exercised without a canvas. */
interface IHighlightCanvasMetrics {
  /** Grid square size in pixels. */
  grid: number;
  /** canvas.dimensions.uiScale, which core folds into the hatch thickness. */
  uiScale: number;
}

function canvasMetrics(): IHighlightCanvasMetrics {
  const dimensions = (canvas as unknown as { dimensions?: { size?: number; uiScale?: number } }).dimensions;
  return {
    grid: dimensions?.size ?? 100,
    uiScale: dimensions?.uiScale ?? 1,
  };
}

function regionLayer(): TCoreRegionLayer | null {
  return (canvas as unknown as { regions?: TCoreRegionLayer }).regions ?? null;
}

export function highlightFlag(
  doc: RegionDocument.Implementation | RegionDocument.CreateData | null | undefined,
): IRegionHighlightFlag | undefined {
  const flag = foundry.utils.getProperty(doc ?? {}, "flags.ddbimporter.highlight") as IRegionHighlightFlag | undefined;
  return flag && typeof flag === "object" ? flag : undefined;
}

/** The style a region document asks for, or null for the Foundry look. */
export function resolveHighlightStyle(
  doc: RegionDocument.Implementation | null | undefined,
): IRegionHighlightStyle | null {
  return RegionHighlightProfiles.resolve(highlightFlag(doc));
}

/** The highlight mesh of a region: core keeps it private, but it sits in the layer's highlight container. */
export function findHighlightMesh(
  region: TCoreRegionPlaceable,
  layer: TCoreRegionLayer | null = regionLayer(),
): TCoreRegionMesh | null {
  const children = (layer?._highlights?.children ?? []) as unknown as Partial<TCoreRegionMesh>[];
  return (children.find((child) => child.region === region) as TCoreRegionMesh | undefined) ?? null;
}

/** The style's colour, or the region's own, as the numeric PIXI tint the mesh and band want. */
export function tintFor(color: string | null | undefined, fallback: number | string): number | string {
  const candidate = color || fallback;
  if (typeof candidate === "number") return candidate;
  const parsed = Number(foundry.utils.Color.from(candidate));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function coreHatchThickness(metrics: IHighlightCanvasMetrics): number {
  return 4 * metrics.uiScale;
}

/**
 * Write a resolved style onto a mesh: alpha, tint and the pattern uniforms. Core's
 * `hatchEnabled` uniform is left alone; the shader reads it as "not being edited".
 */
export function applyStyle(
  mesh: TCoreRegionMesh,
  style: IRegionHighlightStyle,
  regionColor: number | string,
  metrics: IHighlightCanvasMetrics,
): void {
  const edge = style.pattern === "edge";
  // an edge band supplies the look; the fill only faintly reads so the interior stays legible
  mesh.alpha = edge ? style.opacity * 0.15 : style.opacity;
  mesh.tint = tintFor(style.color, regionColor);
  const uniforms = mesh.shader.uniforms;
  uniforms.pattern = REGION_HIGHLIGHT_PATTERN_IDS[style.pattern];
  uniforms.period = Math.max(1, style.spacing * metrics.grid);
  uniforms.thickness = style.thickness;
  uniforms.dashed = style.dashed;
  // one dash plus one equal gap
  uniforms.dashPeriod = Math.max(1, style.dashLength * metrics.grid * 2);
  uniforms.angle = (style.angle * Math.PI) / 180;
  uniforms.hatchThickness = coreHatchThickness(metrics);
}

/** Shader replacement resets uniforms; keep the interaction state core computed before our hook. */
function setHighlightShaderClass(mesh: TCoreRegionMesh, shaderClass: TCoreShaderClass): void {
  const hatchEnabled = mesh.shader.uniforms.hatchEnabled;
  mesh.setShaderClass(shaderClass);
  mesh.shader.uniforms.hatchEnabled = hatchEnabled;
}

/** Put the core shader, alpha and tint back on a mesh the DDB shader had been installed on. */
export function restoreCoreStyle(
  mesh: TCoreRegionMesh,
  regionColor: number | string,
  metrics: IHighlightCanvasMetrics,
): void {
  const Core = getCoreHighlightShaderClass();
  if (Core) setHighlightShaderClass(mesh, Core);
  mesh.shader.uniforms.hatchThickness = coreHatchThickness(metrics);
  mesh.alpha = FOUNDRY_REGION_HIGHLIGHT.opacity;
  mesh.tint = tintFor(null, regionColor);
}

/** The inner band a style asks for, in grid squares: the edge pattern's, a border's, or none. */
export function bandWidth(style: IRegionHighlightStyle | null): number {
  if (!style) return 0;
  if (style.pattern === "edge") return style.edgeWidth;
  return style.border ? style.borderWidth : 0;
}

/** Draw (or clear) the edge band or border for a region as a stroked graphic beside the mesh. */
export function drawEdgeBand(
  region: TCoreRegionPlaceable,
  mesh: TCoreRegionMesh,
  style: IRegionHighlightStyle | null,
  state: IHighlightState,
  metrics: IHighlightCanvasMetrics,
  layer: TCoreRegionLayer | null = regionLayer(),
): void {
  const width = bandWidth(style);
  if (!style || width <= 0) {
    if (state.band) {
      state.band.destroy();
      state.band = null;
    }
    return;
  }
  const container = layer?._highlights;
  if (!container) return;
  if (!state.band) {
    state.band = new PIXI.Graphics();
    state.band.eventMode = "none";
    container.addChild(state.band);
  }
  const band = state.band;
  band.clear();
  // alignment 0 keeps the stroke inside the shape, so the band never spills past the region
  band.lineStyle({
    width: Math.max(1, width * metrics.grid),
    color: tintFor(style.color, region.document.color as unknown as string | number) as number,
    alpha: 1,
    alignment: 0,
  });
  region.animationState.polygonTree.drawShape(band);
  band.alpha = style.opacity;
  band.zIndex = mesh.zIndex;
  band.visible = mesh.visible;
}

/** Style a drawn region from its document, or restore the core look when it has no choice. */
export function syncRegionHighlight(
  region: TCoreRegionPlaceable,
  { geometry = false }: { geometry?: boolean } = {},
): void {
  if (region.destroyed) return;
  const mesh = findHighlightMesh(region);
  if (!mesh) return;
  const style = resolveHighlightStyle(region.document);
  const metrics = canvasMetrics();
  const regionColor = region.document.color as unknown as string | number;
  let state = states.get(region);
  if (!style) {
    if (state?.styled) {
      restoreCoreStyle(mesh, regionColor, metrics);
      drawEdgeBand(region, mesh, null, state, metrics);
      states.delete(region);
    }
    return;
  }
  if (!state) {
    state = { styled: false, band: null };
    states.set(region, state);
  }
  if (!state.styled) {
    const Shader = getDDBHighlightShaderClass();
    if (!Shader) return;
    setHighlightShaderClass(mesh, Shader);
    state.styled = true;
  }
  applyStyle(mesh, style, regionColor, metrics);
  if (geometry || bandWidth(style) > 0 || state.band) drawEdgeBand(region, mesh, style, state, metrics);
}

export function onDrawRegion(region: TCoreRegionPlaceable): void {
  // a redraw builds a fresh mesh, so any earlier state is stale
  const state = states.get(region);
  if (state?.band) {
    state.band.destroy();
    state.band = null;
  }
  states.delete(region);
  syncRegionHighlight(region, { geometry: true });
}

export function onRefreshRegion(region: TCoreRegionPlaceable, flags: Record<string, boolean> = {}): void {
  if (flags.refreshState || flags.refreshGeometry || flags.refreshShapes) {
    syncRegionHighlight(region, { geometry: Boolean(flags.refreshGeometry || flags.refreshShapes) });
    return;
  }
  const band = states.get(region)?.band;
  if (band && flags.refreshVisibility) band.visible = region.visible;
}

export function onDestroyRegion(region: TCoreRegionPlaceable): void {
  const state = states.get(region);
  if (state?.band) state.band.destroy();
  states.delete(region);
}

/** Re-style every region on the canvas, after a profile edit or a flag change. */
export function refreshAllRegionHighlights(): void {
  const layer = regionLayer();
  if (!layer) return;
  for (const region of layer.placeables) {
    region.renderFlags.set({ refreshState: true, refreshGeometry: true });
  }
}

export function onUpdateRegion(_doc: unknown, changed: Record<string, unknown>): void {
  if (
    foundry.utils.hasProperty(changed, "flags.ddbimporter.highlight") ||
    foundry.utils.hasProperty(changed, "flags.ddbimporter.-=highlight")
  ) {
    refreshAllRegionHighlights();
  }
}

/** Register the canvas hooks. Safe on every client; each handler ignores unflagged regions. */
export function registerRegionHighlightHooks(): void {
  Hooks.on<"drawRegion">("drawRegion", (region) => onDrawRegion(region as unknown as TCoreRegionPlaceable));
  Hooks.on<"refreshRegion">("refreshRegion", (region, flags) =>
    onRefreshRegion(region as unknown as TCoreRegionPlaceable, flags as Record<string, boolean>),
  );
  Hooks.on<"destroyRegion">("destroyRegion", (region) => onDestroyRegion(region as unknown as TCoreRegionPlaceable));
  Hooks.on<"updateRegion">("updateRegion", (doc, changed) => onUpdateRegion(doc, changed as Record<string, unknown>));
  Hooks.on<typeof REGION_HIGHLIGHT_PROFILES_CHANGED>(REGION_HIGHLIGHT_PROFILES_CHANGED, () =>
    refreshAllRegionHighlights(),
  );
  logger.debug(
    `${LOG} hooks registered (drawRegion, refreshRegion, destroyRegion, updateRegion, ${REGION_HIGHLIGHT_PROFILES_CHANGED})`,
  );
}
