// Sample the edge pixels of an image and return the most common color as a
// hex string. Used to set a sympathetic background color on imported map
// scenes so the area around the painted image blends in.
//
// Method:
//   1. Walk top, bottom, left, right strips of `edgeWidth` pixels.
//   2. Quantise each pixel's RGB to 4 bits per channel (4096 buckets) so
//      near-identical shades cluster.
//   3. Count occurrences and return the bucket with the highest count
//      converted back to a 6-digit hex string.

export interface IEdgeColorOptions {
  edgeWidth?: number;
  // If true, transparent pixels (alpha < 128) are skipped.
  ignoreTransparent?: boolean;
}

export async function sampleEdgeBackgroundColor(
  blob: Blob,
  options: IEdgeColorOptions = {},
): Promise<string | null> {
  const edgeWidth = options.edgeWidth ?? 20;
  const ignoreTransparent = options.ignoreTransparent ?? true;

  const bitmap = await createImageBitmap(blob);
  const w = bitmap.width;
  const h = bitmap.height;
  const e = Math.max(1, Math.min(edgeWidth, Math.floor(Math.min(w, h) / 4)));

  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(w, h);
    const c = canvas.getContext("2d");
    if (!c) {
      if (typeof bitmap.close === "function") bitmap.close();
      return null;
    }
    ctx = c;
  } else {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext("2d");
    if (!c) {
      if (typeof bitmap.close === "function") bitmap.close();
      return null;
    }
    ctx = c;
  }
  ctx.drawImage(bitmap as any, 0, 0);

  const counts = new Map<number, number>();
  const sampleStrip = (sx: number, sy: number, sw: number, sh: number) => {
    if (sw <= 0 || sh <= 0) return;
    const data = ctx.getImageData(sx, sy, sw, sh).data;
    for (let i = 0; i < data.length; i += 4) {
      if (ignoreTransparent && data[i + 3] < 128) continue;
      // 4 bits per channel: shift right then back left so the quantised value
      // sits in the centre of each bucket. This avoids the common dark-bias
      // you get from a plain `& 0xF0` mask.
      const r = ((data[i] >> 4) << 4) | 0x08;
      const g = ((data[i + 1] >> 4) << 4) | 0x08;
      const b = ((data[i + 2] >> 4) << 4) | 0x08;
      const key = (r << 16) | (g << 8) | b;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  };

  sampleStrip(0, 0, w, e);
  sampleStrip(0, h - e, w, e);
  sampleStrip(0, e, e, h - 2 * e);
  sampleStrip(w - e, e, e, h - 2 * e);

  if (typeof bitmap.close === "function") bitmap.close();

  if (!counts.size) return null;
  let bestKey = -1;
  let bestCount = 0;
  for (const [k, n] of counts) {
    if (n > bestCount) {
      bestCount = n;
      bestKey = k;
    }
  }
  if (bestKey < 0) return null;
  const r = (bestKey >> 16) & 0xFF;
  const g = (bestKey >> 8) & 0xFF;
  const b = bestKey & 0xFF;
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}
