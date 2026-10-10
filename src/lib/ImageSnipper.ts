/**
 * Geometry and rendering for image snips: rotate a remote image, then cut a rectangle, square or
 * circle out of it. The authoring tool (DDBImageSnipper) and the import path (FileHelper) both
 * render through here, so the preview is exactly what gets saved.
 *
 * Rotation is clockwise in screen space (y down), matching CanvasRenderingContext2D.rotate. A
 * source point p lands in the rotated view at R(p - imageCentre) + viewCentre, and in the cut at
 * R(p - cutCentre) + cutSize / 2, which is why a snip only needs its centre in source pixels.
 */

type TSnipCanvas = OffscreenCanvas | HTMLCanvasElement;
type TSnipContext = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

interface IPoint {
  x: number;
  y: number;
}

interface ISize {
  width: number;
  height: number;
}

const SHAPES: TDDBImageSnipShape[] = ["rectangle", "square", "circle"];

// the order the fields are written out in, which keeps entries in the proxy file easy to scan
const SNIP_KEYS: (keyof IDDBImageSnip)[] = [
  "url", "sourceWidth", "sourceHeight", "rotation", "centerX", "centerY", "width", "height", "shape", "maxSize",
];

export default class ImageSnipper {

  static SHAPES = SHAPES;

  static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /** The size of the box holding an image of this size once rotated. */
  static rotatedBounds(width: number, height: number, rotation: number): ISize {
    const rad = ImageSnipper.toRadians(rotation);
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    return {
      width: (width * cos) + (height * sin),
      height: (width * sin) + (height * cos),
    };
  }

  static rotatePoint(point: IPoint, rotation: number): IPoint {
    const rad = ImageSnipper.toRadians(rotation);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: (point.x * cos) - (point.y * sin),
      y: (point.x * sin) + (point.y * cos),
    };
  }

  /** Source image pixels to the rotated view's pixels (unscaled, origin at the view's top left). */
  static sourceToView(point: IPoint, source: ISize, rotation: number): IPoint {
    const bounds = ImageSnipper.rotatedBounds(source.width, source.height, rotation);
    const rotated = ImageSnipper.rotatePoint(
      { x: point.x - (source.width / 2), y: point.y - (source.height / 2) },
      rotation,
    );
    return { x: rotated.x + (bounds.width / 2), y: rotated.y + (bounds.height / 2) };
  }

  static viewToSource(point: IPoint, source: ISize, rotation: number): IPoint {
    const bounds = ImageSnipper.rotatedBounds(source.width, source.height, rotation);
    const unrotated = ImageSnipper.rotatePoint(
      { x: point.x - (bounds.width / 2), y: point.y - (bounds.height / 2) },
      -rotation,
    );
    return { x: unrotated.x + (source.width / 2), y: unrotated.y + (source.height / 2) };
  }

  static isEqualSided(shape: TDDBImageSnipShape): boolean {
    return shape === "square" || shape === "circle";
  }

  /** Square and circle cuts have equal sides; an uneven hand-edited entry takes the shorter side. */
  static normaliseSnip(snip: IDDBImageSnip): IDDBImageSnip {
    const shape = SHAPES.includes(snip.shape) ? snip.shape : "rectangle";
    if (!ImageSnipper.isEqualSided(shape)) return { ...snip, shape };
    const side = Math.min(snip.width, snip.height);
    return { ...snip, shape, width: side, height: side };
  }

  /**
   * Rescale a snip to the size of the image actually served. DDB can serve the same art at a
   * different resolution than the one the snip was authored against; the cut keeps its place.
   */
  static scaledSnip(snip: IDDBImageSnip, naturalWidth: number, naturalHeight: number): IDDBImageSnip {
    const normalised = ImageSnipper.normaliseSnip(snip);
    if (!normalised.sourceWidth || naturalWidth === normalised.sourceWidth) return normalised;
    const scale = naturalWidth / normalised.sourceWidth;
    return {
      ...normalised,
      sourceWidth: naturalWidth,
      sourceHeight: naturalHeight,
      centerX: normalised.centerX * scale,
      centerY: normalised.centerY * scale,
      width: normalised.width * scale,
      height: normalised.height * scale,
    };
  }

  /** The pixel size of the finished cut, after `maxSize` has scaled it down (never up). */
  static outputSize(snip: IDDBImageSnip): ISize & { scale: number } {
    const width = Math.max(1, Math.round(snip.width));
    const height = Math.max(1, Math.round(snip.height));
    const longest = Math.max(width, height);
    if (!snip.maxSize || snip.maxSize <= 0 || longest <= snip.maxSize) {
      return { width, height, scale: 1 };
    }
    const scale = snip.maxSize / longest;
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
      scale,
    };
  }

  /** A snip with its fields in a fixed order and undefined optional fields dropped. */
  static orderedSnip(snip: IDDBImageSnip): IDDBImageSnip {
    const ordered: Record<string, unknown> = {};
    for (const key of SNIP_KEYS) {
      if (snip[key] !== undefined && snip[key] !== null) ordered[key] = snip[key];
    }
    return ordered as unknown as IDDBImageSnip;
  }

  /**
   * The session lookup key for a downloaded image. Plain downloads are keyed by URL, so a snip adds
   * its instructions to keep two different cuts of one image apart.
   */
  static lookupKey(url: string, snip?: IDDBImageSnip | null): string {
    if (!snip) return url;
    return `${url}#snip:${JSON.stringify(ImageSnipper.orderedSnip(ImageSnipper.normaliseSnip(snip)))}`;
  }

  /**
   * A short stable hash of the cut, added to saved file names. Companions added to the world do
   * not force an image refresh, so without it an earlier uncut download of the same name, or an
   * older cut, would be reused.
   */
  static snipHash(snip: IDDBImageSnip): string {
    const text = ImageSnipper.lookupKey("", snip);
    // FNV-1a, 32 bit
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(36);
  }

  static isSnip(value: unknown): value is IDDBImageSnip {
    if (!value || typeof value !== "object") return false;
    const snip = value as Record<string, unknown>;
    return typeof snip.url === "string"
      && ["sourceWidth", "sourceHeight", "rotation", "centerX", "centerY", "width", "height"]
        .every((key) => typeof snip[key] === "number" && Number.isFinite(snip[key]))
      && (snip.width as number) > 0
      && (snip.height as number) > 0;
  }

  /**
   * The entry as text ready to paste into the proxy's snip-images.js: a quoted name, the entry,
   * and a trailing comma.
   */
  static formatSnipEntry(name: string, entry: IDDBImageSnipEntry): string {
    const output: IDDBImageSnipEntry = {};
    if (entry.actor) output.actor = ImageSnipper.orderedSnip(ImageSnipper.normaliseSnip(entry.actor));
    if (entry.token) output.token = ImageSnipper.orderedSnip(ImageSnipper.normaliseSnip(entry.token));
    const body = JSON.stringify(output, null, 2).replace(/\n/g, "\n  ");
    return `  ${JSON.stringify(name)}: ${body},`;
  }

  /**
   * Read back text written by formatSnipEntry, or a bare `{ actor, token }` object. Returns null
   * when the text holds neither.
   */
  static parseSnipEntry(text: string): { name: string | null; entry: IDDBImageSnipEntry } | null {
    const trimmed = text.trim().replace(/,\s*$/, "");
    if (trimmed === "") return null;
    let name: string | null = null;
    let value: unknown;
    try {
      if (trimmed.startsWith("{")) {
        value = JSON.parse(trimmed);
      } else {
        const wrapped = JSON.parse(`{${trimmed}}`) as Record<string, unknown>;
        const keys = Object.keys(wrapped);
        if (keys.length !== 1) return null;
        name = keys[0];
        value = wrapped[name];
      }
    } catch (_error) {
      return null;
    }
    if (!value || typeof value !== "object") return null;
    const raw = value as Record<string, unknown>;
    const entry: IDDBImageSnipEntry = {};
    if (ImageSnipper.isSnip(raw.actor)) entry.actor = ImageSnipper.normaliseSnip(raw.actor);
    if (ImageSnipper.isSnip(raw.token)) entry.token = ImageSnipper.normaliseSnip(raw.token);
    if (!entry.actor && !entry.token) return null;
    return { name, entry };
  }

  static createCanvas(width: number, height: number): TSnipCanvas {
    if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
    return Object.assign(document.createElement("canvas"), { width, height });
  }

  /**
   * Draw the finished cut into a context that is already `output.width` x `output.height`.
   * Anything outside the image (the corners exposed by rotation) and outside a circle stays
   * transparent.
   */
  static drawSnip(ctx: TSnipContext, source: ImageBitmap, snip: IDDBImageSnip): ISize {
    const scaled = ImageSnipper.scaledSnip(snip, source.width, source.height);
    const output = ImageSnipper.outputSize(scaled);
    ctx.clearRect(0, 0, output.width, output.height);
    ctx.save();
    if (scaled.shape === "circle") {
      ctx.beginPath();
      ctx.ellipse(output.width / 2, output.height / 2, output.width / 2, output.height / 2, 0, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.translate(output.width / 2, output.height / 2);
    ctx.scale(output.width / scaled.width, output.height / scaled.height);
    ctx.rotate(ImageSnipper.toRadians(scaled.rotation));
    ctx.translate(-scaled.centerX, -scaled.centerY);
    ctx.drawImage(source, 0, 0);
    ctx.restore();
    return output;
  }

  static renderSnip(source: ImageBitmap, snip: IDDBImageSnip): TSnipCanvas {
    const output = ImageSnipper.outputSize(ImageSnipper.scaledSnip(snip, source.width, source.height));
    const canvas = ImageSnipper.createCanvas(output.width, output.height);
    const ctx = canvas.getContext("2d") as TSnipContext | null;
    if (!ctx) throw new Error("ImageSnipper: could not acquire a 2d context");
    ImageSnipper.drawSnip(ctx, source, snip);
    return canvas;
  }

  static async canvasToBlob(canvas: TSnipCanvas): Promise<Blob> {
    if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
      return canvas.convertToBlob({ type: "image/png" });
    }
    return new Promise<Blob>((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("ImageSnipper: toBlob returned null"))),
        "image/png",
      );
    });
  }

  /** Cut a downloaded image; the result is always a PNG so circles and rotated corners keep their alpha. */
  static async snipBlob(blob: Blob, snip: IDDBImageSnip): Promise<Blob> {
    const bitmap = await createImageBitmap(blob);
    try {
      return await ImageSnipper.canvasToBlob(ImageSnipper.renderSnip(bitmap, snip));
    } finally {
      bitmap.close();
    }
  }
}
