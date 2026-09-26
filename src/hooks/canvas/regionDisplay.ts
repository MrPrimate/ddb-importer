import {
  isImagePattern,
  REGION_DISPLAY_DEFAULTS,
  REGION_DISPLAY_FLAG_PATH,
  REGION_DISPLAY_LOG,
  REGION_DISPLAY_PATTERN_IDS,
  REGION_DISPLAY_PROFILES_CHANGED,
} from "../../config/regionDisplayProfiles";
import logger from "../../lib/Logger";
import RegionDisplayProfiles from "../../lib/RegionDisplayProfiles";
import { getCoreHighlightShaderClass, getDDBDisplayShaderClass } from "./DDBRegionDisplayShader";
import { loadDisplayTexture } from "./regionDisplayTexture";

/**
 * Region display rendering for regions that carry a `flags.ddbimporter.display` choice.
 *
 * Foundry draws every region highlight through a private `RegionMesh` at alpha 0.5 with a
 * diagonal hatch (client/canvas/placeables/region.mjs `_draw` and `_refreshState`). The mesh
 * itself is public: it lives in the region layer's `_highlights` container, names its region,
 * and can swap its shader class. `drawRegion` fires after `_draw` and `refreshRegion` after
 * `_refreshState`, so a hook can override alpha, tint and shader uniforms right after core
 * sets them, and nothing needs wrapping or replacing. Regions without the flag are never
 * touched, and a region that loses its flag gets the core shader and alpha back.
 */

interface IDisplayState {
  /** The DDB shader is installed on the mesh. */
  styled: boolean;
  textureSrc?: string;
  texture?: PIXI.Texture | null;
  /** The edge band graphic, when the style uses the edge pattern. */
  band: PIXI.Graphics | null;
  /** The stencil mask that keeps the fill inside the band, when there is a band. */
  mask: PIXI.Graphics | null;
  /** The inset, in pixels, the mask was last drawn at; a different inset or new geometry redraws it. */
  maskInset: number | null;
  /** The inputs `style` was resolved from (see displaySignature); null until the first resolve. */
  signature: string | null;
  /** The style last resolved for the region, or null when its choice names no profile that exists. */
  style: IRegionDisplayStyle | null;
  /** The mesh the style was applied to; a redraw builds a new one. */
  mesh: TCoreRegionMesh | null;
}

function newState(): IDisplayState {
  return { styled: false, band: null, mask: null, maskInset: null, signature: null, style: null, mesh: null };
}

/**
 * How far the fill reaches back under the band, in pixels. The stencil mask has a hard edge
 * while the band's stroke is antialiased, so meeting exactly can leave a hairline seam.
 */
const FILL_UNDER_BAND_PX = 0.5;

const states = new WeakMap<TCoreRegionPlaceable, IDisplayState>();

/**
 * Bumped whenever the profile store changes, so every cached signature goes stale at once
 * without walking the regions.
 */
let profileGeneration = 0;

/** Canvas facts the style needs, separated so applyStyle can be exercised without a canvas. */
interface IDisplayCanvasMetrics {
  /** Grid square size in pixels. */
  grid: number;
  /** canvas.dimensions.uiScale, which core folds into the hatch thickness. */
  uiScale: number;
}

function canvasMetrics(): IDisplayCanvasMetrics {
  const dimensions = (canvas as unknown as { dimensions?: { size?: number; uiScale?: number } }).dimensions;
  return {
    grid: dimensions?.size ?? 100,
    uiScale: dimensions?.uiScale ?? 1,
  };
}

function regionLayer(): TCoreRegionLayer | null {
  return (canvas as unknown as { regions?: TCoreRegionLayer }).regions ?? null;
}

export function displayFlag(
  doc: RegionDocument.Implementation | RegionDocument.CreateData | null | undefined,
): IRegionDisplayFlag | undefined {
  const flag = foundry.utils.getProperty(doc ?? {}, REGION_DISPLAY_FLAG_PATH) as IRegionDisplayFlag | undefined;
  return flag && typeof flag === "object" ? flag : undefined;
}

/**
 * Everything a region's resolved style depends on, as one comparable string: its display
 * choice, its own colour, the grid metrics folded into the uniforms and the profile store's
 * generation. A moving region is refreshed every animation frame, and while this string is
 * unchanged the style resolved last time still holds, so the profile lookup and uniform
 * writes can be skipped.
 */
export function displaySignature(
  flag: IRegionDisplayFlag | null | undefined,
  regionColor: unknown,
  metrics: IDisplayCanvasMetrics,
  generation = profileGeneration,
): string {
  return JSON.stringify([generation, flag ?? null, String(regionColor), metrics.grid, metrics.uiScale]);
}

/** The style a region document asks for, or null for the Foundry look. */
export function resolveDisplayStyle(
  doc: RegionDocument.Implementation | null | undefined,
): IRegionDisplayStyle | null {
  return RegionDisplayProfiles.resolve(displayFlag(doc));
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

/** Core's hatch width, which Region#_draw sets once and a shader swap resets. */
function coreHatchThickness(metrics: IDisplayCanvasMetrics): number {
  return 4 * metrics.uiScale;
}

/**
 * Write a resolved style onto a mesh: alpha, tint and the pattern uniforms. Core's
 * `hatchEnabled` uniform is left alone; the shader reads it as "not being edited".
 */
export function applyStyle(
  mesh: TCoreRegionMesh,
  style: IRegionDisplayStyle,
  regionColor: number | string,
  metrics: IDisplayCanvasMetrics,
): void {
  const edge = style.pattern === "edge";
  // an edge band supplies the look; the fill only faintly reads so the interior stays legible
  mesh.alpha = edge ? style.opacity * 0.15 : style.opacity;
  mesh.tint = tintFor(style.color, regionColor);
  const uniforms = mesh.shader.uniforms;
  uniforms.pattern = REGION_DISPLAY_PATTERN_IDS[style.pattern];
  uniforms.imageContain = style.textureFit === "contain";
  uniforms.imageRecolor = style.textureColorMode === "region";
  uniforms.imageRegion = style.textureAnchor === "region";
  uniforms.imageTiled = style.pattern === "imageTile";
  uniforms.period = Math.max(1, style.spacing * metrics.grid);
  uniforms.thickness = style.thickness;
  uniforms.gapOpacity = style.gapOpacity;
  uniforms.dashed = style.dashed;
  // one dash plus one equal gap
  uniforms.dashPeriod = Math.max(1, style.dashLength * metrics.grid * 2);
  uniforms.angle = (style.angle * Math.PI) / 180;
  uniforms.crossRotation = (style.crossRotation * Math.PI) / 180;
  uniforms.crossLength = style.crossLength;
  uniforms.waveAmplitude = style.waveAmplitude;
  uniforms.waveLength = style.waveLength;
  uniforms.patternOffset = style.offset;
}

/** Shader replacement resets uniforms; keep the interaction state core computed before our hook. */
function setDisplayShaderClass(mesh: TCoreRegionMesh, shaderClass: TCoreShaderClass): void {
  const hatchEnabled = mesh.shader.uniforms.hatchEnabled;
  mesh.setShaderClass(shaderClass);
  mesh.shader.uniforms.hatchEnabled = hatchEnabled;
}

/** Put the core shader, alpha and tint back on a mesh the DDB shader had been installed on. */
export function restoreCoreStyle(
  mesh: TCoreRegionMesh,
  regionColor: number | string,
  metrics: IDisplayCanvasMetrics,
): void {
  const Core = getCoreHighlightShaderClass();
  if (Core) setDisplayShaderClass(mesh, Core);
  mesh.shader.uniforms.hatchThickness = coreHatchThickness(metrics);
  mesh.alpha = REGION_DISPLAY_DEFAULTS.opacity;
  mesh.tint = tintFor(null, regionColor);
}

/** The inner band a style asks for, in grid squares: the edge pattern's, a border's, or none. */
export function bandWidth(style: IRegionDisplayStyle | null): number {
  if (!style) return 0;
  if (style.pattern === "edge") return style.edgeWidth;
  return style.border ? style.borderWidth : 0;
}

/** Draw (or clear) the edge band or border for a region as a stroked graphic beside the mesh. */
export function drawEdgeBand(
  region: TCoreRegionPlaceable,
  mesh: TCoreRegionMesh,
  style: IRegionDisplayStyle | null,
  state: IDisplayState,
  metrics: IDisplayCanvasMetrics,
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
  band.alpha = style.borderOpacity;
  band.zIndex = mesh.zIndex;
  band.visible = mesh.visible;
}

/**
 * The region's shape shrunk by `inset` pixels, as a polygon tree that can draw itself. Holes
 * grow by the same amount, and a shape narrower than twice the inset comes back empty. Null
 * outside a Foundry client, where Clipper is not loaded.
 */
export function insetPolygonTree(
  tree: TCoreRegionPolygonTree,
  inset: number,
): Pick<TCoreRegionPolygonTree, "drawShape"> | null {
  if (typeof ClipperLib === "undefined") return null;
  // a miter limit of 2 keeps right-angled corners square; sharper tips (cones) are cut off
  const offsetter = new ClipperLib.ClipperOffset(2);
  // Clipper copies the points it is given, so the region's frozen paths are never modified
  offsetter.AddPaths(
    tree.clipperPaths as unknown as ClipperLib.Paths,
    ClipperLib.JoinType.jtMiter,
    ClipperLib.EndType.etClosedPolygon,
  );
  const solution = new ClipperLib.PolyTree();
  offsetter.Execute(solution, -inset * CONST.CLIPPER_SCALING_FACTOR);
  return foundry.data.PolygonTree.fromClipperPolyTree(solution);
}

/** Take the fill mask off a mesh and destroy it. */
function clearFillMask(state: IDisplayState, mesh: TCoreRegionMesh | null): void {
  if (!state.mask) return;
  if (mesh && mesh.mask === state.mask) mesh.mask = null;
  state.mask.destroy();
  state.mask = null;
  state.maskInset = null;
}

/**
 * Keep the fill inside the band: mask the mesh to the region shrunk by the band's width, so
 * the pattern stops where the border starts instead of running underneath it to the edge.
 * The shape is only recomputed when the geometry or the band width changes; every other
 * refresh reuses the drawn mask.
 */
export function syncFillMask(
  region: TCoreRegionPlaceable,
  mesh: TCoreRegionMesh,
  style: IRegionDisplayStyle | null,
  state: IDisplayState,
  metrics: IDisplayCanvasMetrics,
  { geometry = false }: { geometry?: boolean } = {},
  layer: TCoreRegionLayer | null = regionLayer(),
): void {
  const width = bandWidth(style);
  const container = layer?._highlights;
  if (width <= 0 || !container) {
    clearFillMask(state, mesh);
    return;
  }
  const inset = Math.max(0, Math.max(1, width * metrics.grid) - FILL_UNDER_BAND_PX);
  if (state.mask && !geometry && state.maskInset === inset) {
    if (mesh.mask !== state.mask) mesh.mask = state.mask;
    return;
  }
  const shape = insetPolygonTree(region.animationState.polygonTree, inset);
  if (!shape) {
    clearFillMask(state, mesh);
    return;
  }
  if (!state.mask) {
    state.mask = new PIXI.Graphics();
    state.mask.eventMode = "none";
    // beside the mesh, so the mask shares its transform
    container.addChild(state.mask);
  }
  const mask = state.mask;
  mask.clear();
  mask.beginFill(0xffffff, 1);
  shape.drawShape(mask);
  mask.endFill();
  state.maskInset = inset;
  mesh.mask = mask;
}

/** Destroy everything the display added for a region: the band and the fill mask. */
function releaseState(state: IDisplayState | undefined, mesh: TCoreRegionMesh | null): void {
  if (!state) return;
  state.texture = null;
  state.textureSrc = undefined;
  if (state.band) {
    state.band.destroy();
    state.band = null;
  }
  clearFillMask(state, mesh);
}

/**
 * Bind the style's image to the mesh sampler, loading it on first use. The shader draws the
 * hatch fallback until the texture arrives; the load then asks for one more refresh. By then
 * the region may be gone, redrawn onto a new mesh, unflagged or pointed at another image, and
 * any of those makes the completion stale.
 */
function syncImageTexture(
  region: TCoreRegionPlaceable,
  mesh: TCoreRegionMesh,
  style: IRegionDisplayStyle,
  state: IDisplayState,
): void {
  const src = isImagePattern(style.pattern) ? style.textureSrc : "";
  if (state.textureSrc !== src) {
    state.textureSrc = src;
    state.texture = null;
    if (src) {
      void loadDisplayTexture(src).then((texture) => {
        const stale = region.destroyed || states.get(region) !== state || state.textureSrc !== src;
        if (stale || findHighlightMesh(region) !== mesh) return;
        state.texture = texture;
        region.renderFlags.set({ refreshState: true });
      });
    }
  }
  mesh.shader.uniforms.imageReady = Boolean(state.texture?.valid);
  mesh.shader.uniforms.imageSampler = state.texture ?? PIXI.Texture?.WHITE ?? null;
  mesh.shader.uniforms.imageAspect = state.texture ? state.texture.width / Math.max(1, state.texture.height) : 1;
}

/**
 * Style a drawn region from its document, or restore the core look when it has no choice.
 *
 * `restyle` asks for the style to be written onto the mesh again even when nothing it depends
 * on changed: core's `_refreshState` has just reset the tint and hatch. A geometry-only
 * refresh, which a region following a token gets every animation frame, passes false and so
 * only redraws the band and fill mask, which follow the shape.
 */
export function syncRegionDisplay(
  region: TCoreRegionPlaceable,
  { geometry = false, restyle = true }: { geometry?: boolean; restyle?: boolean } = {},
): void {
  if (region.destroyed) return;
  const mesh = findHighlightMesh(region);
  if (!mesh) return;
  const flag = displayFlag(region.document);
  const metrics = canvasMetrics();
  const regionColor = region.document.color as unknown as string | number;
  let state = states.get(region);
  const signature = flag ? displaySignature(flag, regionColor, metrics) : null;
  const reusable = state && signature !== null && state.signature === signature && state.mesh === mesh;
  const cached = reusable ? state : undefined;
  const style = cached ? cached.style : RegionDisplayProfiles.resolve(flag);
  if (!style) {
    if (state?.styled) {
      restoreCoreStyle(mesh, regionColor, metrics);
      releaseState(state, mesh);
      states.delete(region);
      state = undefined;
    }
    if (signature === null) {
      states.delete(region);
      return;
    }
    // a choice naming a missing profile is remembered too, so a moving region does not look
    // the profile up again every frame
    state ??= newState();
    Object.assign(state, { signature, style: null, mesh });
    states.set(region, state);
    return;
  }
  if (!state) {
    state = newState();
    states.set(region, state);
  }
  let installed = false;
  if (!state.styled) {
    const Shader = getDDBDisplayShaderClass();
    if (!Shader) return;
    setDisplayShaderClass(mesh, Shader);
    state.styled = true;
    installed = true;
  }
  if (restyle || installed || !cached) {
    applyStyle(mesh, style, regionColor, metrics);
    syncImageTexture(region, mesh, style, state);
  }
  Object.assign(state, { signature, style, mesh });
  if (geometry || bandWidth(style) > 0 || state.band) drawEdgeBand(region, mesh, style, state, metrics);
  if (geometry || bandWidth(style) > 0 || state.mask) syncFillMask(region, mesh, style, state, metrics, { geometry });
}

export function onDrawRegion(region: TCoreRegionPlaceable): void {
  // a redraw builds a fresh mesh, so any earlier state is stale; the old mesh is already gone
  releaseState(states.get(region), null);
  states.delete(region);
  syncRegionDisplay(region, { geometry: true });
}

export function onRefreshRegion(region: TCoreRegionPlaceable, flags: Record<string, boolean> = {}): void {
  if (flags.refreshState || flags.refreshGeometry || flags.refreshShapes) {
    syncRegionDisplay(region, {
      geometry: Boolean(flags.refreshGeometry || flags.refreshShapes),
      restyle: Boolean(flags.refreshState),
    });
    return;
  }
  const band = states.get(region)?.band;
  if (band && flags.refreshVisibility) band.visible = region.visible;
}

export function onDestroyRegion(region: TCoreRegionPlaceable): void {
  releaseState(states.get(region), findHighlightMesh(region));
  states.delete(region);
}

/**
 * Ask a drawn region to re-style itself on its next render. A style change never moves the region,
 * so no geometry refresh is needed: the band and fill mask follow the new style from the state pass
 * (the mask is rebuilt when its inset changes).
 */
function requestRestyle(region: TCoreRegionPlaceable): void {
  region.renderFlags.set({ refreshState: true });
}

/**
 * Re-style the regions a profile edit can affect: those with a display choice, and those still
 * carrying a style from one that was just removed. Unstyled regions are left alone.
 */
export function refreshAllRegionDisplays(): void {
  profileGeneration += 1;
  const layer = regionLayer();
  if (!layer) return;
  for (const region of layer.placeables) {
    if (displayFlag(region.document) || states.has(region)) requestRestyle(region);
  }
}

/** Re-style only the region whose display choice changed. */
export function onUpdateRegion(
  doc: { object?: TCoreRegionPlaceable | null } | null | undefined,
  changed: Record<string, unknown>,
): void {
  // a deletion (`_del`) stays in the diff under the plain key, so one check covers both
  if (!foundry.utils.hasProperty(changed, REGION_DISPLAY_FLAG_PATH)) return;
  const region = doc?.object;
  if (region && !region.destroyed) requestRestyle(region);
}

/** Register the canvas hooks. Safe on every client; each handler ignores unflagged regions. */
export function registerRegionDisplayHooks(): void {
  Hooks.on<"drawRegion">("drawRegion", (region) => onDrawRegion(region as unknown as TCoreRegionPlaceable));
  Hooks.on<"refreshRegion">("refreshRegion", (region, flags) =>
    onRefreshRegion(region as unknown as TCoreRegionPlaceable, flags as Record<string, boolean>),
  );
  Hooks.on<"destroyRegion">("destroyRegion", (region) => onDestroyRegion(region as unknown as TCoreRegionPlaceable));
  Hooks.on<"updateRegion">("updateRegion", (doc, changed) =>
    onUpdateRegion(doc as unknown as { object?: TCoreRegionPlaceable | null }, changed as Record<string, unknown>),
  );
  Hooks.on<typeof REGION_DISPLAY_PROFILES_CHANGED>(REGION_DISPLAY_PROFILES_CHANGED, () =>
    refreshAllRegionDisplays(),
  );
  logger.debug(
    `${REGION_DISPLAY_LOG} hooks registered (drawRegion, refreshRegion, destroyRegion, updateRegion, ${REGION_DISPLAY_PROFILES_CHANGED})`,
  );
}
