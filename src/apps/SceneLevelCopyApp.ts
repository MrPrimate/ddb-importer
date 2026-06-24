import DDBAppV2 from "./DDBAppV2";
import { logger } from "../lib/_module";
import { levelsArray, levelId } from "./SceneGridDetector";
import { GridHintSurface, probeImageDimensions, IDims } from "./lib/gridHint";

const { DialogV2 } = foundry.applications.api;

// A canvas-space coordinate transform: `point` maps a single (x, y); `scale`
// reports the per-axis multiplier so length-bearing fields (drawing/region
// dimensions, radii) can be scaled to match.
interface ITransform {
  point: (x: number, y: number) => [number, number];
  scale: { sx: number; sy: number };
}

// A copyable placeable type. `mapDoc` mutates a cloned plain object's
// coordinates in place using the transform.
interface IPlaceableType {
  id: string;
  coll: string;
  docName: string;
  label: string;
  mapDoc: (t: ITransform, obj: any) => void;
}

// Average scale for fields that have a single magnitude (radii) when the
// transform is non-uniform.
function avgScale(t: ITransform): number {
  return (t.scale.sx + t.scale.sy) / 2;
}

// Map a flat [x, y, x, y, ...] point array in place.
function mapFlatPoints(t: ITransform, points: number[] | undefined): void {
  if (!Array.isArray(points)) return;
  for (let i = 0; i + 1 < points.length; i += 2) {
    const [x, y] = t.point(points[i], points[i + 1]);
    points[i] = x;
    points[i + 1] = y;
  }
}

// Map a single inner shape object (drawing ShapeData or region shape). Drawing
// shapes use short type codes (r/c/e/p); region shapes use full names
// (rectangle/circle/ellipse/polygon). Both are handled.
function mapShape(t: ITransform, shape: any): void {
  if (!shape || typeof shape !== "object") return;
  const type = shape.type;
  // Origin point (top-left for rect, centre for circle/ellipse, first point
  // for polygon). Present on every shape variant that carries x/y.
  if (typeof shape.x === "number" && typeof shape.y === "number") {
    const [x, y] = t.point(shape.x, shape.y);
    shape.x = x;
    shape.y = y;
  }
  switch (type) {
    case "r":
    case "rectangle":
      if (typeof shape.width === "number") shape.width *= t.scale.sx;
      if (typeof shape.height === "number") shape.height *= t.scale.sy;
      break;
    case "c":
    case "circle":
      if (typeof shape.radius === "number") shape.radius *= avgScale(t);
      break;
    case "e":
    case "ellipse":
      if (typeof shape.radiusX === "number") shape.radiusX *= t.scale.sx;
      if (typeof shape.radiusY === "number") shape.radiusY *= t.scale.sy;
      break;
    case "p":
    case "polygon":
      mapFlatPoints(t, shape.points);
      break;
    // no default
  }
}

const PLACEABLE_TYPES: IPlaceableType[] = [
  {
    id: "walls",
    coll: "walls",
    docName: "Wall",
    label: "Walls",
    mapDoc: (t, o) => {
      if (!Array.isArray(o.c) || o.c.length < 4) return;
      const [x0, y0] = t.point(o.c[0], o.c[1]);
      const [x1, y1] = t.point(o.c[2], o.c[3]);
      o.c = [x0, y0, x1, y1];
    },
  },
  {
    id: "lights",
    coll: "lights",
    docName: "AmbientLight",
    label: "Lights",
    mapDoc: (t, o) => {
      [o.x, o.y] = t.point(o.x ?? 0, o.y ?? 0);
    },
  },
  {
    id: "notes",
    coll: "notes",
    docName: "Note",
    label: "Notes",
    mapDoc: (t, o) => {
      [o.x, o.y] = t.point(o.x ?? 0, o.y ?? 0);
    },
  },
  {
    id: "drawings",
    coll: "drawings",
    docName: "Drawing",
    label: "Drawings",
    mapDoc: (t, o) => {
      [o.x, o.y] = t.point(o.x ?? 0, o.y ?? 0);
      mapShape(t, o.shape);
    },
  },
  {
    id: "regions",
    coll: "regions",
    docName: "Region",
    label: "Regions",
    mapDoc: (t, o) => {
      if (Array.isArray(o.shapes)) for (const shape of o.shapes) mapShape(t, shape);
    },
  },
];

type TScaleMode = "none" | "ratio" | "hint" | "gridcells";

const SQUARE_GRID = 1; // CONST.GRID_TYPES.SQUARE

export default class SceneLevelCopyApp extends DDBAppV2 {

  source: Scene;
  sourceLevelId: string | null = null;
  targetId: string | null = null;
  targetLevelId: string | null = null;
  scaleMode: TScaleMode = "none";
  types: Set<string>;
  offsetNudge: { x: number; y: number } = { x: 0, y: 0 };
  editStep = 1;

  sourceHint: GridHintSurface;
  targetHint: GridHintSurface;
  sourceDims: IDims = { x: 0, y: 0 };
  targetDims: IDims = { x: 0, y: 0 };
  private _sourceImageUrl = "";
  private _targetImageUrl = "";

  static DEFAULT_OPTIONS = {
    id: "ddb-scene-level-copy",
    classes: ["dnd5e2", "ddb-scene-level-copy-app"],
    window: {
      title: "Copy Level Objects",
      icon: "fas fa-layer-group",
      resizable: true,
      minimizable: true,
    },
    actions: {
      toggleType: SceneLevelCopyApp.toggleType,
      setScaleMode: SceneLevelCopyApp.setScaleMode,
      redrawSourceHint: SceneLevelCopyApp.redrawSourceHint,
      redrawTargetHint: SceneLevelCopyApp.redrawTargetHint,
      nudgeEdge: SceneLevelCopyApp.nudgeEdge,
      zoomSourceIn: SceneLevelCopyApp.zoomSourceIn,
      zoomSourceOut: SceneLevelCopyApp.zoomSourceOut,
      zoomSourceFit: SceneLevelCopyApp.zoomSourceFit,
      zoomTargetIn: SceneLevelCopyApp.zoomTargetIn,
      zoomTargetOut: SceneLevelCopyApp.zoomTargetOut,
      zoomTargetFit: SceneLevelCopyApp.zoomTargetFit,
      copyPlaceables: SceneLevelCopyApp.copyPlaceables,
      cancel: SceneLevelCopyApp.cancel,
    },
    position: { width: 900, height: "auto" as const },
  };

  static PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/scene-level-copy/copy.hbs",
    },
  };

  constructor(source: Scene) {
    super();
    this.source = source;
    this.targetId = source.id ?? null;
    this.types = new Set(PLACEABLE_TYPES.map((t) => t.id));
    this.sourceHint = new GridHintSurface(() => this.render());
    this.targetHint = new GridHintSurface(() => this.render());
    const levels = this._levelsOf(source);
    this.sourceLevelId = levels[0] ? levelId(levels[0]) : null;
    this.targetLevelId = this.sourceLevelId;
  }

  _getTabs() {
    return {};
  }

  // "Parent / Child / " prefix walking the scene's folder ancestry, so the
  // dropdown shows where each scene lives. Empty string for top-level scenes.
  static _folderPath(scene: any): string {
    const names: string[] = [];
    let folder = scene.folder;
    while (folder) {
      names.unshift(folder.name);
      folder = folder.folder;
    }
    return names.length ? `${names.join(" / ")} / ` : "";
  }

  _levelsOf(scene: Scene): any[] {
    return levelsArray(scene?.levels);
  }

  _targetScene(): Scene | null {
    return this.targetId ? game.scenes.get(this.targetId) as Scene : null;
  }

  _levelById(scene: Scene, id: string | null): any | null {
    if (!scene || !id) return null;
    return this._levelsOf(scene).find((l) => levelId(l) === id) ?? null;
  }

  // Background image src for a level (used as the hint-draw surface).
  _levelImageUrl(scene: Scene, id: string | null): string {
    const level = this._levelById(scene, id);
    const src = level?.background?.src;
    return typeof src === "string" ? src : "";
  }

  // Source docs of a type belonging to the chosen source level. Empty `levels`
  // means "all levels", so those are included too (per user decision).
  _sourceDocs(entry: IPlaceableType): any[] {
    const coll = this.source?.[entry.coll];
    if (!coll) return [];
    const all = Array.from(coll) as any[];
    return all.filter((d) => {
      const levels = Array.from(d.levels ?? []) as string[];
      return levels.length === 0 || (this.sourceLevelId != null && levels.includes(this.sourceLevelId));
    });
  }

  // ----- coordinate mapping (image px <-> scene-canvas px) -----

  // The level background is drawn within the scene rect, which is offset from
  // the padded canvas origin by sceneX/sceneY (the scene padding, plus any
  // shiftX/shiftY). Placeable coords (walls, lights, ...) live in that padded
  // canvas space, so the image-pixel mapping must anchor on the scene rect's
  // centre, not on width/2. Returns the rect geometry used by both directions.
  _sceneGeom(scene: Scene, level: I5eSceneLevel, dims: IDims) {
    const texW = dims.x || 1;
    const texH = dims.y || 1;
    const d = (scene as any)?.dimensions ?? {};
    const sceneW = Number(d.sceneWidth) || Number(scene?.width) || texW;
    const sceneH = Number(d.sceneHeight) || Number(scene?.height) || texH;
    const centreX = (Number(d.sceneX) || 0) + sceneW / 2;
    const centreY = (Number(d.sceneY) || 0) + sceneH / 2;
    const tex = (level?.textures ?? {}) as any;
    const sx = (typeof tex.scaleX === "number" && tex.scaleX > 0) ? tex.scaleX * sceneW / texW : sceneW / texW;
    const sy = (typeof tex.scaleY === "number" && tex.scaleY > 0) ? tex.scaleY * sceneH / texH : sceneH / texH;
    return {
      texW, texH,
      centreX, centreY,
      sx: sx || 1,
      sy: sy || 1,
      offsetX: Number(tex.offsetX) || 0,
      offsetY: Number(tex.offsetY) || 0,
    };
  }

  // Forward: image pixel -> padded scene-canvas pixel for a given level.
  _imgToCanvas(scene: Scene, level: I5eSceneLevel, dims: IDims, px: number, py: number): [number, number] {
    const g = this._sceneGeom(scene, level, dims);
    return [
      g.centreX + g.offsetX + (px - g.texW / 2) * g.sx,
      g.centreY + g.offsetY + (py - g.texH / 2) * g.sy,
    ];
  }

  // Inverse: padded scene-canvas pixel -> image pixel (used for the preview).
  _canvasToImg(scene: Scene, level: I5eSceneLevel, dims: IDims, cx: number, cy: number): [number, number] {
    const g = this._sceneGeom(scene, level, dims);
    return [
      g.texW / 2 + (cx - g.centreX - g.offsetX) / g.sx,
      g.texH / 2 + (cy - g.centreY - g.offsetY) / g.sy,
    ];
  }

  _isSquareGrid(scene: Scene | null): boolean {
    return Number((scene as any)?.grid?.type) === SQUARE_GRID;
  }

  // True when both source and target use a square grid (required for the
  // grid-cell alignment mode - a 3x3 block is square-grid specific).
  _gridModeAvailable(): boolean {
    return this._isSquareGrid(this.source) && this._isSquareGrid(this._targetScene());
  }

  // Snapper for a scene/level: image px -> nearest grid-line intersection ->
  // image px. Square grid lines sit at k*size in padded-canvas coords.
  _snapForScene(scene: Scene, level: I5eSceneLevel, dims: IDims): (x: number, y: number) => [number, number] {
    const size = Number((scene as any)?.grid?.size) || 0;
    if (!(size > 0)) return (x, y) => [x, y];
    return (imgX, imgY) => {
      const [cx, cy] = this._imgToCanvas(scene, level, dims, imgX, imgY);
      const scx = Math.round(cx / size) * size;
      const scy = Math.round(cy / size) * size;
      return this._canvasToImg(scene, level, dims, scx, scy);
    };
  }

  // Image-space grid line segments for the overlay. Steps the grid across the
  // image's canvas extent and converts each line's endpoints back to image px.
  // Capped so a tiny grid on a huge map cannot emit thousands of lines.
  _buildGridLines(scene: Scene, level: I5eSceneLevel, dims: IDims): { lines: { x1: number; y1: number; x2: number; y2: number }[] } {
    const out: { lines: { x1: number; y1: number; x2: number; y2: number }[] } = { lines: [] };
    const size = Number((scene as any)?.grid?.size) || 0;
    if (!(size > 0) || dims.x <= 0) return out;
    // Canvas extent spanned by the image corners.
    const [cx0, cy0] = this._imgToCanvas(scene, level, dims, 0, 0);
    const [cx1, cy1] = this._imgToCanvas(scene, level, dims, dims.x, dims.y);
    const minX = Math.min(cx0, cx1);
    const maxX = Math.max(cx0, cx1);
    const minY = Math.min(cy0, cy1);
    const maxY = Math.max(cy0, cy1);
    const CAP = 400;
    if ((maxX - minX) / size > CAP || (maxY - minY) / size > CAP) {
      logger.warn(`SceneLevelCopy: grid too dense to overlay (>${CAP} lines/axis), skipping grid render.`);
      return out;
    }
    const startX = Math.floor(minX / size) * size;
    const startY = Math.floor(minY / size) * size;
    for (let gx = startX; gx <= maxX; gx += size) {
      const [ix1, iy1] = this._canvasToImg(scene, level, dims, gx, minY);
      const [ix2, iy2] = this._canvasToImg(scene, level, dims, gx, maxY);
      out.lines.push({ x1: ix1, y1: iy1, x2: ix2, y2: iy2 });
    }
    for (let gy = startY; gy <= maxY; gy += size) {
      const [ix1, iy1] = this._canvasToImg(scene, level, dims, minX, gy);
      const [ix2, iy2] = this._canvasToImg(scene, level, dims, maxX, gy);
      out.lines.push({ x1: ix1, y1: iy1, x2: ix2, y2: iy2 });
    }
    return out;
  }

  // Build the source->target canvas transform for the chosen mode. Returns
  // null when the mode lacks the data it needs (e.g. hint with no boxes).
  _buildTransform(): ITransform | null {
    const nudge = this.offsetNudge;
    if (this.scaleMode === "none") {
      return {
        point: (x, y) => [x + nudge.x, y + nudge.y],
        scale: { sx: 1, sy: 1 },
      };
    }
    if (this.scaleMode === "ratio") {
      const target = this._targetScene();
      const srcSize = Number(this.source?.grid?.size) || 0;
      const tgtSize = Number(target?.grid?.size) || 0;
      if (!(srcSize > 0) || !(tgtSize > 0)) return null;
      const s = tgtSize / srcSize;
      return {
        point: (x, y) => [x * s + nudge.x, y * s + nudge.y],
        scale: { sx: s, sy: s },
      };
    }
    // hint / gridcells - both derive the transform from the two drawn boxes.
    // They differ only in how the box was drawn (freeform vs grid-snapped).
    const target = this._targetScene();
    const srcRect = this.sourceHint.rect;
    const tgtRect = this.targetHint.rect;
    if (!srcRect || !tgtRect || !target) return null;
    if (!(srcRect.w > 0) || !(srcRect.h > 0) || !(tgtRect.w > 0) || !(tgtRect.h > 0)) return null;
    const srcLevel = this._levelById(this.source, this.sourceLevelId);
    const tgtLevel = this._levelById(target, this.targetLevelId);
    // 3x3 boxes -> canvas-space rects on each side.
    const [sx0, sy0] = this._imgToCanvas(this.source, srcLevel, this.sourceDims, srcRect.x, srcRect.y);
    const [sx1, sy1] = this._imgToCanvas(this.source, srcLevel, this.sourceDims, srcRect.x + srcRect.w, srcRect.y + srcRect.h);
    const [tx0, ty0] = this._imgToCanvas(target, tgtLevel, this.targetDims, tgtRect.x, tgtRect.y);
    const [tx1, ty1] = this._imgToCanvas(target, tgtLevel, this.targetDims, tgtRect.x + tgtRect.w, tgtRect.y + tgtRect.h);
    const srcW = sx1 - sx0;
    const srcH = sy1 - sy0;
    if (!(Math.abs(srcW) > 0) || !(Math.abs(srcH) > 0)) return null;
    const sScaleX = (tx1 - tx0) / srcW;
    const sScaleY = (ty1 - ty0) / srcH;
    return {
      point: (x, y) => [tx0 + (x - sx0) * sScaleX + nudge.x, ty0 + (y - sy0) * sScaleY + nudge.y],
      scale: { sx: sScaleX, sy: sScaleY },
    };
  }

  // Cloned, transformed, retagged copies of one type's source docs.
  _projected(entry: IPlaceableType, transform: ITransform): any[] {
    return this._sourceDocs(entry).map((d) => {
      const o = d.toObject();
      delete o._id;
      entry.mapDoc(transform, o);
      o.levels = this.targetLevelId ? [this.targetLevelId] : [];
      return o;
    });
  }

  async _refreshImages(): Promise<void> {
    const srcUrl = this._levelImageUrl(this.source, this.sourceLevelId);
    if (srcUrl !== this._sourceImageUrl) {
      this._sourceImageUrl = srcUrl;
      this.sourceDims = await probeImageDimensions(srcUrl);
      this.sourceHint.dims = this.sourceDims;
    }
    const target = this._targetScene();
    const tgtUrl = this._levelImageUrl(target, this.targetLevelId);
    if (tgtUrl !== this._targetImageUrl) {
      this._targetImageUrl = tgtUrl;
      this.targetDims = await probeImageDimensions(tgtUrl);
      this.targetHint.dims = this.targetDims;
    }
  }

  async _prepareContext(_options): Promise<any> {
    const context = await super._prepareContext({ ..._options, noCacheLoad: true });
    await this._refreshImages();

    const target = this._targetScene();
    const transform = this._buildTransform();

    const sourceLevels = this._levelsOf(this.source).map((l) => ({
      id: levelId(l),
      name: l.name ?? "Level",
      selected: levelId(l) === this.sourceLevelId,
    }));

    const targetScenes = (Array.from(game.scenes) as any[]).map((s) => ({
      id: s.id as string,
      name: SceneLevelCopyApp._folderPath(s) + (s.name ?? ""),
      selected: s.id === this.targetId,
    })).sort((a, b) => a.name.localeCompare(b.name));

    const targetLevels = this._levelsOf(target).map((l) => ({
      id: levelId(l),
      name: l.name ?? "Level",
      selected: levelId(l) === this.targetLevelId,
    }));

    const typeRows = PLACEABLE_TYPES.map((entry) => ({
      id: entry.id,
      label: entry.label,
      selected: this.types.has(entry.id),
      count: this._sourceDocs(entry).length,
    }));

    // Preview overlay: project each selected type's docs and convert back to
    // target-image pixels so the SVG can draw them over the target background.
    const preview = this._buildPreview(target, transform);
    const sourceOverlay = this._buildSourceOverlay();

    const modeGridCells = this.scaleMode === "gridcells";
    const srcLevel = this._levelById(this.source, this.sourceLevelId);
    const tgtLevel = this._levelById(target, this.targetLevelId);
    const sourceGridLines = modeGridCells ? this._buildGridLines(this.source, srcLevel, this.sourceDims).lines : [];
    const targetGridLines = (modeGridCells && target) ? this._buildGridLines(target, tgtLevel, this.targetDims).lines : [];

    return foundry.utils.mergeObject(context, {
      sourceName: this.source.name ?? "Scene",
      sourceLevels,
      targetScenes,
      targetLevels,
      typeRows,
      scaleMode: this.scaleMode,
      modeNone: this.scaleMode === "none",
      modeRatio: this.scaleMode === "ratio",
      modeHint: this.scaleMode === "hint",
      modeGridCells,
      showSurfaces: this.scaleMode === "hint" || modeGridCells,
      gridModeAvailable: this._gridModeAvailable(),
      sourceGridLines,
      targetGridLines,
      offsetNudge: this.offsetNudge,
      editStep: this.editStep,
      transformReady: !!transform,
      sameLevel: this.targetId === this.source.id && this.targetLevelId === this.sourceLevelId,
      // hint surfaces
      sourceImageUrl: this._sourceImageUrl,
      targetImageUrl: this._targetImageUrl,
      sourceDims: this.sourceDims,
      targetDims: this.targetDims,
      sourceViewBox: this.sourceHint.currentViewBox(),
      targetViewBox: this.targetHint.currentViewBox(),
      sourceZoomedIn: this.sourceHint.zoomedIn,
      targetZoomedIn: this.targetHint.zoomedIn,
      sourceHintRect: this.sourceHint.rect,
      targetHintRect: this.targetHint.rect,
      sourceHintHandles: this.sourceHint.handles(),
      targetHintHandles: this.targetHint.handles(),
      sourceHasRect: !!this.sourceHint.rect,
      targetHasRect: !!this.targetHint.rect,
      sourceCellPx: this.sourceHint.cellPx()?.toFixed(1) ?? null,
      targetCellPx: this.targetHint.cellPx()?.toFixed(1) ?? null,
      preview,
      sourceOverlay,
      canCopy: !!transform && this.types.size > 0 && !!this.targetLevelId,
    });
  }

  // Draw one placeable type's plain objects (canvas coords) into the overlay
  // buffer, converting to image space via `toImg`.
  _drawDocs(entryId: string, objs: any[], toImg: (x: number, y: number) => [number, number], out: { lines: any[]; dots: any[] }): void {
    for (const o of objs) {
      if (entryId === "walls" && Array.isArray(o.c) && o.c.length >= 4) {
        const [x1, y1] = toImg(o.c[0], o.c[1]);
        const [x2, y2] = toImg(o.c[2], o.c[3]);
        out.lines.push({ x1, y1, x2, y2 });
      } else if (typeof o.x === "number" && typeof o.y === "number") {
        const [x, y] = toImg(o.x, o.y);
        out.dots.push({ x, y });
      } else if (entryId === "regions" && Array.isArray(o.shapes)) {
        for (const shape of o.shapes) {
          if (typeof shape.x === "number" && typeof shape.y === "number") {
            const [x, y] = toImg(shape.x, shape.y);
            out.dots.push({ x, y });
          }
        }
      }
    }
  }

  // Build SVG primitives (in target-image space) for the projected placeables.
  _buildPreview(target: Scene, transform: ITransform | null): any {
    const out = { lines: [] as any[], dots: [] as any[], totalCount: 0, ready: !!transform };
    if (!target || !transform) return out;
    const tgtLevel = this._levelById(target, this.targetLevelId);
    const toImg = (cx: number, cy: number) => this._canvasToImg(target, tgtLevel, this.targetDims, cx, cy);
    for (const entry of PLACEABLE_TYPES) {
      if (!this.types.has(entry.id)) continue;
      const projected = this._projected(entry, transform);
      out.totalCount += projected.length;
      this._drawDocs(entry.id, projected, toImg, out);
    }
    return out;
  }

  // Build SVG primitives (in source-image space) for the source placeables as
  // they currently sit - no transform - so the user can see what will be copied.
  _buildSourceOverlay(): any {
    const out = { lines: [] as any[], dots: [] as any[], totalCount: 0 };
    if (this.sourceDims.x <= 0) return out;
    const srcLevel = this._levelById(this.source, this.sourceLevelId);
    const toImg = (cx: number, cy: number) => this._canvasToImg(this.source, srcLevel, this.sourceDims, cx, cy);
    for (const entry of PLACEABLE_TYPES) {
      if (!this.types.has(entry.id)) continue;
      const objs = this._sourceDocs(entry).map((d) => d.toObject());
      out.totalCount += objs.length;
      this._drawDocs(entry.id, objs, toImg, out);
    }
    return out;
  }

  async _onRender(context, options) {
    await (super._onRender as any)?.(context, options);

    // Bind <select> change listeners (avoid the action re-render that discards
    // a dropdown choice mid-open).
    const bindSelect = (selector: string, handler: (value: string) => void) => {
      const el = this.element.querySelector<HTMLSelectElement>(selector);
      if (el) el.addEventListener("change", (event) => handler((event.currentTarget as HTMLSelectElement).value));
    };
    bindSelect(".ddb-level-copy-source-level", (v) => {
      this.sourceLevelId = v || null;
      this.render();
    });
    bindSelect(".ddb-level-copy-target-scene", (v) => {
      this.targetId = v || null;
      const tgt = this._targetScene();
      const levels = this._levelsOf(tgt);
      this.targetLevelId = levels[0] ? levelId(levels[0]) : null;
      this.render();
    });
    bindSelect(".ddb-level-copy-target-level", (v) => {
      this.targetLevelId = v || null;
      this.render();
    });

    // Nudge inputs.
    this.element.querySelectorAll<HTMLInputElement>(".ddb-level-copy-nudge").forEach((input) => {
      input.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLInputElement;
        const axis = el.dataset.axis as "x" | "y";
        const val = Number(el.value);
        if (axis === "x" || axis === "y") this.offsetNudge[axis] = Number.isFinite(val) ? val : 0;
        this.render();
      });
    });

    // Edge-nudge step size (px). No re-render needed - read live on each nudge.
    const stepInput = this.element.querySelector<HTMLInputElement>(".ddb-level-copy-edit-step");
    if (stepInput) {
      stepInput.addEventListener("change", (event) => {
        const val = Number((event.currentTarget as HTMLInputElement).value);
        this.editStep = Number.isFinite(val) && val > 0 ? val : 1;
      });
    }

    // Grid-cell mode snaps drawn corners to grid-line intersections; clear the
    // snapper otherwise so hint mode stays freeform.
    if (this.scaleMode === "gridcells") {
      const target = this._targetScene();
      const srcLevel = this._levelById(this.source, this.sourceLevelId);
      const tgtLevel = this._levelById(target, this.targetLevelId);
      this.sourceHint.snapPoint = this._snapForScene(this.source, srcLevel, this.sourceDims);
      this.targetHint.snapPoint = target ? this._snapForScene(target, tgtLevel, this.targetDims) : null;
    } else {
      this.sourceHint.snapPoint = null;
      this.targetHint.snapPoint = null;
    }

    // The source surface exists in hint + gridcells modes. The target svg is
    // present in every mode (surface or plain preview); wiring it is
    // overlay-safe when the hint elements are absent, so wheel-zoom/pan works
    // either way.
    if (this.scaleMode === "hint" || this.scaleMode === "gridcells") {
      this.sourceHint.wire(this.element.querySelector<SVGSVGElement>(".ddb-level-copy-source-svg"));
    }
    this.targetHint.wire(this.element.querySelector<SVGSVGElement>(".ddb-level-copy-target-svg"));
  }

  // ----- action handlers -----

  static toggleType(this: SceneLevelCopyApp, _event, target: HTMLElement) {
    const id = target?.dataset?.type;
    if (!id) return;
    if (this.types.has(id)) this.types.delete(id);
    else this.types.add(id);
    this.render();
  }

  static setScaleMode(this: SceneLevelCopyApp, _event, target: HTMLElement) {
    const mode = target?.dataset?.mode as TScaleMode;
    if (mode === "none" || mode === "ratio" || mode === "hint" || mode === "gridcells") {
      this.scaleMode = mode;
      this.render();
    }
  }

  static redrawSourceHint(this: SceneLevelCopyApp) {
    this.sourceHint.clearRect();
  }

  static redrawTargetHint(this: SceneLevelCopyApp) {
    this.targetHint.clearRect();
  }

  static nudgeEdge(this: SceneLevelCopyApp, _event, target: HTMLElement) {
    const surface = target?.dataset?.surface === "target" ? this.targetHint : this.sourceHint;
    const edge = target?.dataset?.edge as "left" | "right" | "top" | "bottom";
    const sign = Number(target?.dataset?.sign);
    if (!["left", "right", "top", "bottom"].includes(edge) || !Number.isFinite(sign)) return;
    surface.nudgeEdge(edge, sign * this.editStep);
  }

  static zoomSourceIn(this: SceneLevelCopyApp) {
    this.sourceHint.zoomIn();
  }

  static zoomSourceOut(this: SceneLevelCopyApp) {
    this.sourceHint.zoomOut();
  }

  static zoomSourceFit(this: SceneLevelCopyApp) {
    this.sourceHint.zoomFit();
  }

  static zoomTargetIn(this: SceneLevelCopyApp) {
    this.targetHint.zoomIn();
  }

  static zoomTargetOut(this: SceneLevelCopyApp) {
    this.targetHint.zoomOut();
  }

  static zoomTargetFit(this: SceneLevelCopyApp) {
    this.targetHint.zoomFit();
  }

  static cancel(this: SceneLevelCopyApp) {
    this.close();
  }

  static async copyPlaceables(this: SceneLevelCopyApp) {
    const target = this._targetScene();
    if (!target) {
      ui.notifications?.warn("Pick a target scene first.");
      return;
    }
    if (!this.targetLevelId) {
      ui.notifications?.warn("Pick a target level first.");
      return;
    }
    if (this.targetId === this.source.id && this.targetLevelId === this.sourceLevelId) {
      ui.notifications?.warn("Source and target level are the same.");
      return;
    }
    const transform = this._buildTransform();
    if (!transform) {
      ui.notifications?.warn("Alignment is incomplete (draw the 3x3 grids or check the grid sizes).");
      return;
    }
    const selected = PLACEABLE_TYPES.filter((e) => this.types.has(e.id));
    if (!selected.length) {
      ui.notifications?.warn("Select at least one object type to copy.");
      return;
    }

    // Replace vs append applies to all selected types.
    const mode = await DialogV2.wait({
      window: { title: "Copy Level Objects" },
      content: `<p>Copy selected objects onto level "<strong>${this._levelById(target, this.targetLevelId)?.name ?? "Level"}</strong>" of "<strong>${target.name}</strong>".</p>`
        + `<p>Existing objects already tagged to that level can be kept or replaced.</p>`,
      buttons: [
        { action: "append", label: "Append (keep existing)", default: true },
        { action: "replace", label: "Replace" },
        { action: "cancel", label: "Cancel" },
      ],
      rejectClose: false,
    } as any);
    if (!mode || mode === "cancel") return;

    try {
      let created = 0;
      let removed = 0;
      for (const entry of selected) {
        const docs = this._projected(entry, transform);
        if (mode === "replace") {
          const existing = (Array.from(target[entry.coll] ?? []) as any[])
            .filter((d) => (Array.from(d.levels ?? []) as string[]).includes(this.targetLevelId as string))
            .map((d) => d.id);
          if (docs.length) {
            await target.createEmbeddedDocuments(entry.docName as any, docs);
            created += docs.length;
          }
          if (existing.length) {
            await target.deleteEmbeddedDocuments(entry.docName as any, existing);
            removed += existing.length;
          }
        } else if (docs.length) {
          await target.createEmbeddedDocuments(entry.docName as any, docs);
          created += docs.length;
        }
      }
      const removedNote = mode === "replace" ? `, replaced ${removed}` : "";
      ui.notifications?.info(`Copied ${created} object(s) to "${target.name}"${removedNote}.`);
      this.close();
    } catch (error) {
      const msg = (error as Error).message;
      logger.error(`SceneLevelCopy: copy failed: ${msg}`, error);
      ui.notifications?.error(`Copy failed: ${msg}`);
    }
  }

}
