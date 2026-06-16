import DDBAppV2 from "./DDBAppV2";
import { logger, getMapScaleMultiplier } from "../lib/_module";
import {
  runDetectionForScene,
  rebuildDetectionRun,
  applyChoiceToScene,
  resolveSceneGridImageSource,
  ISceneGridDetectionRun,
  ICandidateChoice,
  ISceneGridImageSource,
} from "./SceneGridDetector";

interface ICell {
  id: string;
  i: number;
  j: number;
  x: number;
  y: number;
  w: number;
  h: number;
  selected: boolean;
}

const GRID_DIVISIONS = 6;

export default class SceneGridPickerApp extends DDBAppV2 {

  scene: Scene;
  step: "select" | "review" = "select";
  selected = new Set<string>();
  imageDimensions: { x: number; y: number } = { x: 0, y: 0 };
  imageSource: ISceneGridImageSource | null = null;
  imageUrl = "";
  loading = false;
  run: ISceneGridDetectionRun | null = null;
  selectedCandidateKey: string | null = null;
  usedRoi: { x: number; y: number; w: number; h: number } | null = null;
  usedComponents: { x: number; y: number; w: number; h: number }[] = [];
  // Foundry cells per detected painted square. Defaults to the global
  // double-scale setting (1 or 2); user can pick 1, 2, 3, or 4 in the
  // dropdown for per-detection control. For DDB-imported scenes we instead
  // back-calculate from the stored tokenScale + current grid.size after
  // the image dimensions are probed (see _inferMultiplierFromScene).
  multiplier: number = getMapScaleMultiplier();
  // Set true when the user explicitly picks a numeric value from the
  // dropdown. While true, both inference paths bail out so the user's
  // override persists across re-renders and re-detections. Cleared when
  // they pick "Auto".
  private _multiplierUserSet = false;
  // Grid-hint mode: when true the select-step image accepts a click-drag
  // that draws a rectangle the user asserts covers 3 x 3 painted cells.
  // We derive cellPx from the rectangle and either feed it to detection
  // as a tight prior (default) or apply it directly (bypass detection)
  // when `hintDirectApply` is on.
  hintMode = false;
  hintRect: { x: number; y: number; w: number; h: number } | null = null;
  hintDirectApply = false;
  private _hintDragStart: { x: number; y: number } | null = null;
  private _hintDragging = false;
  // Image SVG viewBox state. null means "fit the full image". Wheel zooms
  // toward the cursor; shift-drag pans. Persists across re-renders so the
  // user can zoom in, draw a hint, and click Use Hint without losing view.
  viewBox: { x: number; y: number; w: number; h: number } | null = null;
  // Same idea for the review-step preview pane. Independent zoom so the
  // user can pan around the candidate's grid overlay without losing their
  // place when they switch between candidates.
  previewViewBox: { x: number; y: number; w: number; h: number } | null = null;

  static DEFAULT_OPTIONS = {
    id: "ddb-scene-grid-picker",
    classes: ["dnd5e2", "ddb-grid-picker-app"],
    window: {
      title: "Detect Grid",
      icon: "fas fa-border-all",
      resizable: true,
      minimizable: true,
    },
    actions: {
      toggleCell: SceneGridPickerApp.toggleCell,
      clearSelection: SceneGridPickerApp.clearSelection,
      selectAll: SceneGridPickerApp.selectAll,
      runDetection: SceneGridPickerApp.runDetection,
      goBack: SceneGridPickerApp.goBack,
      selectCandidate: SceneGridPickerApp.selectCandidate,
      applyChoice: SceneGridPickerApp.applyChoice,
      toggleHintMode: SceneGridPickerApp.toggleHintMode,
      redrawHint: SceneGridPickerApp.redrawHint,
      useHint: SceneGridPickerApp.useHint,
      zoomIn: SceneGridPickerApp.zoomIn,
      zoomOut: SceneGridPickerApp.zoomOut,
      zoomFit: SceneGridPickerApp.zoomFit,
      zoomInPreview: SceneGridPickerApp.zoomInPreview,
      zoomOutPreview: SceneGridPickerApp.zoomOutPreview,
      zoomFitPreview: SceneGridPickerApp.zoomFitPreview,
      cancel: SceneGridPickerApp.cancel,
    },
    position: { width: 900, height: 720 },
  };

  static PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/scene-grid-picker/picker.hbs",
    },
  };

  constructor(scene: Scene, imageSource?: ISceneGridImageSource | null) {
    super();
    this.scene = scene;
    this.imageSource = imageSource ?? resolveSceneGridImageSource(scene);
    this.imageUrl = this.imageSource?.src ?? "";
  }

  _getTabs() {
    return {};
  }

  // read the image dimensions so the SVG viewBox is
  // correct before the first render.
  async _prepareImage() {
    if (this.imageDimensions.x > 0) return;
    if (!this.imageUrl) return;
    try {
      const response = await fetch(this.imageUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      this.imageDimensions = { x: bitmap.width, y: bitmap.height };
      if (typeof bitmap.close === "function") bitmap.close();
    } catch (error) {
      logger.warn(`SceneGridPicker: image probe failed: ${(error as Error).message}`);
      this.imageDimensions = { x: 1024, y: 1024 };
    }
  }

  _buildCells(): ICell[] {
    const out: ICell[] = [];
    const cellW = this.imageDimensions.x / GRID_DIVISIONS;
    const cellH = this.imageDimensions.y / GRID_DIVISIONS;
    for (let j = 0; j < GRID_DIVISIONS; j++) {
      for (let i = 0; i < GRID_DIVISIONS; i++) {
        const id = `${i},${j}`;
        out.push({
          id,
          i,
          j,
          x: i * cellW,
          y: j * cellH,
          w: cellW,
          h: cellH,
          selected: this.selected.has(id),
        });
      }
    }
    return out;
  }

  // Bounding rect of the entire selection. Used for the review-step preview;
  // detection itself runs per connected component (see _selectionComponents).
  _selectionRect(): { x: number; y: number; w: number; h: number } | null {
    if (this.selected.size === 0) return null;
    const cellW = this.imageDimensions.x / GRID_DIVISIONS;
    const cellH = this.imageDimensions.y / GRID_DIVISIONS;
    let minI = GRID_DIVISIONS, minJ = GRID_DIVISIONS, maxI = -1, maxJ = -1;
    for (const id of this.selected) {
      const [i, j] = id.split(",").map(Number);
      if (i < minI) minI = i;
      if (j < minJ) minJ = j;
      if (i > maxI) maxI = i;
      if (j > maxJ) maxJ = j;
    }
    return {
      x: minI * cellW,
      y: minJ * cellH,
      w: (maxI - minI + 1) * cellW,
      h: (maxJ - minJ + 1) * cellH,
    };
  }

  // Group selected cells into 4-connected components and return each as a
  // pixel-space bounding rect. Lets the user pick a few disjoint sample
  // patches and have detection run on each independently before merging.
  _selectionComponents(): { x: number; y: number; w: number; h: number }[] {
    if (this.selected.size === 0) return [];
    const cellW = this.imageDimensions.x / GRID_DIVISIONS;
    const cellH = this.imageDimensions.y / GRID_DIVISIONS;
    const remaining = new Set(this.selected);
    const components: { x: number; y: number; w: number; h: number }[] = [];
    while (remaining.size > 0) {
      const seed = remaining.values().next().value as string;
      remaining.delete(seed);
      const queue: string[] = [seed];
      let minI = GRID_DIVISIONS, minJ = GRID_DIVISIONS, maxI = -1, maxJ = -1;
      while (queue.length) {
        const id = queue.shift() as string;
        const [i, j] = id.split(",").map(Number);
        if (i < minI) minI = i;
        if (j < minJ) minJ = j;
        if (i > maxI) maxI = i;
        if (j > maxJ) maxJ = j;
        const neighbours = [
          `${i - 1},${j}`, `${i + 1},${j}`, `${i},${j - 1}`, `${i},${j + 1}`,
        ];
        for (const n of neighbours) {
          if (remaining.has(n)) {
            remaining.delete(n);
            queue.push(n);
          }
        }
      }
      components.push({
        x: minI * cellW,
        y: minJ * cellH,
        w: (maxI - minI + 1) * cellW,
        h: (maxJ - minJ + 1) * cellH,
      });
    }
    return components;
  }

  // Build SVG line segments for the chosen candidate, drawn over the
  // preview region. We draw at `paintedSize / multiplier` to mirror the
  // Foundry grid the user will get (e.g. multiplier=2 -> subdivision lines
  // at half the painted period). The painted-square boundaries are still
  // present in the same set of lines because they're integer multiples of
  // the subdivision period from the same offset.
  _buildPreviewLines(rect: { x: number; y: number; w: number; h: number }, candidate: ICandidateChoice | null) {
    if (!candidate) return [];
    const painted = candidate.entry.paintedSize;
    if (!(painted > 0)) return [];
    const period = painted / Math.max(1, this.multiplier);
    if (!(period > 0)) return [];
    const phaseX = ((candidate.entry.rawPaintedOffsetX - rect.x) % period + period) % period;
    const phaseY = ((candidate.entry.rawPaintedOffsetY - rect.y) % period + period) % period;
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let x = phaseX; x <= rect.w + 0.5; x += period) {
      lines.push({ x1: x, y1: 0, x2: x, y2: rect.h });
    }
    for (let y = phaseY; y <= rect.h + 0.5; y += period) {
      lines.push({ x1: 0, y1: y, x2: rect.w, y2: y });
    }
    return lines;
  }

  // Open the picker on the multiplier the scene was last set up with.
  // Tries three signals in priority order:
  //   1. Explicit `gridMultiplier` flag (written by both DDB import and
  //      picker apply going forward).
  //   2. Stored detection result on the scene flag (`gridDetection.size`
  //      is the painted period; ratio with scene.grid.size gives the
  //      multiplier). Covers legacy scenes set up before the flag.
  //   3. Global getMapScaleMultiplier() setting (the existing default).
  // Subsequent user picks override anything inferred here.
  _inferMultiplierFromScene() {
    if (this._multiplierUserSet) {
      logger.info(`SceneGridPicker: _inferMultiplierFromScene bail (user override, multiplier=${this.multiplier})`);
      return;
    }
    if (this.run?.detection) {
      logger.info(`SceneGridPicker: _inferMultiplierFromScene bail (have live detection, deferring to _inferMultiplierFromDetection)`);
      return;
    }
    const flags = this.scene.flags?.["ddbimporter"] ?? {};
    const flagged = (typeof this.scene.getFlag === "function"
      ? foundry.utils.getProperty(this.scene, "flags.ddbimporter.gridMultiplier")
      : null) ?? flags.gridMultiplier;
    logger.info(`SceneGridPicker: _inferMultiplierFromScene open-time flags`, {
      gridMultiplier: flagged,
      hasStoredDetection: !!flags.gridDetection,
      storedDetectionSize: flags.gridDetection?.size,
      sceneGridSize: this.scene.grid?.size,
      flagKeys: Object.keys(flags),
    });
    if (typeof flagged === "number" && flagged >= 1 && flagged <= 4) {
      this.multiplier = Math.round(flagged);
      logger.info(`SceneGridPicker: multiplier from gridMultiplier flag = ${this.multiplier}`);
      return;
    }
    const storedDetection:IGridDetectionResult = (typeof this.scene.getFlag === "function"
      ? foundry.utils.getProperty(this.scene, "flags.ddbimporter.gridDetection") as IGridDetectionResult
      : null) ?? flags.gridDetection as IGridDetectionResult;
    const storedPainted = typeof storedDetection?.size === "number" ? storedDetection.size : null;
    const existingGridSize = this.scene.grid?.size;
    if (
      storedPainted !== null && storedPainted > 0
      && typeof existingGridSize === "number" && existingGridSize > 0
    ) {
      const ratio = storedPainted / existingGridSize;
      const rounded = Math.round(ratio);
      const accepted = rounded >= 1 && rounded <= 4 && Math.abs(ratio - rounded) < 0.15;
      logger.info(`SceneGridPicker: open-time storedPainted/gridSize ratio=${ratio.toFixed(3)} rounded=${rounded} accepted=${accepted}`);
      if (accepted) this.multiplier = rounded;
    } else {
      logger.info(`SceneGridPicker: open-time fallback skipped (no usable storedPainted/gridSize)`);
    }
  }

  // After detection runs, back-calculate the multiplier the scene was set
  // up with using painted period / current grid.size. This handles legacy
  // scenes (DDB imports + picker applies before gridMultiplier was stamped)
  // where the explicit flag is missing.
  _inferMultiplierFromDetection() {
    if (this._multiplierUserSet) {
      logger.info(`SceneGridPicker: _inferMultiplierFromDetection bail (user override, multiplier=${this.multiplier})`);
      return;
    }
    const detection = this.run?.detection;
    const painted = detection?.size;
    const existingGridSize = this.scene.grid?.size;
    logger.info(`SceneGridPicker: _inferMultiplierFromDetection entry`, {
      painted,
      existingGridSize,
      detected: detection?.detected,
      confidence: detection?.confidence,
      templateSize: detection?.templateSize,
      priorSize: detection?.priorSize,
      currentMultiplier: this.multiplier,
      recommendedKey: this.run?.recommendedKey,
    });
    // Dump every candidate as a flat string so it's visible in the console
    // without expanding objects.
    if (this.run?.candidateList) {
      for (const c of this.run.candidateList) {
        logger.info(
          `SceneGridPicker:   candidate ${c.key.padEnd(20)} `
          + `painted=${c.entry.paintedSize?.toFixed?.(2) ?? c.entry.paintedSize} `
          + `gridSize=${c.entry.gridSize} `
          + `offset=(${c.entry.offsetX}, ${c.entry.offsetY}) `
          + `sceneScale=${c.entry.sceneScale?.toFixed?.(4) ?? c.entry.sceneScale}`,
        );
      }
    }
    if (!(typeof painted === "number" && painted > 0)) {
      logger.info(`SceneGridPicker: _inferMultiplierFromDetection bail (no usable painted size)`);
      return;
    }

    // Try ratio against multiple denominators in priority order. priorSize
    // (tokenScale * imageWidth - DDB's 5-ft cell hint) is often cleaner than
    // scene.grid.size because grid.size may have been rounded during a
    // previous import. Templates also work as a fallback - templateSize
    // sometimes locks onto the same 5-ft cell as the prior.
    const candidates: { name: string; denominator: number }[] = [];
    if (typeof detection?.priorSize === "number" && detection.priorSize > 0) {
      candidates.push({ name: "priorSize", denominator: detection.priorSize });
    }
    if (typeof existingGridSize === "number" && existingGridSize > 0) {
      candidates.push({ name: "grid.size", denominator: existingGridSize });
    }
    if (typeof detection?.templateSize === "number" && detection.templateSize > 0) {
      candidates.push({ name: "templateSize", denominator: detection.templateSize });
    }

    let chosen: { name: string; ratio: number; rounded: number } | null = null;
    for (const c of candidates) {
      const ratio = painted / c.denominator;
      const rounded = Math.round(ratio);
      const accepted = rounded >= 1 && rounded <= 4 && Math.abs(ratio - rounded) <= 0.25;
      logger.info(
        `SceneGridPicker: ratio vs ${c.name}=${c.denominator.toFixed(2)} ratio=${ratio.toFixed(3)} rounded=${rounded} accepted=${accepted}`,
      );
      if (accepted) {
        chosen = { name: c.name, ratio, rounded };
        break;
      }
    }

    if (chosen && chosen.rounded !== this.multiplier) {
      logger.info(`SceneGridPicker: post-detection switching multiplier ${this.multiplier} -> ${chosen.rounded} (via ${chosen.name})`);
      this.multiplier = chosen.rounded;
      if (this.run?.detection) {
        this.run = rebuildDetectionRun(
          this.scene,
          this.run.detection,
          this.run.imageDimensions,
          this.multiplier,
          this.run.imageSource ?? this.imageSource ?? undefined,
        );
        this.selectedCandidateKey = this.run.recommendedKey ?? null;
      }
    }
  }

  async _prepareContext(_options): Promise<any> {
    await this._prepareImage();
    this._inferMultiplierFromScene();

    const cells = this._buildCells();
    // Build the dropdown with an "Auto" entry on top. When auto is active
    // the label shows the inferred value in parentheses so the user can see
    // what was picked. Numeric entries are selected only when the user has
    // explicitly overridden.
    logger.info(`SceneGridPicker: _prepareContext rebuild dropdown multiplier=${this.multiplier} userSet=${this._multiplierUserSet} hasRun=${!!this.run}`);
    const autoLabel = this._multiplierUserSet
      ? "Auto"
      : `Auto (${this.multiplier}×${this.multiplier})`;
    const multiplierOptions: { value: string; label: string; selected: boolean }[] = [
      { value: "auto", label: autoLabel, selected: !this._multiplierUserSet },
    ];
    for (const n of [1, 2, 3, 4]) {
      multiplierOptions.push({
        value: String(n),
        label: n === 1 ? "1×1" : `${n}×${n}`,
        selected: this._multiplierUserSet && n === this.multiplier,
      });
    }
    // Grid-hint rendering: the rect + 3x3 sub-grid lines + corner resize
    // handles are all attached to the SVG when in hint mode. We render the
    // rect via Handlebars (so its initial size honours `this.hintRect`)
    // but the sub-grid lines and handles are owned by JS so we can update
    // them directly during drag without forcing a full re-render per
    // pointermove.
    let hintCellPx: number | null = null;
    let hintHandles: { corner: string; x: number; y: number; size: number }[] = [];
    if (this.hintRect && this.hintRect.w > 0 && this.hintRect.h > 0) {
      hintCellPx = (this.hintRect.w / 3 + this.hintRect.h / 3) / 2;
      const r = this.hintRect;
      const vbForHandle = this.viewBox ?? { x: 0, y: 0, w: this.imageDimensions.x, h: this.imageDimensions.y };
      const handleSize = Math.max(6, Math.min(vbForHandle.w, vbForHandle.h) * 0.015);
      const half = handleSize / 2;
      hintHandles = [
        { corner: "tl", x: r.x - half, y: r.y - half, size: handleSize },
        { corner: "tr", x: r.x + r.w - half, y: r.y - half, size: handleSize },
        { corner: "bl", x: r.x - half, y: r.y + r.h - half, size: handleSize },
        { corner: "br", x: r.x + r.w - half, y: r.y + r.h - half, size: handleSize },
      ];
    }

    const ctx: any = {
      sceneName: this.scene.name ?? "Scene",
      step: { select: this.step === "select", review: this.step === "review" },
      imageDimensions: this.imageDimensions,
      imageUrl: this.imageUrl,
      cells,
      selectedCount: this.selected.size,
      cellCount: cells.length,
      loading: this.loading,
      multiplier: this.multiplier,
      multiplierOptions,
      multiplierIsAuto: !this._multiplierUserSet,
      hintMode: this.hintMode,
      hintRect: this.hintRect,
      hintCellPxLabel: hintCellPx !== null ? hintCellPx.toFixed(1) : null,
      hintHandles,
      hintDirectApply: this.hintDirectApply,
      hintHasRect: !!this.hintRect,
      viewBox: this._currentViewBox(),
      zoomedIn: !!this.viewBox,
    };

    if (this.step === "review" && this.run) {
      const list = this.run.candidateList;
      const recommendedKey = this.run.recommendedKey;
      const selectedKey = this.selectedCandidateKey ?? recommendedKey ?? list[0]?.key ?? null;
      const selectedChoice = list.find((c) => c.key === selectedKey) ?? null;
      const previewRect = this.usedRoi ?? { x: 0, y: 0, w: this.imageDimensions.x, h: this.imageDimensions.y };
      ctx.candidateList = list.map((c) => ({
        ...c,
        scaleStr: c.entry.sceneScale.toFixed(4),
        recommended: c.key === recommendedKey,
        selected: c.key === selectedKey,
      }));
      ctx.selectedLabel = selectedChoice?.label ?? "(none)";
      ctx.usedRoi = !!this.usedRoi;
      ctx.regionCount = this.usedComponents.length;
      ctx.multiRegion = this.usedComponents.length > 1;
      ctx.confidence = this.run.detection?.detected
        ? (this.run.detection.confidence ?? 0).toFixed(3)
        : "n/a";
      ctx.previewDims = { x: previewRect.w, y: previewRect.h };
      ctx.previewImageUrl = await this._buildPreviewImageUrl(previewRect);
      ctx.previewLines = this._buildPreviewLines(previewRect, selectedChoice);
      ctx.previewViewBox = this._currentPreviewViewBox();
      ctx.previewZoomedIn = !!this.previewViewBox;
    }

    return ctx;
  }

  // Render the preview image. When a selection exists we crop client-side
  // with a canvas and emit a data URL so the SVG can show just the focus
  // region. Without a selection we reuse the original image URL.
  private _previewCache: { rectKey: string; url: string } | null = null;
  async _buildPreviewImageUrl(rect: { x: number; y: number; w: number; h: number }): Promise<string> {
    const key = `${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.w)},${Math.round(rect.h)}`;
    if (this._previewCache && this._previewCache.rectKey === key) return this._previewCache.url;
    if (!this.usedRoi) {
      // Full-image preview - reuse the original URL.
      this._previewCache = { rectKey: key, url: this.imageUrl };
      return this.imageUrl;
    }
    try {
      const response = await fetch(this.imageUrl);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = (typeof OffscreenCanvas !== "undefined")
        ? new OffscreenCanvas(rect.w, rect.h)
        : Object.assign(document.createElement("canvas"), { width: rect.w, height: rect.h });
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("preview: no 2d context");
      (ctx as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D).drawImage(
        bitmap, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h,
      );
      if (typeof bitmap.close === "function") bitmap.close();
      let url: string;
      if (canvas instanceof OffscreenCanvas) {
        const out = await canvas.convertToBlob({ type: "image/png" });
        url = URL.createObjectURL(out);
      } else {
        url = (canvas as HTMLCanvasElement).toDataURL("image/png");
      }
      // Free the previous object URL when we replace it.
      if (this._previewCache?.url?.startsWith("blob:")) URL.revokeObjectURL(this._previewCache.url);
      this._previewCache = { rectKey: key, url };
      return url;
    } catch (error) {
      logger.warn(`SceneGridPicker: preview crop failed: ${(error as Error).message}`);
      return this.imageUrl;
    }
  }

  async _onClose(options?: any) {
    if (this._previewCache?.url?.startsWith("blob:")) URL.revokeObjectURL(this._previewCache.url);
    this._previewCache = null;
    const fn = (super._onClose as ((opts?: any) => Promise<void>) | undefined);
    if (fn) return fn.call(this, options);
  }

  // Action handlers - all bound via DEFAULT_OPTIONS.actions.

  static toggleCell(this: SceneGridPickerApp, _event, target: HTMLElement) {
    const id = target?.dataset?.cell;
    if (!id) return;
    if (this.selected.has(id)) this.selected.delete(id);
    else this.selected.add(id);
    this.render();
  }

  static clearSelection(this: SceneGridPickerApp) {
    this.selected.clear();
    this.render();
  }

  static selectAll(this: SceneGridPickerApp) {
    for (let j = 0; j < GRID_DIVISIONS; j++) {
      for (let i = 0; i < GRID_DIVISIONS; i++) this.selected.add(`${i},${j}`);
    }
    this.render();
  }

  static async runDetection(this: SceneGridPickerApp) {
    if (this.loading) return;
    this.loading = true;
    await this.render();
    try {
      const components = this._selectionComponents();
      const previewRect = this._selectionRect();
      this.usedRoi = previewRect;
      this.usedComponents = components;
      const baseOptions: any = { imageSource: this.imageSource };
      if (components.length === 1) baseOptions.roi = components[0];
      else if (components.length > 1) baseOptions.rois = components;

      if (this._multiplierUserSet) {
        // Manual override - just run with the user's chosen multiplier.
        const detectOptions = { ...baseOptions, multiplier: this.multiplier, searchPaddingFraction: 3.0 };
        this.run = await runDetectionForScene(this.scene, detectOptions);
        logger.info(`SceneGridPicker: detection complete (manual multiplier=${this.multiplier})`, {
          detected: this.run.detection?.detected,
          paintedSize: this.run.detection?.size,
          confidence: this.run.detection?.confidence,
          templateSize: this.run.detection?.templateSize,
          priorSize: this.run.detection?.priorSize,
        });
      } else {
        // Auto mode - try 1x/2x/3x/4x in parallel and pick the most coherent
        // result. Tight padding per pass keeps each detection focused on
        // its anchor's neighbourhood; cross-anchor scoring then picks the
        // multiplier whose template + autocorrelation fit best together.
        const passes = await Promise.all([1, 2, 3, 4].map(async (m) => {
          const opts = { ...baseOptions, multiplier: m, searchPaddingFraction: 0.4 };
          const run = await runDetectionForScene(this.scene, opts);
          return { multiplier: m, run };
        }));
        let best = passes[0];
        let bestScore = -Infinity;
        for (const p of passes) {
          const d = p.run.detection;
          const tplSize = typeof d?.templateSize === "number" ? d.templateSize : null;
          const tplScore = typeof d?.templateScore === "number" ? d.templateScore : 0;
          const confidence = Math.max(0, Math.min(1, d?.confidence ?? 0));
          const detectedBonus = d?.detected ? 1 : 0.4;
          // Coherence: how close did the template's found period land to the
          // anchor for this pass. priorSize on the detection is the anchor
          // (tokenScale * multiplier * width).
          const anchor = typeof d?.priorSize === "number" ? d.priorSize : null;
          let coherence = 0.5;
          if (anchor && anchor > 0 && tplSize && tplSize > 0) {
            coherence = 1 - Math.min(1, Math.abs(tplSize - anchor) / anchor);
          }
          // Score blends template fit (its absolute value can dominate, so
          // we use log to dampen) with coherence and confidence.
          const tplScoreLog = tplScore > 0 ? Math.log10(1 + tplScore) : 0;
          const score = tplScoreLog * coherence * (0.4 + 0.6 * Math.max(confidence, detectedBonus * 0.5));
          logger.info(
            `SceneGridPicker: multi-anchor m=${p.multiplier} `
            + `painted=${d?.size?.toFixed?.(2)} `
            + `tplSize=${tplSize?.toFixed?.(2)} tplScore=${tplScore.toFixed(2)} `
            + `confidence=${confidence.toFixed(3)} detected=${d?.detected} `
            + `coherence=${coherence.toFixed(3)} score=${score.toFixed(3)}`,
          );
          if (score > bestScore) {
            best = p;
            bestScore = score;
          }
        }
        this.multiplier = best.multiplier;
        this.run = best.run;
        logger.info(`SceneGridPicker: multi-anchor winner multiplier=${best.multiplier}`);
      }

      this._inferMultiplierFromDetection();
      this.selectedCandidateKey = this.run.recommendedKey ?? null;
      this.step = "review";
      this._previewCache = null;
    } catch (error) {
      const msg = (error as Error).message;
      logger.error(`SceneGridPicker: detection failed: ${msg}`, error);
      ui.notifications?.error(`Grid detection failed: ${msg}`);
    } finally {
      this.loading = false;
      await this.render();
    }
  }

  static goBack(this: SceneGridPickerApp) {
    this.step = "select";
    this.render();
  }

  static selectCandidate(this: SceneGridPickerApp, _event, target: HTMLElement) {
    const key = target?.dataset?.candidate;
    if (!key) return;
    this.selectedCandidateKey = key;
    this._previewCache = null; // grid lines change, but image crop may stay; clear to be safe
    this.render();
  }

  static async applyChoice(this: SceneGridPickerApp) {
    if (!this.run) return;
    const key = this.selectedCandidateKey ?? this.run.recommendedKey;
    if (!key) return;
    const choice = this.run.candidateList.find((c) => c.key === key) ?? null;
    if (!choice) {
      ui.notifications?.warn(`Candidate "${key}" not found.`);
      return;
    }
    try {
      await applyChoiceToScene(this.scene, this.run, choice);
      ui.notifications?.info(
        `Grid updated on "${this.scene.name}" (size ${choice.entry.gridSize}px from ${choice.label}).`,
      );
      this.close();
    } catch (error) {
      const msg = (error as Error).message;
      logger.error(`SceneGridPicker: apply failed: ${msg}`, error);
      ui.notifications?.error(`Failed to update scene: ${msg}`);
    }
  }

  static cancel(this: SceneGridPickerApp) {
    this.close();
  }

  // Toggle the grid-hint drawing overlay. Entering hint mode clears any
  // existing cell selection (the two interaction modes share the same
  // image surface). Leaving hint mode discards the drawn rect.
  // ------------------------------------------------------------------
  // Zoom / pan helpers
  // ------------------------------------------------------------------

  _currentViewBox(): { x: number; y: number; w: number; h: number } {
    if (this.viewBox) return this.viewBox;
    return { x: 0, y: 0, w: this.imageDimensions.x, h: this.imageDimensions.y };
  }

  _clampViewBoxToDims(
    vb: { x: number; y: number; w: number; h: number },
    dims: { x: number; y: number },
  ) {
    const imgW = dims.x;
    const imgH = dims.y;
    if (imgW <= 0 || imgH <= 0) return vb;
    // Don't zoom in past 100px on the short side (image would pixelate to
    // uselessness) and don't zoom out past fit.
    const minDim = 100;
    let w = Math.min(imgW, Math.max(minDim, vb.w));
    let h = Math.min(imgH, Math.max(minDim, vb.h));
    const targetAspect = imgW / imgH;
    if (w / h > targetAspect) w = h * targetAspect;
    else h = w / targetAspect;
    const x = Math.max(0, Math.min(imgW - w, vb.x));
    const y = Math.max(0, Math.min(imgH - h, vb.y));
    return { x, y, w, h };
  }

  _clampViewBox(vb: { x: number; y: number; w: number; h: number }) {
    return this._clampViewBoxToDims(vb, this.imageDimensions);
  }

  // Preview pane dimensions match the selection ROI when one was used,
  // otherwise the full image. Mirror's _prepareContext's previewRect.
  _previewDims(): { x: number; y: number } {
    if (this.usedRoi) return { x: this.usedRoi.w, y: this.usedRoi.h };
    return this.imageDimensions;
  }

  _currentPreviewViewBox(): { x: number; y: number; w: number; h: number } {
    if (this.previewViewBox) return this.previewViewBox;
    const dims = this._previewDims();
    return { x: 0, y: 0, w: dims.x, h: dims.y };
  }

  _clampPreviewViewBox(vb: { x: number; y: number; w: number; h: number }) {
    return this._clampViewBoxToDims(vb, this._previewDims());
  }

  _zoomTowards(factor: number, focalX: number, focalY: number) {
    const vb = this._currentViewBox();
    const newW = vb.w / factor;
    const newH = vb.h / factor;
    const relX = vb.w > 0 ? (focalX - vb.x) / vb.w : 0.5;
    const relY = vb.h > 0 ? (focalY - vb.y) / vb.h : 0.5;
    const newX = focalX - relX * newW;
    const newY = focalY - relY * newH;
    this.viewBox = this._clampViewBox({ x: newX, y: newY, w: newW, h: newH });
    if (this.viewBox.w >= this.imageDimensions.x && this.viewBox.h >= this.imageDimensions.y) {
      this.viewBox = null;
    }
    this.render();
  }

  _zoomTowardsPreview(factor: number, focalX: number, focalY: number) {
    const vb = this._currentPreviewViewBox();
    const newW = vb.w / factor;
    const newH = vb.h / factor;
    const relX = vb.w > 0 ? (focalX - vb.x) / vb.w : 0.5;
    const relY = vb.h > 0 ? (focalY - vb.y) / vb.h : 0.5;
    const newX = focalX - relX * newW;
    const newY = focalY - relY * newH;
    this.previewViewBox = this._clampPreviewViewBox({ x: newX, y: newY, w: newW, h: newH });
    const dims = this._previewDims();
    if (this.previewViewBox.w >= dims.x && this.previewViewBox.h >= dims.y) {
      this.previewViewBox = null;
    }
    this.render();
  }

  static zoomIn(this: SceneGridPickerApp) {
    const vb = this._currentViewBox();
    this._zoomTowards(1.5, vb.x + vb.w / 2, vb.y + vb.h / 2);
  }

  static zoomOut(this: SceneGridPickerApp) {
    const vb = this._currentViewBox();
    this._zoomTowards(1 / 1.5, vb.x + vb.w / 2, vb.y + vb.h / 2);
  }

  static zoomFit(this: SceneGridPickerApp) {
    this.viewBox = null;
    this.render();
  }

  static zoomInPreview(this: SceneGridPickerApp) {
    const vb = this._currentPreviewViewBox();
    this._zoomTowardsPreview(1.5, vb.x + vb.w / 2, vb.y + vb.h / 2);
  }

  static zoomOutPreview(this: SceneGridPickerApp) {
    const vb = this._currentPreviewViewBox();
    this._zoomTowardsPreview(1 / 1.5, vb.x + vb.w / 2, vb.y + vb.h / 2);
  }

  static zoomFitPreview(this: SceneGridPickerApp) {
    this.previewViewBox = null;
    this.render();
  }

  static toggleHintMode(this: SceneGridPickerApp) {
    this.hintMode = !this.hintMode;
    if (this.hintMode) {
      this.selected.clear();
    } else {
      this.hintRect = null;
    }
    this.render();
  }

  static redrawHint(this: SceneGridPickerApp) {
    this.hintRect = null;
    this.render();
  }

  static async useHint(this: SceneGridPickerApp) {
    if (!this.hintRect) {
      ui.notifications?.warn("Draw a 3x3 grid hint first.");
      return;
    }
    if (this.loading) return;
    // Derive painted period from the rect. The user is asserting that the
    // rect spans 3 cells in both dimensions, so cellPx = rect.w / 3
    // (averaged with rect.h / 3 to force square cells).
    const cellPxX = this.hintRect.w / 3;
    const cellPxY = this.hintRect.h / 3;
    const cellPx = (cellPxX + cellPxY) / 2;
    if (!(cellPx > 4)) {
      ui.notifications?.warn("Grid hint is too small to derive a cell size.");
      return;
    }

    this.loading = true;
    await this.render();
    try {
      if (this.hintDirectApply) {
        await this._applyHintDirectly(cellPx);
      } else {
        await this._runDetectionWithHint(cellPx);
      }
    } catch (error) {
      const msg = (error as Error).message;
      logger.error(`SceneGridPicker: hint flow failed: ${msg}`, error);
      ui.notifications?.error(`Grid hint failed: ${msg}`);
    } finally {
      this.loading = false;
      await this.render();
    }
  }

  // Hint workflow, option 2: feed the user's cell size to detection as a
  // tight prior. Detection still runs (so template / autocorrelation can
  // refine the size within +/-5% of the hint), but the OFFSETS are then
  // overridden with values derived directly from the hint rect - the user
  // drew the corner on actual grid lines, so we trust their phase even if
  // the detector's template scan landed somewhere slightly different.
  async _runDetectionWithHint(cellPx: number) {
    if (!this.hintRect) return;
    this.run = await runDetectionForScene(this.scene, {
      multiplier: this.multiplier,
      expectedCellPx: cellPx,
      searchPaddingFraction: 0.05,
      imageSource: this.imageSource,
    });

    const det = this.run.detection;
    if (det) {
      const wrap = (v: number, p: number) => (p > 0 ? ((v % p) + p) % p : v);
      const hintX = this.hintRect.x;
      const hintY = this.hintRect.y;
      if (det.size > 0) {
        det.offsetX = wrap(hintX, det.size);
        det.offsetY = wrap(hintY, det.size);
      }
      if (typeof det.templateSize === "number" && det.templateSize > 0) {
        det.templateOffsetX = wrap(hintX, det.templateSize);
        det.templateOffsetY = wrap(hintY, det.templateSize);
      }
      if (typeof det.priorSize === "number" && det.priorSize > 0) {
        det.priorOffsetX = wrap(hintX, det.priorSize);
        det.priorOffsetY = wrap(hintY, det.priorSize);
      }
      // Re-derive the run so the candidate list and recommended choice
      // reflect the corrected offsets (sceneScale * offset shows in the
      // candidates table, and applyChoiceToScene reads from the choice).
      this.run = rebuildDetectionRun(
        this.scene,
        det,
        this.run.imageDimensions,
        this.multiplier,
        this.run.imageSource ?? this.imageSource ?? undefined,
      );
      logger.info(
        `SceneGridPicker: hint applied offset=(${det.offsetX.toFixed(1)}, ${det.offsetY.toFixed(1)}) size=${det.size.toFixed(2)} (refined from hint ${cellPx.toFixed(2)})`,
      );
    }

    this._inferMultiplierFromDetection();
    this.selectedCandidateKey = this.run.recommendedKey ?? null;
    this.usedRoi = null;
    this.usedComponents = [];
    this.step = "review";
    this._previewCache = null;
  }

  // Hint workflow, option 1: skip detection entirely and synthesise a
  // detection result directly from the hint rect. Used when even tightly
  // constrained detection lands somewhere wrong (very low contrast maps,
  // dense decorative line art, etc).
  async _applyHintDirectly(cellPx: number) {
    if (!this.hintRect) return;
    if (!(this.imageDimensions.x > 0)) return;
    // Offsets within the painted period - the user's rect's top-left
    // should sit on a grid line, so the rect.x mod cellPx tells us how
    // far the first grid line is from the image's left edge.
    const wrap = (v: number, period: number) => ((v % period) + period) % period;
    const offsetXImg = wrap(this.hintRect.x, cellPx);
    const offsetYImg = wrap(this.hintRect.y, cellPx);
    const synthetic: IGridDetectionResult = {
      detected: true,
      size: cellPx,
      offsetX: offsetXImg,
      offsetY: offsetYImg,
      confidence: 1,
      priorSize: cellPx,
      priorOffsetX: offsetXImg,
      priorOffsetY: offsetYImg,
      templateSize: cellPx,
      templateOffsetX: offsetXImg,
      templateOffsetY: offsetYImg,
      templateScore: 1,
    };
    this.run = rebuildDetectionRun(
      this.scene,
      synthetic,
      this.imageDimensions,
      this.multiplier,
      this.imageSource ?? undefined,
    );
    this.selectedCandidateKey = this.run.recommendedKey ?? null;
    this.usedRoi = null;
    this.usedComponents = [];
    this.step = "review";
    this._previewCache = null;
    logger.info(
      `SceneGridPicker: hint direct apply cellPx=${cellPx.toFixed(2)} offset=(${offsetXImg.toFixed(1)}, ${offsetYImg.toFixed(1)})`,
    );
  }

  // Apply a new multiplier value picked from the dropdown. If we already
  // have a cached detection, rebuild the candidate list from it rather than
  // re-running the detector - painted period and offsets are invariant to
  // multiplier; only how the resolver projects them onto the Foundry grid
  // changes.
  _applyMultiplier(value: string | number) {
    logger.info(`SceneGridPicker: _applyMultiplier called with value=${JSON.stringify(value)} currentMultiplier=${this.multiplier} userSet=${this._multiplierUserSet}`);
    if (value === "auto" || value === "Auto") {
      if (!this._multiplierUserSet) return;
      this._multiplierUserSet = false;
      this._inferMultiplierFromScene();
      if (this.run?.detection) this._inferMultiplierFromDetection();
      this.render();
      return;
    }
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1 || n > 4) return;
    if (n === this.multiplier && this._multiplierUserSet) return;
    this.multiplier = n;
    this._multiplierUserSet = true;
    if (this.run?.detection) {
      this.run = rebuildDetectionRun(
        this.scene,
        this.run.detection,
        this.run.imageDimensions,
        this.multiplier,
        this.run.imageSource ?? this.imageSource ?? undefined,
      );
      // When user picks a subdivision (>1) the resolver's preferred candidate
      // is often the prior-based "tokenScale" entry, which keeps gridSize at
      // priorSize regardless of multiplier - i.e. the override does nothing
      // visible. Prefer the detection-derived candidate (template first,
      // then autocorrelation) so paintedSize / multiplier actually drives
      // the resulting Foundry grid.
      let chosenKey: string | null = null;
      if (n > 1) {
        for (const key of ["template", "autocorrelation"]) {
          if (this.run.candidateList.some((c) => c.key === key)) {
            chosenKey = key;
            break;
          }
        }
      }
      this.selectedCandidateKey = chosenKey ?? this.run.recommendedKey ?? null;
    }
    this.render();
  }

  // ApplicationV2 wires `data-action` attributes to click events, which
  // immediately re-renders when you click a <select> to open its menu and
  // discards your choice. We attach a `change` listener manually instead.
  async _onRender(context, options) {
    await (super._onRender as any)?.(context, options);
    this.element.querySelectorAll<HTMLSelectElement>(".ddb-grid-picker-multiplier-select").forEach((sel) => {
      sel.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLSelectElement;
        this._applyMultiplier(el.value);
      });
    });

    // Direct-apply checkbox for grid hint: toggles option 1 vs option 2 on
    // the next "Use Hint" click.
    this.element.querySelectorAll<HTMLInputElement>(".ddb-grid-picker-hint-direct-toggle").forEach((cb) => {
      cb.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLInputElement;
        this.hintDirectApply = !!el.checked;
      });
    });

    // Grid-hint drag: convert client coords to SVG viewBox coords (image
    // pixels) and update this.hintRect during drag. We update the rect's
    // DOM attributes directly during the drag so each pointermove doesn't
    // trigger a full app re-render - just a final this.render() on
    // pointerup commits the state.
    if (this.hintMode) {
      // Inject the 3x3 sub-grid lines into the hint group and prime them
      // with the current rect (zero-coord and hidden if no rect yet).
      this._updateSubLinesDom(this.hintRect);

      const overlay = this.element.querySelector<SVGRectElement>(".ddb-grid-picker-hint-overlay");
      const liveRect = this.element.querySelector<SVGRectElement>(".ddb-grid-picker-hint-rect");
      if (overlay) {
        overlay.addEventListener("pointerdown", (event) => this._onHintPointerDown(event, overlay, liveRect));
      }

      // Corner-handle resize. When the user grabs a handle, the opposite
      // corner is held fixed and the dragged corner tracks the cursor.
      // The rect's bounding box is recomputed each move so the user can
      // even invert past the opposite corner without breaking the geometry.
      const svgForHandles = this.element.querySelector<SVGSVGElement>(".ddb-grid-picker-canvas .ddb-grid-picker-svg");
      if (svgForHandles && liveRect) {
        this.element.querySelectorAll<SVGRectElement>(".ddb-grid-picker-hint-handle").forEach((handle) => {
          handle.addEventListener("pointerdown", (event) => this._onHandlePointerDown(event, handle, svgForHandles, liveRect));
        });
      }
    }

    // Wheel zoom + shift-drag pan on the review-step preview SVG. Mirrors
    // the select-step image handlers but operates on previewViewBox and
    // _previewDims so the two views zoom independently.
    const previewSvg = this.element.querySelector<SVGSVGElement>(".ddb-grid-picker-preview-svg");
    if (previewSvg) {
      previewSvg.addEventListener("wheel", (event: WheelEvent) => {
        event.preventDefault();
        const focal = this._clientToViewBox(previewSvg, event.clientX, event.clientY);
        const factor = event.deltaY < 0 ? 1.25 : 1 / 1.25;
        this._zoomTowardsPreview(factor, focal.x, focal.y);
      }, { passive: false });

      previewSvg.addEventListener("pointerdown", (event: PointerEvent) => {
        if (!event.shiftKey && event.button !== 1) return;
        event.preventDefault();
        event.stopPropagation();
        previewSvg.setPointerCapture(event.pointerId);
        let lastX = event.clientX;
        let lastY = event.clientY;
        const onMove = (e: PointerEvent) => {
          const dxClient = e.clientX - lastX;
          const dyClient = e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;
          const rect = previewSvg.getBoundingClientRect();
          const vb = this._currentPreviewViewBox();
          if (rect.width <= 0 || rect.height <= 0) return;
          const dxImg = dxClient * (vb.w / rect.width);
          const dyImg = dyClient * (vb.h / rect.height);
          this.previewViewBox = this._clampPreviewViewBox({ x: vb.x - dxImg, y: vb.y - dyImg, w: vb.w, h: vb.h });
          previewSvg.setAttribute("viewBox", `${this.previewViewBox.x} ${this.previewViewBox.y} ${this.previewViewBox.w} ${this.previewViewBox.h}`);
        };
        const onUp = (e: PointerEvent) => {
          try {
            previewSvg.releasePointerCapture(e.pointerId);
          } catch (_e) { /* ignore */ }
          previewSvg.removeEventListener("pointermove", onMove);
          previewSvg.removeEventListener("pointerup", onUp);
          previewSvg.removeEventListener("pointercancel", onUp);
          this.render();
        };
        previewSvg.addEventListener("pointermove", onMove);
        previewSvg.addEventListener("pointerup", onUp);
        previewSvg.addEventListener("pointercancel", onUp);
      });
    }

    // Wheel zoom + shift-drag pan on the image SVG. Works in any mode (cell
    // selection, hint drawing). Shift-drag intercepts pointerdown before
    // the hint overlay sees it.
    const svg = this.element.querySelector<SVGSVGElement>(".ddb-grid-picker-canvas .ddb-grid-picker-svg");
    if (svg && this.imageDimensions.x > 0) {
      svg.addEventListener("wheel", (event: WheelEvent) => {
        event.preventDefault();
        const focal = this._clientToViewBox(svg, event.clientX, event.clientY);
        const factor = event.deltaY < 0 ? 1.25 : 1 / 1.25;
        this._zoomTowards(factor, focal.x, focal.y);
      }, { passive: false });

      svg.addEventListener("pointerdown", (event: PointerEvent) => {
        // Only intercept shift-drag (or middle button) for pan. Other
        // pointerdowns fall through to whatever child handler is bound
        // (cell toggle, hint overlay drag).
        if (!event.shiftKey && event.button !== 1) return;
        event.preventDefault();
        event.stopPropagation();
        svg.setPointerCapture(event.pointerId);
        let lastX = event.clientX;
        let lastY = event.clientY;
        const onMove = (e: PointerEvent) => {
          const dxClient = e.clientX - lastX;
          const dyClient = e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;
          const rect = svg.getBoundingClientRect();
          const vb = this._currentViewBox();
          if (rect.width <= 0 || rect.height <= 0) return;
          const dxImg = dxClient * (vb.w / rect.width);
          const dyImg = dyClient * (vb.h / rect.height);
          this.viewBox = this._clampViewBox({ x: vb.x - dxImg, y: vb.y - dyImg, w: vb.w, h: vb.h });
          svg.setAttribute("viewBox", `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.w} ${this.viewBox.h}`);
        };
        const onUp = (e: PointerEvent) => {
          try {
            svg.releasePointerCapture(e.pointerId);
          } catch (_e) { /* ignore */ }
          svg.removeEventListener("pointermove", onMove);
          svg.removeEventListener("pointerup", onUp);
          svg.removeEventListener("pointercancel", onUp);
          // viewBox already up-to-date in state; render to keep the
          // template attribute in sync with future renders.
          this.render();
        };
        svg.addEventListener("pointermove", onMove);
        svg.addEventListener("pointerup", onUp);
        svg.addEventListener("pointercancel", onUp);
      });
    }
  }

  // Make sure 4 sub-grid line elements exist inside the hint-group, so the
  // drag handler can update them via setAttribute (no full re-render).
  private _ensureSubLines(): SVGLineElement[] {
    if (!this.element) return [];
    const group = this.element.querySelector<SVGGElement>(".ddb-grid-picker-hint-group");
    if (!group) return [];
    const SVG_NS = "http://www.w3.org/2000/svg";
    const lines: SVGLineElement[] = [];
    for (let i = 0; i < 4; i++) {
      let line = group.querySelector<SVGLineElement>(`.ddb-grid-picker-hint-subline[data-idx="${i}"]`);
      if (!line) {
        line = document.createElementNS(SVG_NS, "line") as SVGLineElement;
        line.setAttribute("class", "ddb-grid-picker-hint-subline");
        line.setAttribute("data-idx", String(i));
        group.appendChild(line);
      }
      lines.push(line);
    }
    return lines;
  }

  private _updateSubLinesDom(r: { x: number; y: number; w: number; h: number } | null) {
    const lines = this._ensureSubLines();
    if (!r || r.w <= 0 || r.h <= 0) {
      lines.forEach((l) => l.setAttribute("opacity", "0"));
      return;
    }
    const v1x = r.x + r.w / 3;
    const v2x = r.x + (2 * r.w) / 3;
    const h1y = r.y + r.h / 3;
    const h2y = r.y + (2 * r.h) / 3;
    const positions = [
      { x1: v1x, y1: r.y, x2: v1x, y2: r.y + r.h },
      { x1: v2x, y1: r.y, x2: v2x, y2: r.y + r.h },
      { x1: r.x, y1: h1y, x2: r.x + r.w, y2: h1y },
      { x1: r.x, y1: h2y, x2: r.x + r.w, y2: h2y },
    ];
    lines.forEach((line, i) => {
      const p = positions[i];
      line.setAttribute("x1", String(p.x1));
      line.setAttribute("y1", String(p.y1));
      line.setAttribute("x2", String(p.x2));
      line.setAttribute("y2", String(p.y2));
      line.removeAttribute("opacity");
    });
  }

  // Update the 4 corner-handle rects' positions so they track the hint
  // rect during a resize drag. Handle size is computed in _prepareContext
  // so we just read the current attribute back for half-size centring.
  private _updateHandlesDom(r: { x: number; y: number; w: number; h: number }) {
    if (!this.element) return;
    const handles = this.element.querySelectorAll<SVGRectElement>(".ddb-grid-picker-hint-handle");
    handles.forEach((handle) => {
      const corner = handle.dataset.corner;
      const size = parseFloat(handle.getAttribute("width") ?? "0") || 0;
      const half = size / 2;
      let cx = r.x, cy = r.y;
      if (corner === "tr") cx = r.x + r.w;
      else if (corner === "bl") cy = r.y + r.h;
      else if (corner === "br") {
        cx = r.x + r.w; cy = r.y + r.h;
      }
      handle.setAttribute("x", String(cx - half));
      handle.setAttribute("y", String(cy - half));
    });
  }

  private _clientToViewBox(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }

  private _onHintPointerDown(event: PointerEvent, overlay: SVGRectElement, liveRect: SVGRectElement | null) {
    if (!this.hintMode) return;
    // Shift-drag is reserved for panning - let the SVG-level handler take it.
    if (event.shiftKey || event.button === 1) return;
    event.preventDefault();
    const svg = overlay.ownerSVGElement;
    if (!svg) return;
    const start = this._clientToViewBox(svg, event.clientX, event.clientY);
    this._hintDragStart = start;
    this._hintDragging = true;
    this.hintRect = { x: start.x, y: start.y, w: 0, h: 0 };
    overlay.setPointerCapture(event.pointerId);

    const onMove = (e: PointerEvent) => {
      if (!this._hintDragging || !this._hintDragStart) return;
      const p = this._clientToViewBox(svg, e.clientX, e.clientY);
      const x = Math.min(this._hintDragStart.x, p.x);
      const y = Math.min(this._hintDragStart.y, p.y);
      const w = Math.abs(p.x - this._hintDragStart.x);
      const h = Math.abs(p.y - this._hintDragStart.y);
      this.hintRect = { x, y, w, h };
      if (liveRect) {
        liveRect.setAttribute("x", String(x));
        liveRect.setAttribute("y", String(y));
        liveRect.setAttribute("width", String(w));
        liveRect.setAttribute("height", String(h));
      }
      // Live 3x3 preview so the user can see whether the box is sized
      // correctly while they're still dragging.
      this._updateSubLinesDom(this.hintRect);
    };
    const onUp = (e: PointerEvent) => {
      this._hintDragging = false;
      this._hintDragStart = null;
      try {
        overlay.releasePointerCapture(e.pointerId);
      } catch (_e) { /* ignore */ }
      overlay.removeEventListener("pointermove", onMove);
      overlay.removeEventListener("pointerup", onUp);
      overlay.removeEventListener("pointercancel", onUp);
      // Discard if the user just tapped without dragging (rect too small).
      if (this.hintRect && (this.hintRect.w < 10 || this.hintRect.h < 10)) {
        this.hintRect = null;
      }
      this.render();
    };
    overlay.addEventListener("pointermove", onMove);
    overlay.addEventListener("pointerup", onUp);
    overlay.addEventListener("pointercancel", onUp);
  }

  private _onHandlePointerDown(
    event: PointerEvent,
    handle: SVGRectElement,
    svg: SVGSVGElement,
    liveRect: SVGRectElement,
  ) {
    if (!this.hintRect) return;
    if (event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const corner = handle.dataset.corner ?? "br";
    const start = this.hintRect;
    // Opposite corner stays fixed while the cursor drags this one.
    const fixed = corner === "tl"
      ? { x: start.x + start.w, y: start.y + start.h }
      : corner === "tr"
        ? { x: start.x, y: start.y + start.h }
        : corner === "bl"
          ? { x: start.x + start.w, y: start.y }
          : { x: start.x, y: start.y };
    handle.setPointerCapture(event.pointerId);

    const onMove = (e: PointerEvent) => {
      const p = this._clientToViewBox(svg, e.clientX, e.clientY);
      const x = Math.min(p.x, fixed.x);
      const y = Math.min(p.y, fixed.y);
      const w = Math.abs(p.x - fixed.x);
      const h = Math.abs(p.y - fixed.y);
      this.hintRect = { x, y, w, h };
      liveRect.setAttribute("x", String(x));
      liveRect.setAttribute("y", String(y));
      liveRect.setAttribute("width", String(w));
      liveRect.setAttribute("height", String(h));
      this._updateSubLinesDom(this.hintRect);
      this._updateHandlesDom(this.hintRect);
    };
    const onUp = (e: PointerEvent) => {
      try {
        handle.releasePointerCapture(e.pointerId);
      } catch (_e) { /* ignore */ }
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      if (this.hintRect && (this.hintRect.w < 10 || this.hintRect.h < 10)) {
        this.hintRect = null;
      }
      this.render();
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  }

  static async open(scene: Scene): Promise<SceneGridPickerApp | null> {
    const imageSource = resolveSceneGridImageSource(scene);
    if (!imageSource) {
      ui.notifications?.warn(`"${scene.name ?? "Scene"}" has no level/background image to scan.`);
      return null;
    }
    const app = new SceneGridPickerApp(scene, imageSource);
    app.render({ force: true });
    return app;
  }

}
