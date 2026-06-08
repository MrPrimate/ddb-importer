import { logger, sampleEdgeBackgroundColor } from "../../../lib/_module";

/**
 * Browser equivalent of the muncher's `image-size` lib + edge-colour sampling.
 *
 * One fetch per image → Blob → createImageBitmap (real width/height) + edge
 * pixel sampling (sympathetic background colour matching DDBMap's behaviour
 * via [sampleEdgeBackgroundColor](src/lib/ImageEdgeColor.ts#L18)). Falls back
 * to `new Image()` size probe on fetch/CORS/decode failure; edgeColor → null.
 *
 * 2000x2000 size fallback matches the muncher
 * ([Scene.js#imageSize](ddb-adventure-muncher/munch/adventure/Scenes/Scene.js)).
 * Results cached per-process so multiple scenes sharing an image probe once.
 */

// ImageSize + ImageProbeResult are declared globally in ./types.d.ts.
const FALLBACK: ImageProbeResult = { width: 2000, height: 2000, edgeColor: null };
const cache = new Map<string, Promise<ImageProbeResult>>();

// Blob-based path: fetch + decode + edge sample. Returns null on failure so
// the caller can fall back to the Image()-based size-only probe.
async function probeViaBlob(url: string, timeoutMs: number): Promise<ImageProbeResult | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let blob: Blob;
  try {
    const resp = await fetch(url, { cache: "force-cache", signal: ctrl.signal });
    if (!resp.ok) return null;
    blob = await resp.blob();
  } catch (error) {
    logger.debug(`NativeImageProbe: blob fetch failed for ${url} (${(error as Error).message})`);
    return null;
  } finally {
    clearTimeout(timer);
  }
  if (!blob) return null;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch (error) {
    logger.debug(`NativeImageProbe: createImageBitmap failed for ${url} (${(error as Error).message})`);
    return null;
  }
  const width = bitmap.width || FALLBACK.width;
  const height = bitmap.height || FALLBACK.height;
  if (typeof bitmap.close === "function") bitmap.close();

  let edgeColor: string | null = null;
  try {
    edgeColor = await sampleEdgeBackgroundColor(blob, { edgeWidth: 20 });
  } catch (error) {
    logger.debug(`NativeImageProbe: edge sampling failed for ${url} (${(error as Error).message})`);
  }
  return { width, height, edgeColor };
}

// Image()-based size-only fallback.
function probeViaImage(url: string, timeoutMs: number): Promise<ImageProbeResult> {
  return new Promise<ImageProbeResult>((resolve) => {
    const img = new Image();
    let settled = false;
    const finish = (result: ImageProbeResult) => {
      if (settled) return;
      settled = true;
      img.onload = null;
      img.onerror = null;
      resolve(result);
    };
    const timer = setTimeout(() => {
      logger.debug(`NativeImageProbe: Image timeout for ${url}, using ${FALLBACK.width}x${FALLBACK.height}`);
      finish(FALLBACK);
    }, timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      finish({ width: img.naturalWidth || FALLBACK.width, height: img.naturalHeight || FALLBACK.height, edgeColor: null });
    };
    img.onerror = () => {
      clearTimeout(timer);
      logger.debug(`NativeImageProbe: Image load error for ${url}, using ${FALLBACK.width}x${FALLBACK.height}`);
      finish(FALLBACK);
    };
    img.src = url;
  });
}

/** Probe size + edge colour. Same url → same Promise across the whole run. */
export function probeImage(url: string, timeoutMs = 5000): Promise<ImageProbeResult> {
  if (!url) return Promise.resolve(FALLBACK);
  const hit = cache.get(url);
  if (hit) return hit;
  const p = (async (): Promise<ImageProbeResult> => {
    const viaBlob = await probeViaBlob(url, timeoutMs);
    if (viaBlob) return viaBlob;
    return probeViaImage(url, timeoutMs);
  })();
  cache.set(url, p);
  return p;
}

/** Size-only shim for callers that don't need edge colour. */
export async function probeImageSize(url: string, timeoutMs = 5000): Promise<ImageSize> {
  const r = await probeImage(url, timeoutMs);
  return { width: r.width, height: r.height };
}

/** Clear the cache (tests / re-imports across runs if ever needed). */
export function clearProbeCache(): void {
  cache.clear();
}
