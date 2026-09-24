import { isImagePattern } from "../../config/regionDisplayProfiles";
import { imageDimensions, imageFillDimensions, loadDisplayTexture } from "./regionDisplayTexture";

const selector = ".ddbi-display-region-preview, .ddbi-display-region-swatch";
const keys = new WeakMap<HTMLElement, string>();
const scopes = new WeakMap<HTMLElement, { observer: ResizeObserver; elements: Set<HTMLElement>; frame: number }>();
const sheetRoots = new WeakMap<object, HTMLElement>();
const symbols = new Map<string, HTMLCanvasElement>();
let symbolPixels = 0;

/** Only drawing inputs cross the sheet's HTML serialization boundary, never CSS or profile metadata. */
export function imagePreviewData(
  style: IRegionDisplayProfile | IRegionDisplayStyle,
  color: string,
  grid: number,
): string {
  if (!isImagePattern(style.pattern)) return "";
  const {
    pattern,
    textureSrc,
    textureColorMode,
    textureAnchor,
    textureFit,
    spacing,
    thickness,
    offset,
    gapOpacity,
    border,
    borderWidth,
  } = style;
  return JSON.stringify({
    style: {
      pattern,
      textureSrc,
      textureColorMode,
      textureAnchor,
      textureFit,
      spacing,
      thickness,
      offset,
      gapOpacity,
      border,
      borderWidth,
    },
    color: style.color || color,
    grid,
  } satisfies IImagePreview);
}

/** Size cached silhouettes for their destination, with a bounded LRU pixel budget. */
function symbolFor(
  texture: PIXI.Texture,
  preview: IImagePreview,
  width: number,
  height: number,
  ratio: number,
): HTMLCanvasElement | null {
  const { style, color } = preview;
  const scale = Math.min(ratio, 1024 / Math.max(width, height));
  const w = Math.max(1, Math.ceil(width * scale));
  const h = Math.max(1, Math.ceil(height * scale));
  const key = JSON.stringify([
    style.textureSrc,
    style.textureColorMode,
    style.textureColorMode === "region" ? color : "",
    w,
    h,
  ]);
  const cached = symbols.get(key);
  if (cached) {
    symbols.delete(key);
    symbols.set(key, cached);
    return cached;
  }
  const source = (texture.baseTexture.resource as unknown as { source?: CanvasImageSource }).source;
  if (!source) return null;
  const symbol = document.createElement("canvas");
  symbol.width = w;
  symbol.height = h;
  const ink = symbol.getContext("2d");
  if (!ink) return null;
  ink.drawImage(source, 0, 0, w, h);
  if (style.textureColorMode === "region") {
    ink.globalCompositeOperation = "source-in";
    ink.fillStyle = color;
    ink.fillRect(0, 0, w, h);
  }
  symbols.set(key, symbol);
  symbolPixels += w * h;
  while (symbols.size > 128 || symbolPixels > 4 * 1024 * 1024) {
    const oldest = symbols.keys().next().value!;
    const removed = symbols.get(oldest)!;
    symbolPixels -= removed.width * removed.height;
    symbols.delete(oldest);
  }
  return symbol;
}

/** Paint into the fill element, retaining its CSS opacity and independent outer border. */
export async function paintImagePreview(element: HTMLElement): Promise<void> {
  const encoded = element.dataset.imagePreview ?? "";
  const rect = element.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const key = `${encoded}:${rect.width}:${rect.height}:${ratio}`;
  if (keys.get(element) === key) return;
  keys.set(element, key);
  const fill = element.querySelector<HTMLElement>(".ddbi-display-region-fill");
  if (!fill) return;
  fill.querySelector("canvas")?.remove();
  fill.style.removeProperty("background");
  delete element.dataset.imageError;
  if (!encoded || !rect.width || !rect.height) return;
  let preview: IImagePreview;
  try {
    preview = JSON.parse(encoded) as IImagePreview;
  } catch {
    return;
  }
  const { style, grid, color } = preview;
  const texture = await loadDisplayTexture(style.textureSrc);
  if (!element.isConnected || keys.get(element) !== key) return;
  element.dataset.imageError = texture ? "false" : "true";
  const message = element
    .closest(".ddbi-display-region-editor, .ddbi-display-region-config-body")
    ?.querySelector<HTMLElement>(".ddbi-display-image-error");
  if (message) message.hidden = Boolean(texture);
  if (!texture) return;
  const image = document.createElement("canvas");
  image.width = Math.ceil(rect.width * ratio);
  image.height = Math.ceil(rect.height * ratio);
  const context = image.getContext("2d");
  if (!context) return;
  context.scale(ratio, ratio);
  const inset = style.border ? Math.max(1, style.borderWidth * grid) : 0;
  context.beginPath();
  context.rect(inset, inset, Math.max(0, rect.width - inset * 2), Math.max(0, rect.height - inset * 2));
  context.clip();
  context.fillStyle = color;
  context.globalAlpha = style.gapOpacity;
  context.fillRect(0, 0, rect.width, rect.height);
  context.globalAlpha = 1;
  const aspect = texture.width / texture.height;
  if (style.pattern === "imageStretch") {
    const size = imageFillDimensions(style.textureFit, aspect, rect.width, rect.height);
    const symbol = symbolFor(texture, preview, size.width, size.height, ratio);
    if (!symbol) return;
    context.drawImage(symbol, size.x, size.y, size.width, size.height);
  } else {
    const period = Math.max(1, style.spacing * grid);
    const size = imageDimensions(style.pattern, aspect, period, style.thickness);
    const cellHeight = style.pattern === "imageTile" ? size.height : period;
    const symbol = symbolFor(texture, preview, size.width, size.height, ratio);
    if (!symbol) return;
    const cell = document.createElement("canvas");
    const cellScale = Math.min(ratio, 1024 / Math.max(period, cellHeight));
    cell.width = Math.max(1, Math.ceil(period * cellScale));
    cell.height = Math.max(1, Math.ceil(cellHeight * cellScale));
    const ink = cell.getContext("2d");
    if (!ink) return;
    ink.scale(cell.width / period, cell.height / cellHeight);
    ink.drawImage(symbol, (period - size.width) / 2, (cellHeight - size.height) / 2, size.width, size.height);
    const pattern = context.createPattern(cell, "repeat");
    if (!pattern) return;
    pattern.setTransform(
      new DOMMatrix([
        period / cell.width,
        0,
        0,
        cellHeight / cell.height,
        -period * style.offset,
        -cellHeight * style.offset,
      ]),
    );
    context.fillStyle = pattern;
    context.fillRect(0, 0, rect.width, rect.height);
  }
  fill.style.background = "none";
  fill.append(image);
}

/** Called by render and live-input handlers; coalesce slider events into one paint per frame. */
export function paintImagePreviews(root: HTMLElement): void {
  if (!root?.isConnected) return;
  let scope = scopes.get(root);
  if (!scope) {
    scope = {
      elements: new Set(),
      frame: 0,
      observer: new ResizeObserver((entries) => {
        for (const entry of entries) void paintImagePreview(entry.target as HTMLElement);
      }),
    };
    scopes.set(root, scope);
  }
  if (scope.frame) return;
  const current = scope;
  current.frame = requestAnimationFrame(() => {
    current.frame = 0;
    const elements = new Set(root.querySelectorAll<HTMLElement>(selector));
    for (const old of current.elements) {
      if (elements.has(old)) continue;
      current.observer.unobserve(old);
      keys.delete(old);
    }
    for (const element of elements) {
      if (!current.elements.has(element)) current.observer.observe(element);
      void paintImagePreview(element);
    }
    current.elements = elements;
  });
}

/** Closing a sheet releases its observer and invalidates outstanding image completions. */
export function disposeImagePreviews(root: HTMLElement): void {
  const scope = scopes.get(root);
  if (!scope) return;
  cancelAnimationFrame(scope.frame);
  scope.observer.disconnect();
  for (const element of scope.elements) keys.delete(element);
  scopes.delete(root);
}

/** Activity behaviors serialize swatches before mounting them; painting starts after sheet render. */
export function registerImagePreviewHooks(): void {
  Hooks.on<"renderActivitySheet">("renderActivitySheet", (app: object, element: HTMLElement) =>
    paintSheetImagePreviews(app, element),
  );
  Hooks.on<"closeApplicationV2">("closeApplicationV2", (app) => {
    const root = sheetRoots.get(app);
    if (root) disposeImagePreviews(root);
    sheetRoots.delete(app);
  });
}

/** Keep the rendered root until close, when ApplicationV2 has already cleared its element. */
export function paintSheetImagePreviews(app: object, element: HTMLElement): void {
  const previous = sheetRoots.get(app);
  if (previous && previous !== element) disposeImagePreviews(previous);
  sheetRoots.set(app, element);
  paintImagePreviews(element);
}
