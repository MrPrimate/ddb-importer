import DDBAppV2 from "./DDBAppV2";
import { logger, getMapScaleMultiplier } from "../lib/_module";
import {
  runDetectionForScene,
  rebuildDetectionRun,
  applyChoiceToScene,
  ISceneGridDetectionRun,
  ICandidateChoice,
} from "./SceneGridDetector";

interface ISceneLike {
  id?: string;
  name?: string;
  background?: { src?: string | null; offsetX?: number; offsetY?: number };
  width?: number;
  height?: number;
  grid?: { size?: number };
  flags?: Record<string, any>;
  getFlag?: (scope: string, key: string) => any;
  update: (data: any) => Promise<any>;
}

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

  scene: ISceneLike;
  step: "select" | "review" = "select";
  selected = new Set<string>();
  imageDimensions: { x: number; y: number } = { x: 0, y: 0 };
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
      cancel: SceneGridPickerApp.cancel,
    },
    position: { width: 900, height: 720 },
  };

  static PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/scene-grid-picker/picker.hbs",
    },
  };

  constructor(scene: ISceneLike) {
    super();
    this.scene = scene;
    this.imageUrl = scene.background?.src ?? "";
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
    const flags = this.scene.flags?.["ddb-importer"] ?? {};
    const flagged = (typeof this.scene.getFlag === "function"
      ? this.scene.getFlag("ddb-importer", "gridMultiplier")
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
    const storedDetection = (typeof this.scene.getFlag === "function"
      ? this.scene.getFlag("ddb-importer", "gridDetection")
      : null) ?? flags.gridDetection;
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
      const baseOptions: any = {};
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
  }

  static async open(scene: ISceneLike): Promise<SceneGridPickerApp | null> {
    if (!scene.background?.src) {
      ui.notifications?.warn(`"${scene.name ?? "Scene"}" has no background image to scan.`);
      return null;
    }
    const app = new SceneGridPickerApp(scene);
    app.render(true);
    return app;
  }

}
