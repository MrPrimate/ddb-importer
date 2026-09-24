import logger from "../../lib/Logger";

const pending = new Map<string, Promise<PIXI.Texture | null>>();
const reported = new Set<string>();
const failures = new Map<string, number>();
const FAILURE_COOLDOWN_MS = 60_000;

/** Share in-flight loads; Foundry owns the successful texture cache and its lifetime. */
export function loadDisplayTexture(src: string): Promise<PIXI.Texture | null> {
  if (!src) return Promise.resolve(null);
  if ((failures.get(src) ?? 0) > Date.now()) return Promise.resolve(null);
  const existing = pending.get(src);
  if (existing) return existing;
  const promise = (async () => {
    try {
      if ((/\.(?:webm|mp4|m4v|ogg)(?:[?#]|$)/i).test(src)) throw new Error("Choose a static image");
      const texture = await foundry.canvas.loadTexture(src);
      if (!texture || !("valid" in texture) || !texture.valid) throw new Error("Image could not be loaded");
      failures.delete(src);
      return texture;
    } catch (error) {
      failures.set(src, Date.now() + FAILURE_COOLDOWN_MS);
      if (failures.size > 256) failures.delete(failures.keys().next().value!);
      if (!reported.has(src)) {
        reported.add(src);
        if (reported.size > 256) reported.delete(reported.values().next().value!);
        logger.warn("Region display image could not be loaded", { src, error });
      }
      return null;
    }
  })();
  pending.set(src, promise);
  void promise.finally(() => pending.delete(src));
  return promise;
}

/** Image Points fit inside a square; tiles keep the image's natural aspect ratio. */
export function imageDimensions(pattern: TRegionDisplayPattern, aspect: number, period: number, thickness: number) {
  const ratio = Math.max(0.0001, aspect);
  if (pattern === "imagePoints") {
    return { width: period * thickness * Math.min(1, ratio), height: (period * thickness) / Math.max(1, ratio) };
  }
  return { width: period, height: period / ratio };
}

/** Centre a single image in the combined region bounds, optionally retaining its proportions. */
export function imageFillDimensions(
  fit: IRegionDisplayProfile["textureFit"],
  aspect: number,
  width: number,
  height: number,
) {
  const ratio = Math.max(0.0001, aspect);
  const w = fit === "contain" ? Math.min(width, height * ratio) : width;
  const h = fit === "contain" ? Math.min(height, width / ratio) : height;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}
