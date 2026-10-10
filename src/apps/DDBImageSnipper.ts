import DDBAppV2 from "./DDBAppV2";
import FileHelper from "../lib/FileHelper";
import ImageSnipper from "../lib/ImageSnipper";
import logger from "../lib/Logger";

type TSnipTarget = "actor" | "token";

interface ISnipTargetState {
  url: string;
  bitmap: ImageBitmap | null;
  snip: IDDBImageSnip | null;
}

interface IPoint {
  x: number;
  y: number;
}

// the rotated image's placement on the editor canvas
interface IViewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface IDragState {
  mode: "move" | "resize";
  // move: pointer offset from the cut's centre; resize: the fixed corner. Both in canvas pixels
  anchor: IPoint;
}

interface IImageSnipperContext extends DDBAppV2Context {
  name: string;
  shapes: { value: TDDBImageSnipShape; label: string }[];
}

const TARGETS: TSnipTarget[] = ["actor", "token"];
const DEFAULT_SHAPE: Record<TSnipTarget, TDDBImageSnipShape> = { actor: "rectangle", token: "square" };
const HANDLE_SIZE = 10;
const MIN_SIZE = 4;

function localize(key: string, data?: Record<string, string>): string {
  const path = `ddb-importer.image-snipper.${key}`;
  return data ? game.i18n.format(path, data) : game.i18n.localize(path);
}

/**
 * Author image snips for the proxy's enriched image data: load a DDB image through the CORS
 * proxy, rotate it, cut out an avatar and a token, and copy the entry for snip-images.js.
 *
 * The template renders once. After that every change is drawn straight onto the canvases and
 * inputs, since a Handlebars render per pointer move would lose the drag.
 */
export default class DDBImageSnipper extends DDBAppV2 {
  snipName = "";
  active: TSnipTarget = "actor";
  targets: Record<TSnipTarget, ISnipTargetState> = {
    actor: { url: "", bitmap: null, snip: null },
    token: { url: "", bitmap: null, snip: null },
  };

  private _bitmaps = new Map<string, ImageBitmap>();
  private _view: IViewTransform = { scale: 1, offsetX: 0, offsetY: 0 };
  private _drag: IDragState | null = null;
  private _frame: number | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _initialUrl: string;

  constructor({ url = "", name = "" }: { url?: string; name?: string } = {}) {
    super();
    this._initialUrl = url;
    this.snipName = name;
  }

  static override DEFAULT_OPTIONS = {
    id: "ddb-image-snipper-{id}",
    classes: ["standard-form", "ddbi-image-snipper"],
    window: { title: "ddb-importer.image-snipper.title", resizable: true },
    actions: {
      selectTarget: DDBImageSnipper.selectTarget,
      loadImage: DDBImageSnipper.loadImageAction,
      copyToToken: DDBImageSnipper.copyToToken,
      clearTarget: DDBImageSnipper.clearTarget,
      copyOutput: DDBImageSnipper.copyOutput,
      applyText: DDBImageSnipper.applyText,
    },
    position: { width: 1100, height: 820 },
  };

  static override PARTS = {
    content: { template: "modules/ddb-importer/handlebars/image-snipper/snipper.hbs" },
  };

  /** Open the tool, optionally loading `url` as the avatar image. */
  static open({ url = "", name = "" }: { url?: string; name?: string } = {}): DDBImageSnipper {
    const app = new DDBImageSnipper({ url, name });
    void app.render({ force: true });
    return app;
  }

  _getTabs(): IDDBTabs {
    return {};
  }

  override async _prepareContext(options: any) {
    const context = (await super._prepareContext({ ...options, noCacheLoad: true })) as IImageSnipperContext;
    context.name = this.snipName;
    context.shapes = ImageSnipper.SHAPES.map((value) => ({ value, label: localize(`shapes.${value}`) }));
    return context;
  }

  override async _onRender(context: any, options: any) {
    await super._onRender(context, options);
    this._bindControls();
    this._bindCanvas();
    this._syncControls();
    this._scheduleDraw();
    if (this._initialUrl) {
      const url = this._initialUrl;
      this._initialUrl = "";
      await this._loadTarget("actor", url);
    }
  }

  override async _onClose(options?: any) {
    if (this._frame !== null) cancelAnimationFrame(this._frame);
    this._resizeObserver?.disconnect();
    for (const bitmap of this._bitmaps.values()) bitmap.close();
    this._bitmaps.clear();
    const fn = (super._onClose as ((opts?: any) => Promise<void>) | undefined);
    if (fn) return fn.call(this, options);
  }

  private _query<T extends HTMLElement>(selector: string): T | null {
    return this.element.querySelector<T>(selector);
  }

  private get _current(): ISnipTargetState {
    return this.targets[this.active];
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  static selectTarget(this: DDBImageSnipper, _event: Event, target: HTMLElement) {
    const value = target.dataset.target as TSnipTarget | undefined;
    if (!value || !TARGETS.includes(value)) return;
    this.active = value;
    this._syncControls();
    this._scheduleDraw();
  }

  static async loadImageAction(this: DDBImageSnipper) {
    const url = this._query<HTMLInputElement>("[data-snip-url]")?.value.trim() ?? "";
    if (!url) return;
    await this._loadTarget(this.active, url);
  }

  static copyToToken(this: DDBImageSnipper) {
    const actor = this.targets.actor;
    if (!actor.snip) {
      ui.notifications.warn(localize("notify.noAvatar"));
      return;
    }
    this.targets.token = { url: actor.url, bitmap: actor.bitmap, snip: { ...actor.snip } };
    this.active = "token";
    this._syncControls();
    this._scheduleDraw();
  }

  static clearTarget(this: DDBImageSnipper) {
    this.targets[this.active] = { url: "", bitmap: null, snip: null };
    this._syncControls();
    this._scheduleDraw();
  }

  static async copyOutput(this: DDBImageSnipper) {
    if (!this.targets.actor.snip && !this.targets.token.snip) {
      ui.notifications.warn(localize("notify.nothingToCopy"));
      return;
    }
    await game.clipboard.copyPlainText(this._outputText());
    ui.notifications.info(localize("notify.copied"));
  }

  /** Read an entry pasted into the output box back into the editor. */
  static async applyText(this: DDBImageSnipper) {
    const text = this._query<HTMLTextAreaElement>("[data-snip-output]")?.value ?? "";
    const parsed = ImageSnipper.parseSnipEntry(text);
    if (!parsed) {
      ui.notifications.warn(localize("notify.parseFailed"));
      return;
    }
    if (parsed.name) this.snipName = parsed.name;
    const nameInput = this._query<HTMLInputElement>("[data-snip-name]");
    if (nameInput) nameInput.value = this.snipName;
    for (const target of TARGETS) {
      const snip = parsed.entry[target];
      this.targets[target] = { url: snip?.url ?? "", bitmap: null, snip: snip ?? null };
    }
    this.active = parsed.entry.actor ? "actor" : "token";
    for (const target of TARGETS) {
      const state = this.targets[target];
      if (state.snip) await this._loadTarget(target, state.url, state.snip);
    }
    this._syncControls();
    this._scheduleDraw();
  }

  /* -------------------------------------------- */
  /*  Loading                                     */
  /* -------------------------------------------- */

  private async _fetchBitmap(url: string): Promise<ImageBitmap | null> {
    const known = this._bitmaps.get(url);
    if (known) return known;
    const blob = await FileHelper.downloadProxiedImage(url);
    if (!blob) return null;
    const bitmap = await createImageBitmap(blob);
    this._bitmaps.set(url, bitmap);
    return bitmap;
  }

  /**
   * Load an image into a target. A snip passed in (read back from text) is rescaled to the image
   * actually served; otherwise the target starts with a centred cut of its default shape.
   */
  private async _loadTarget(target: TSnipTarget, url: string, snip?: IDDBImageSnip) {
    this._setStatus(localize("loading"));
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await this._fetchBitmap(url);
    } catch (error) {
      logger.error(`Image snipper could not load ${url}`, error);
    }
    this._setStatus("");
    if (!bitmap) {
      ui.notifications.error(localize("notify.loadFailed", { url }));
      return;
    }

    const existing = this.targets[target].snip;
    const reuse = snip ?? (existing && existing.url === url ? existing : null);
    this.targets[target] = {
      url,
      bitmap,
      snip: reuse
        ? DDBImageSnipper._roundSnip(ImageSnipper.scaledSnip(reuse, bitmap.width, bitmap.height))
        : DDBImageSnipper._defaultSnip(url, bitmap, DEFAULT_SHAPE[target]),
    };
    this._syncControls();
    this._scheduleDraw();
  }

  static _defaultSnip(url: string, bitmap: ImageBitmap, shape: TDDBImageSnipShape): IDDBImageSnip {
    const equal = ImageSnipper.isEqualSided(shape);
    const side = Math.round(Math.min(bitmap.width, bitmap.height) * 0.6);
    return {
      url,
      sourceWidth: bitmap.width,
      sourceHeight: bitmap.height,
      rotation: 0,
      centerX: Math.round(bitmap.width / 2),
      centerY: Math.round(bitmap.height / 2),
      width: equal ? side : Math.round(bitmap.width * 0.8),
      height: equal ? side : Math.round(bitmap.height * 0.8),
      shape,
    };
  }

  /** Whole pixels and tenths of a degree; finer precision means nothing in the cut. */
  static _roundSnip(snip: IDDBImageSnip): IDDBImageSnip {
    return ImageSnipper.normaliseSnip({
      ...snip,
      rotation: Math.round(snip.rotation * 10) / 10,
      centerX: Math.round(snip.centerX),
      centerY: Math.round(snip.centerY),
      width: Math.max(MIN_SIZE, Math.round(snip.width)),
      height: Math.max(MIN_SIZE, Math.round(snip.height)),
    });
  }

  /* -------------------------------------------- */
  /*  Controls                                    */
  /* -------------------------------------------- */

  private _setStatus(text: string) {
    const status = this._query("[data-snip-status]");
    if (status) status.textContent = text;
  }

  private _updateSnip(changes: Partial<IDDBImageSnip>) {
    const state = this._current;
    if (!state.snip) return;
    state.snip = DDBImageSnipper._roundSnip({ ...state.snip, ...changes });
    this._syncControls();
    this._scheduleDraw();
  }

  private _bindControls() {
    this._query<HTMLInputElement>("[data-snip-name]")?.addEventListener("input", (event) => {
      this.snipName = (event.currentTarget as HTMLInputElement).value;
      this._updateOutput();
    });

    this._query<HTMLInputElement>("[data-snip-url]")?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      void DDBImageSnipper.loadImageAction.call(this);
    });

    for (const input of this.element.querySelectorAll<HTMLInputElement>("[data-snip-field]")) {
      input.addEventListener("change", () => {
        const field = input.dataset.snipField as keyof IDDBImageSnip;
        const value = Number(input.value);
        const snip = this._current.snip;
        if (!snip || !Number.isFinite(value)) {
          this._syncControls();
          return;
        }
        // an equal-sided cut follows whichever side was typed, rather than the shorter one
        if ((field === "width" || field === "height") && ImageSnipper.isEqualSided(snip.shape)) {
          this._updateSnip({ width: value, height: value });
        } else {
          this._updateSnip({ [field]: value });
        }
      });
    }

    this._query<HTMLInputElement>("[data-snip-rotation-range]")?.addEventListener("input", (event) => {
      this._updateSnip({ rotation: Number((event.currentTarget as HTMLInputElement).value) });
    });

    this._query<HTMLSelectElement>("[data-snip-shape]")?.addEventListener("change", (event) => {
      this._updateSnip({ shape: (event.currentTarget as HTMLSelectElement).value as TDDBImageSnipShape });
    });

    this._query<HTMLInputElement>("[data-snip-max-size]")?.addEventListener("change", (event) => {
      const value = Number((event.currentTarget as HTMLInputElement).value);
      const snip = this._current.snip;
      if (!snip) return;
      const next = { ...snip };
      if (Number.isFinite(value) && value > 0) next.maxSize = Math.round(value);
      else delete next.maxSize;
      this._current.snip = DDBImageSnipper._roundSnip(next);
      this._syncControls();
      this._scheduleDraw();
    });
  }

  /** Push the active target's state into the inputs and the target buttons. */
  private _syncControls() {
    const state = this._current;
    const snip = state.snip;

    for (const button of this.element.querySelectorAll<HTMLButtonElement>("[data-action='selectTarget']")) {
      const selected = button.dataset.target === this.active;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    }

    const urlInput = this._query<HTMLInputElement>("[data-snip-url]");
    if (urlInput) urlInput.value = state.url;

    for (const input of this.element.querySelectorAll<HTMLInputElement>("[data-snip-field]")) {
      const field = input.dataset.snipField as keyof IDDBImageSnip;
      input.value = snip ? String(snip[field] ?? "") : "";
      input.disabled = !snip;
    }
    const range = this._query<HTMLInputElement>("[data-snip-rotation-range]");
    if (range) {
      range.value = String(snip?.rotation ?? 0);
      range.disabled = !snip;
    }
    const shape = this._query<HTMLSelectElement>("[data-snip-shape]");
    if (shape) {
      shape.value = snip?.shape ?? DEFAULT_SHAPE[this.active];
      shape.disabled = !snip;
    }
    const maxSize = this._query<HTMLInputElement>("[data-snip-max-size]");
    if (maxSize) {
      maxSize.value = snip?.maxSize ? String(snip.maxSize) : "";
      maxSize.disabled = !snip;
    }
    const empty = this._query("[data-snip-empty]");
    if (empty) empty.hidden = Boolean(state.bitmap);

    this._updateOutput();
  }

  private _outputText(): string {
    return ImageSnipper.formatSnipEntry(this.snipName.trim() || localize("unnamed"), {
      actor: this.targets.actor.snip ?? undefined,
      token: this.targets.token.snip ?? undefined,
    });
  }

  private _updateOutput() {
    const output = this._query<HTMLTextAreaElement>("[data-snip-output]");
    if (!output) return;
    output.value = (this.targets.actor.snip || this.targets.token.snip) ? this._outputText() : "";
  }

  /* -------------------------------------------- */
  /*  Editor canvas                               */
  /* -------------------------------------------- */

  private _bindCanvas() {
    const canvas = this._query<HTMLCanvasElement>("[data-snip-editor]");
    const stage = this._query("[data-snip-stage]");
    if (!canvas || !stage) return;

    this._resizeObserver?.disconnect();
    this._resizeObserver = new ResizeObserver(() => this._scheduleDraw());
    this._resizeObserver.observe(stage);

    canvas.addEventListener("pointerdown", (event) => this._onPointerDown(canvas, event));
    canvas.addEventListener("pointermove", (event) => this._onPointerMove(canvas, event));
    const end = (event: PointerEvent) => {
      if (!this._drag) return;
      this._drag = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (this._current.snip) this._current.snip = DDBImageSnipper._roundSnip(this._current.snip);
      this._syncControls();
      this._scheduleDraw();
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
  }

  private _canvasPoint(canvas: HTMLCanvasElement, event: PointerEvent): IPoint {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  private _sourceSize(): { width: number; height: number } | null {
    const bitmap = this._current.bitmap;
    return bitmap ? { width: bitmap.width, height: bitmap.height } : null;
  }

  /** The cut's centre and size on the editor canvas. */
  private _selectionOnCanvas(): { center: IPoint; width: number; height: number } | null {
    const snip = this._current.snip;
    const source = this._sourceSize();
    if (!snip || !source) return null;
    const view = ImageSnipper.sourceToView({ x: snip.centerX, y: snip.centerY }, source, snip.rotation);
    return {
      center: {
        x: this._view.offsetX + (view.x * this._view.scale),
        y: this._view.offsetY + (view.y * this._view.scale),
      },
      width: snip.width * this._view.scale,
      height: snip.height * this._view.scale,
    };
  }

  private _canvasToSource(point: IPoint): IPoint | null {
    const snip = this._current.snip;
    const source = this._sourceSize();
    if (!snip || !source) return null;
    return ImageSnipper.viewToSource(
      {
        x: (point.x - this._view.offsetX) / this._view.scale,
        y: (point.y - this._view.offsetY) / this._view.scale,
      },
      source,
      snip.rotation,
    );
  }

  private _corners(selection: { center: IPoint; width: number; height: number }): IPoint[] {
    const halfW = selection.width / 2;
    const halfH = selection.height / 2;
    return [
      { x: selection.center.x - halfW, y: selection.center.y - halfH },
      { x: selection.center.x + halfW, y: selection.center.y - halfH },
      { x: selection.center.x + halfW, y: selection.center.y + halfH },
      { x: selection.center.x - halfW, y: selection.center.y + halfH },
    ];
  }

  /** Which part of the selection the point is over: a corner index, the inside, or nothing. */
  private _hitTest(point: IPoint): { corner: number } | "inside" | null {
    const selection = this._selectionOnCanvas();
    if (!selection) return null;
    const corners = this._corners(selection);
    const corner = corners.findIndex((c) => Math.abs(c.x - point.x) <= HANDLE_SIZE && Math.abs(c.y - point.y) <= HANDLE_SIZE);
    if (corner !== -1) return { corner };
    const inside = Math.abs(point.x - selection.center.x) <= selection.width / 2
      && Math.abs(point.y - selection.center.y) <= selection.height / 2;
    return inside ? "inside" : null;
  }

  private _onPointerDown(canvas: HTMLCanvasElement, event: PointerEvent) {
    if (event.button !== 0 || !this._current.snip) return;
    const point = this._canvasPoint(canvas, event);
    const hit = this._hitTest(point);
    const selection = this._selectionOnCanvas();
    if (!selection) return;

    if (hit === "inside") {
      this._drag = { mode: "move", anchor: { x: point.x - selection.center.x, y: point.y - selection.center.y } };
    } else if (hit) {
      const corners = this._corners(selection);
      this._drag = { mode: "resize", anchor: corners[(hit.corner + 2) % 4] };
    } else {
      // outside the cut: draw a new one from here
      this._drag = { mode: "resize", anchor: point };
    }
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  private _onPointerMove(canvas: HTMLCanvasElement, event: PointerEvent) {
    const point = this._canvasPoint(canvas, event);
    const state = this._current;
    if (!this._drag || !state.snip) {
      const hit = this._hitTest(point);
      canvas.style.cursor = hit === "inside" ? "move" : hit ? "nwse-resize" : state.snip ? "crosshair" : "default";
      return;
    }

    if (this._drag.mode === "move") {
      const center = this._canvasToSource({ x: point.x - this._drag.anchor.x, y: point.y - this._drag.anchor.y });
      if (!center) return;
      state.snip = { ...state.snip, centerX: center.x, centerY: center.y };
    } else {
      const anchor = this._drag.anchor;
      let dx = point.x - anchor.x;
      let dy = point.y - anchor.y;
      if (ImageSnipper.isEqualSided(state.snip.shape)) {
        const side = Math.max(Math.abs(dx), Math.abs(dy));
        dx = (Math.sign(dx) || 1) * side;
        dy = (Math.sign(dy) || 1) * side;
      }
      const center = this._canvasToSource({ x: anchor.x + (dx / 2), y: anchor.y + (dy / 2) });
      if (!center) return;
      state.snip = {
        ...state.snip,
        centerX: center.x,
        centerY: center.y,
        width: Math.max(MIN_SIZE, Math.abs(dx) / this._view.scale),
        height: Math.max(MIN_SIZE, Math.abs(dy) / this._view.scale),
      };
    }
    this._scheduleDraw();
  }

  /* -------------------------------------------- */
  /*  Drawing                                     */
  /* -------------------------------------------- */

  private _scheduleDraw() {
    if (this._frame !== null) return;
    this._frame = requestAnimationFrame(() => {
      this._frame = null;
      this._drawEditor();
      this._drawPreviews();
      if (this._drag) this._syncFieldsOnly();
    });
  }

  /** While dragging, keep the number inputs live without rebuilding the output text every frame. */
  private _syncFieldsOnly() {
    const snip = this._current.snip;
    if (!snip) return;
    for (const input of this.element.querySelectorAll<HTMLInputElement>("[data-snip-field]")) {
      const field = input.dataset.snipField as keyof IDDBImageSnip;
      const value = snip[field];
      input.value = typeof value === "number" ? String(Math.round(value * 10) / 10) : String(value ?? "");
    }
  }

  private _drawEditor() {
    const canvas = this._query<HTMLCanvasElement>("[data-snip-editor]");
    const stage = this._query("[data-snip-stage]");
    if (!canvas || !stage) return;
    const width = Math.max(1, Math.floor(stage.clientWidth));
    const height = Math.max(1, Math.floor(stage.clientHeight));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const state = this._current;
    const bitmap = state.bitmap;
    const snip = state.snip;
    if (!bitmap || !snip) return;

    const bounds = ImageSnipper.rotatedBounds(bitmap.width, bitmap.height, snip.rotation);
    const padding = 16;
    const scale = Math.min((width - (padding * 2)) / bounds.width, (height - (padding * 2)) / bounds.height);
    this._view = {
      scale,
      offsetX: (width - (bounds.width * scale)) / 2,
      offsetY: (height - (bounds.height * scale)) / 2,
    };

    ctx.save();
    ctx.translate(this._view.offsetX + (bounds.width * scale / 2), this._view.offsetY + (bounds.height * scale / 2));
    ctx.scale(scale, scale);
    ctx.rotate(ImageSnipper.toRadians(snip.rotation));
    ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
    ctx.restore();

    const selection = this._selectionOnCanvas();
    if (!selection) return;
    const [topLeft] = this._corners(selection);

    // shade everything outside the cut
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    if (snip.shape === "circle") {
      ctx.ellipse(selection.center.x, selection.center.y, selection.width / 2, selection.height / 2, 0, 0, Math.PI * 2);
    } else {
      ctx.rect(topLeft.x, topLeft.y, selection.width, selection.height);
    }
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fill("evenodd");
    ctx.restore();

    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#ff6400";
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(topLeft.x, topLeft.y, selection.width, selection.height);
    ctx.setLineDash([]);
    ctx.fillStyle = "#ff6400";
    for (const corner of this._corners(selection)) {
      ctx.fillRect(corner.x - (HANDLE_SIZE / 2), corner.y - (HANDLE_SIZE / 2), HANDLE_SIZE, HANDLE_SIZE);
    }
    ctx.restore();
  }

  private _drawPreviews() {
    for (const target of TARGETS) {
      const canvas = this._query<HTMLCanvasElement>(`[data-snip-preview='${target}']`);
      const label = this._query(`[data-snip-preview-size='${target}']`);
      if (!canvas) continue;
      const { bitmap, snip } = this.targets[target];
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      if (!bitmap || !snip) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.hidden = true;
        if (label) label.textContent = localize("noImage");
        continue;
      }
      canvas.hidden = false;
      const output = ImageSnipper.outputSize(ImageSnipper.scaledSnip(snip, bitmap.width, bitmap.height));
      if (canvas.width !== output.width) canvas.width = output.width;
      if (canvas.height !== output.height) canvas.height = output.height;
      ImageSnipper.drawSnip(ctx, bitmap, snip);
      if (label) label.textContent = `${output.width} × ${output.height}`;
    }
  }
}
