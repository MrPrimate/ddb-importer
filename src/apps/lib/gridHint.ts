// Reusable "draw a 3x3 grid" surface controller. Lifts the hint-drawing
// mechanics (drag to draw, corner-handle resize, wheel zoom, shift-drag pan,
// live 3x3 sub-grid preview) out of SceneGridPickerApp so multiple apps can
// share one surface implementation. The geometry source of truth is
// SceneGridPickerApp (left untouched); this is a self-contained port.
//
// The host ApplicationV2 owns one GridHintSurface per drawable image. It:
//   - sets `dims` once the image is probed,
//   - reads `rect`, `currentViewBox()`, `cellPx()`, `handles()` in
//     _prepareContext to feed the template,
//   - calls `wire(svg)` from _onRender to bind the live drag/zoom listeners.
// The template must render, inside the svg: an `.ddb-grid-picker-hint-overlay`
// rect (full image, catches the draw drag), a `.ddb-grid-picker-hint-rect`, a
// `.ddb-grid-picker-hint-group` (sub-lines are injected here), and the corner
// `.ddb-grid-picker-hint-handle` rects. Reusing those class names lets the
// existing maps.css styling apply unchanged.

export interface IRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface IDims {
  x: number;
  y: number;
}

export interface IHintHandle {
  corner: "tl" | "tr" | "bl" | "br";
  x: number;
  y: number;
  size: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";

export class GridHintSurface {

  rect: IRect | null = null;
  viewBox: IRect | null = null;
  dims: IDims = { x: 0, y: 0 };

  // When set, every live corner during draw/resize is snapped through this
  // function (image px -> image px), e.g. to grid-line intersections. Null
  // leaves the drag freeform.
  snapPoint: ((x: number, y: number) => [number, number]) | null = null;

  // Host callback used to request a full re-render once a drag/zoom commits.
  private _onChange: () => void;
  private _dragStart: { x: number; y: number } | null = null;
  private _dragging = false;

  constructor(onChange: () => void) {
    this._onChange = onChange;
  }

  // ----- read by the host's _prepareContext -----

  currentViewBox(): IRect {
    return this.viewBox ?? { x: 0, y: 0, w: this.dims.x, h: this.dims.y };
  }

  get zoomedIn(): boolean {
    return !!this.viewBox;
  }

  // Average cell size in image pixels, asserting the rect spans 3x3 cells.
  cellPx(): number | null {
    if (!this.rect || this.rect.w <= 0 || this.rect.h <= 0) return null;
    return (this.rect.w / 3 + this.rect.h / 3) / 2;
  }

  // Corner-handle rects sized relative to the current viewBox so they stay a
  // consistent on-screen size as the user zooms.
  handles(): IHintHandle[] {
    if (!this.rect || this.rect.w <= 0 || this.rect.h <= 0) return [];
    const r = this.rect;
    const vb = this.currentViewBox();
    const size = Math.max(6, Math.min(vb.w, vb.h) * 0.015);
    const half = size / 2;
    return [
      { corner: "tl", x: r.x - half, y: r.y - half, size },
      { corner: "tr", x: r.x + r.w - half, y: r.y - half, size },
      { corner: "bl", x: r.x - half, y: r.y + r.h - half, size },
      { corner: "br", x: r.x + r.w - half, y: r.y + r.h - half, size },
    ];
  }

  // ----- zoom controls, callable from host action handlers -----

  zoomIn(): void {
    const vb = this.currentViewBox();
    this._zoomTowards(1.5, vb.x + vb.w / 2, vb.y + vb.h / 2);
  }

  zoomOut(): void {
    const vb = this.currentViewBox();
    this._zoomTowards(1 / 1.5, vb.x + vb.w / 2, vb.y + vb.h / 2);
  }

  zoomFit(): void {
    this.viewBox = null;
    this._onChange();
  }

  clearRect(): void {
    this.rect = null;
    this._onChange();
  }

  // Step one edge by a signed image-px amount (positive = move the edge in the
  // +x/+y direction). Used by the edge-nudge arrow buttons. No-op without a
  // rect; keeps width/height above the 10px floor.
  nudgeEdge(edge: "left" | "right" | "top" | "bottom", amount: number): void {
    if (!this.rect) return;
    const r = { ...this.rect };
    const MIN = 10;
    switch (edge) {
      case "left":
        r.x += amount;
        r.w -= amount;
        break;
      case "right":
        r.w += amount;
        break;
      case "top":
        r.y += amount;
        r.h -= amount;
        break;
      case "bottom":
        r.h += amount;
        break;
      // no default
    }
    if (r.w < MIN || r.h < MIN) return;
    this.rect = r;
    this._onChange();
  }

  // ----- wiring, called by the host's _onRender -----

  wire(svg: SVGSVGElement | null): void {
    if (!svg || this.dims.x <= 0) return;

    // Prime the injected sub-grid lines with the current rect.
    this._updateSubLinesDom(svg, this.rect);

    const overlay = svg.querySelector<SVGRectElement>(".ddb-grid-picker-hint-overlay");
    const liveRect = svg.querySelector<SVGRectElement>(".ddb-grid-picker-hint-rect");
    if (overlay) {
      overlay.addEventListener("pointerdown", (event) => this._onHintPointerDown(event, svg, overlay, liveRect));
    }

    if (liveRect) {
      svg.querySelectorAll<SVGRectElement>(".ddb-grid-picker-hint-handle").forEach((handle) => {
        handle.addEventListener("pointerdown", (event) => this._onHandlePointerDown(event, svg, handle, liveRect));
      });
    }

    // Wheel zoom + shift-drag (or middle button) pan.
    svg.addEventListener("wheel", (event: WheelEvent) => {
      event.preventDefault();
      const focal = this._clientToViewBox(svg, event.clientX, event.clientY);
      const factor = event.deltaY < 0 ? 1.25 : 1 / 1.25;
      this._zoomTowards(factor, focal.x, focal.y);
    }, { passive: false });

    svg.addEventListener("pointerdown", (event: PointerEvent) => {
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
        const bounds = svg.getBoundingClientRect();
        const vb = this.currentViewBox();
        if (bounds.width <= 0 || bounds.height <= 0) return;
        const dxImg = dxClient * (vb.w / bounds.width);
        const dyImg = dyClient * (vb.h / bounds.height);
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
        this._onChange();
      };
      svg.addEventListener("pointermove", onMove);
      svg.addEventListener("pointerup", onUp);
      svg.addEventListener("pointercancel", onUp);
    });
  }

  // ----- internals -----

  private _zoomTowards(factor: number, focalX: number, focalY: number): void {
    const vb = this.currentViewBox();
    const newW = vb.w / factor;
    const newH = vb.h / factor;
    const relX = vb.w > 0 ? (focalX - vb.x) / vb.w : 0.5;
    const relY = vb.h > 0 ? (focalY - vb.y) / vb.h : 0.5;
    const newX = focalX - relX * newW;
    const newY = focalY - relY * newH;
    this.viewBox = this._clampViewBox({ x: newX, y: newY, w: newW, h: newH });
    if (this.viewBox.w >= this.dims.x && this.viewBox.h >= this.dims.y) {
      this.viewBox = null;
    }
    this._onChange();
  }

  private _clampViewBox(vb: IRect): IRect {
    const imgW = this.dims.x;
    const imgH = this.dims.y;
    if (imgW <= 0 || imgH <= 0) return vb;
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

  private _snap(x: number, y: number): { x: number; y: number } {
    if (!this.snapPoint) return { x, y };
    const [sx, sy] = this.snapPoint(x, y);
    return { x: sx, y: sy };
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

  private _ensureSubLines(svg: SVGSVGElement): SVGLineElement[] {
    const group = svg.querySelector<SVGGElement>(".ddb-grid-picker-hint-group");
    if (!group) return [];
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

  private _updateSubLinesDom(svg: SVGSVGElement, r: IRect | null): void {
    const lines = this._ensureSubLines(svg);
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

  private _updateHandlesDom(svg: SVGSVGElement, r: IRect): void {
    const handles = svg.querySelectorAll<SVGRectElement>(".ddb-grid-picker-hint-handle");
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

  private _onHintPointerDown(event: PointerEvent, svg: SVGSVGElement, overlay: SVGRectElement, liveRect: SVGRectElement | null): void {
    // Shift-drag is reserved for panning - let the svg-level handler take it.
    if (event.shiftKey || event.button === 1) return;
    event.preventDefault();
    const rawStart = this._clientToViewBox(svg, event.clientX, event.clientY);
    const start = this._snap(rawStart.x, rawStart.y);
    this._dragStart = start;
    this._dragging = true;
    this.rect = { x: start.x, y: start.y, w: 0, h: 0 };
    overlay.setPointerCapture(event.pointerId);

    const onMove = (e: PointerEvent) => {
      if (!this._dragging || !this._dragStart) return;
      const raw = this._clientToViewBox(svg, e.clientX, e.clientY);
      const p = this._snap(raw.x, raw.y);
      const x = Math.min(this._dragStart.x, p.x);
      const y = Math.min(this._dragStart.y, p.y);
      const w = Math.abs(p.x - this._dragStart.x);
      const h = Math.abs(p.y - this._dragStart.y);
      this.rect = { x, y, w, h };
      if (liveRect) {
        liveRect.setAttribute("x", String(x));
        liveRect.setAttribute("y", String(y));
        liveRect.setAttribute("width", String(w));
        liveRect.setAttribute("height", String(h));
      }
      this._updateSubLinesDom(svg, this.rect);
    };
    const onUp = (e: PointerEvent) => {
      this._dragging = false;
      this._dragStart = null;
      try {
        overlay.releasePointerCapture(e.pointerId);
      } catch (_e) { /* ignore */ }
      overlay.removeEventListener("pointermove", onMove);
      overlay.removeEventListener("pointerup", onUp);
      overlay.removeEventListener("pointercancel", onUp);
      if (this.rect && (this.rect.w < 10 || this.rect.h < 10)) {
        this.rect = null;
      }
      this._onChange();
    };
    overlay.addEventListener("pointermove", onMove);
    overlay.addEventListener("pointerup", onUp);
    overlay.addEventListener("pointercancel", onUp);
  }

  private _onHandlePointerDown(event: PointerEvent, svg: SVGSVGElement, handle: SVGRectElement, liveRect: SVGRectElement): void {
    if (!this.rect) return;
    if (event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const corner = handle.dataset.corner ?? "br";
    const start = this.rect;
    const fixed = corner === "tl"
      ? { x: start.x + start.w, y: start.y + start.h }
      : corner === "tr"
        ? { x: start.x, y: start.y + start.h }
        : corner === "bl"
          ? { x: start.x + start.w, y: start.y }
          : { x: start.x, y: start.y };
    handle.setPointerCapture(event.pointerId);

    const onMove = (e: PointerEvent) => {
      const raw = this._clientToViewBox(svg, e.clientX, e.clientY);
      const p = this._snap(raw.x, raw.y);
      const x = Math.min(p.x, fixed.x);
      const y = Math.min(p.y, fixed.y);
      const w = Math.abs(p.x - fixed.x);
      const h = Math.abs(p.y - fixed.y);
      this.rect = { x, y, w, h };
      liveRect.setAttribute("x", String(x));
      liveRect.setAttribute("y", String(y));
      liveRect.setAttribute("width", String(w));
      liveRect.setAttribute("height", String(h));
      this._updateSubLinesDom(svg, this.rect);
      this._updateHandlesDom(svg, this.rect);
    };
    const onUp = (e: PointerEvent) => {
      try {
        handle.releasePointerCapture(e.pointerId);
      } catch (_e) { /* ignore */ }
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      if (this.rect && (this.rect.w < 10 || this.rect.h < 10)) {
        this.rect = null;
      }
      this._onChange();
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  }

}

// Probe an image's natural pixel dimensions. Mirrors
// SceneGridPickerApp._prepareImage with a sane fallback.
export async function probeImageDimensions(url: string): Promise<IDims> {
  if (!url) return { x: 1024, y: 1024 };
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const dims = { x: bitmap.width, y: bitmap.height };
    if (typeof bitmap.close === "function") bitmap.close();
    return dims;
  } catch (_error) {
    return { x: 1024, y: 1024 };
  }
}
