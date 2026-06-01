import { logger, utils, DDBProxy, FileHelper } from "./_module";

interface FrameAnimatorInput {
  // Base frame PNG. Usually omitted (pass null) when extras are present
  // because DDB hides the base via CSS display:none for animated frames.
  baseUrl: string | null;
  spriteUrl: string;
  reflectionUrl?: string | null;
  frameWidth?: number | null;
  frameHeight?: number | null;
  frameCount?: number | null;
  gridCols?: number | null;
  gridRows?: number | null;
  durationMs?: number | null;
  cssAnimationName?: string | null;
}

interface ResolvedSpriteGeometry {
  // Actual source slice dimensions in pixels of the sprite PNG. Derived from
  // naturalWidth/cols and naturalHeight/rows  the CSS frameWidth/frameHeight
  // is a display size and does not always match the source cell pitch
  // (e.g. cauldronsprite.png is 1500x1500 with background-size:1300px,
  // giving 150px source cells displayed as 130px).
  sliceWidth: number;
  sliceHeight: number;
  count: number;
  cols: number;
  rows: number;
  durationMs: number;
}

const OUTPUT_SIZE = 400;
const DEFAULT_DURATION_MS = 350;
const RECORD_LOOPS = 4;
const MIME_PREFS = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

export default class FrameAnimator {

  static parseCssAnimationName(name: string | null | undefined): { width?: number; height?: number; cols?: number; rows?: number; count?: number } {
    if (!name) return {};
    const m = name.match(/animatedFrameWidth(\d+)(?:Height(\d+))?Frame(\d+)(?:x(\d+))?/i);
    if (!m) return {};
    const width = parseInt(m[1], 10);
    const height = m[2] ? parseInt(m[2], 10) : width;
    const cols = parseInt(m[3], 10);
    const rows = m[4] ? parseInt(m[4], 10) : 1;
    return { width, height, cols, rows, count: cols * rows };
  }

  static pickMimeType(): string | null {
    for (const m of MIME_PREFS) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
    }
    return null;
  }

  static async loadImage(url: string): Promise<HTMLImageElement> {
    const stripProtocol = utils.getSetting<boolean>("cors-strip-protocol");
    const corsPathPrefix = utils.getSetting<string>("cors-path-prefix");
    const urlEncode = utils.getSetting<boolean>("cors-encode");
    const proxyEndpoint = DDBProxy.getCORSProxy();
    const clean = url.split("?")[0];
    const fiddled = stripProtocol ? clean.replace(/^https:\/\//, corsPathPrefix) : `${corsPathPrefix}${clean}`;
    const target = urlEncode ? encodeURIComponent(fiddled) : fiddled;
    const proxied = proxyEndpoint + target;
    const blob = await FileHelper.downloadImage(proxied);
    const objectUrl = URL.createObjectURL(blob);
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = objectUrl;
      });
    } finally {
      // revoke after the image has either loaded or errored; small delay to
      // avoid pulling the rug from under the decoder on some browsers
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    }
  }

  static resolveGeometry(input: FrameAnimatorInput, sprite: HTMLImageElement): ResolvedSpriteGeometry | null {
    const parsed = FrameAnimator.parseCssAnimationName(input.cssAnimationName);
    const cssWidth = input.frameWidth ?? parsed.width ?? null;
    const cssHeight = input.frameHeight ?? parsed.height ?? cssWidth;
    let cols = input.gridCols ?? parsed.cols ?? null;
    let rows = input.gridRows ?? parsed.rows ?? 1;
    let count = input.frameCount ?? parsed.count ?? null;
    // Derive cols/rows from the natural sprite size when we have a CSS cell
    // size to divide by; this is the fallback when the CSS name only encodes
    // one dimension. Otherwise leave as-is.
    if (!cols && cssWidth) cols = Math.max(1, Math.round(sprite.naturalWidth / cssWidth));
    if (!rows && cssHeight) rows = Math.max(1, Math.round(sprite.naturalHeight / cssHeight));
    if (!count && cols && rows) count = cols * rows;
    if (!cols || !rows || !count) {
      logger.warn("FrameAnimator: could not resolve sprite geometry", { cssWidth, cssHeight, cols, rows, count, naturalWidth: sprite.naturalWidth, naturalHeight: sprite.naturalHeight, input });
      return null;
    }
    // Critical: source slice dimensions come from the natural image, not the
    // CSS frame size. DDB sometimes uses background-size to display a larger
    // sprite at a smaller cell pitch (e.g. cauldronsprite.png natural 1500x1500
    // rendered as 1300x1300 via background-size:1300px -> 150px source cells
    // displayed as 130px). Slicing 130-wide cells from the natural image would
    // drift across the sheet and look like the frame is translating.
    const sliceWidth = sprite.naturalWidth / cols;
    const sliceHeight = sprite.naturalHeight / rows;
    const durationMs = input.durationMs ?? DEFAULT_DURATION_MS;
    return { sliceWidth, sliceHeight, count, cols, rows, durationMs };
  }

  static drawComposite(ctx: CanvasRenderingContext2D, size: number, base: HTMLImageElement | null, sprite: HTMLImageElement, geometry: ResolvedSpriteGeometry, frameIndex: number, reflection: HTMLImageElement | null) {
    ctx.clearRect(0, 0, size, size);
    // Letterbox the slice inside the square output canvas using the source
    // cell's aspect ratio. Frames like Animated Aurora are taller than wide
    // (112x150 cells) and would otherwise be squashed to fit a square dest.
    const aspect = geometry.sliceWidth / geometry.sliceHeight;
    let dw, dh;
    if (aspect >= 1) {
      dw = size;
      dh = size / aspect;
    } else {
      dh = size;
      dw = size * aspect;
    }
    const dx = (size - dw) / 2;
    const dy = (size - dh) / 2;
    if (base) ctx.drawImage(base, dx, dy, dw, dh);
    const idx = frameIndex % geometry.count;
    const col = idx % geometry.cols;
    const row = Math.floor(idx / geometry.cols);
    const sx = col * geometry.sliceWidth;
    const sy = row * geometry.sliceHeight;
    ctx.drawImage(sprite, sx, sy, geometry.sliceWidth, geometry.sliceHeight, dx, dy, dw, dh);
    if (reflection) ctx.drawImage(reflection, dx, dy, dw, dh);
  }

  // Build an animated WebM blob from the three DDB layers.
  // Returns null when the browser cannot record alpha-capable WebM, or when
  // any required layer fails to load.
  static async buildWebM(input: FrameAnimatorInput): Promise<Blob | null> {
    if (!input.spriteUrl) return null;
    const mime = FrameAnimator.pickMimeType();
    if (!mime) {
      logger.warn("FrameAnimator: no supported WebM mime type, skipping animated frame build");
      return null;
    }

    let sprite: HTMLImageElement;
    let base: HTMLImageElement | null = null;
    let reflection: HTMLImageElement | null = null;
    try {
      sprite = await FrameAnimator.loadImage(input.spriteUrl);
      if (input.baseUrl) base = await FrameAnimator.loadImage(input.baseUrl);
      if (input.reflectionUrl) reflection = await FrameAnimator.loadImage(input.reflectionUrl);
    } catch (err) {
      logger.warn("FrameAnimator: layer download failed", err);
      return null;
    }

    const geometry = FrameAnimator.resolveGeometry(input, sprite);
    if (!geometry) return null;

    const size = OUTPUT_SIZE;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return null;

    const frameDurationMs = geometry.durationMs / geometry.count;
    // Cap captureStream fps so the encoder has a stable max rate even if
    // individual draws spike. The stream samples the canvas on its own
    // cadence; our loop just ensures the canvas content is up-to-date.
    const fps = Math.max(1, Math.min(60, Math.round(1000 / frameDurationMs)));
    const stream: MediaStream = (canvas as any).captureStream(fps);
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const totalMs = geometry.durationMs * RECORD_LOOPS;
    const videoTrack: any = stream.getVideoTracks()[0];
    const supportsRequestFrame = typeof videoTrack?.requestFrame === "function";

    return new Promise<Blob | null>((resolve) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        try {
          recorder.stop();
        } catch { /* ignore */ }
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunks.length === 0) return resolve(null);
        resolve(new Blob(chunks, { type: mime }));
      };
      recorder.onerror = () => {
        stream.getTracks().forEach((t) => t.stop()); resolve(null);
      };

      // Prime the canvas with the first composite so the first frame is non-empty
      FrameAnimator.drawComposite(ctx, size, base, sprite, geometry, 0, reflection);
      recorder.start();
      const startedAt = performance.now();
      let lastDrawnIndex = -1;

      // Drive the canvas updates from rAF anchored to elapsed wall-clock time
      // rather than chained setTimeouts. If a tick is late we skip ahead to
      // the cell that *should* be visible at this real time, so the encoded
      // WebM stays accurate even when the host throttles timers (background
      // tabs, GC pauses). When requestFrame() is available we explicitly nudge
      // the captureStream sampler each tick - important because Chrome only
      // emits stream frames when the canvas changes.
      const tick = () => {
        if (finished) return;
        const elapsed = performance.now() - startedAt;
        if (elapsed >= totalMs) {
          finish();
          return;
        }
        const idx = Math.min(
          Math.floor(elapsed / frameDurationMs),
          geometry.count * RECORD_LOOPS - 1,
        );
        if (idx !== lastDrawnIndex) {
          FrameAnimator.drawComposite(ctx, size, base, sprite, geometry, idx, reflection);
          if (supportsRequestFrame) {
            try {
              videoTrack.requestFrame();
            } catch { /* not all browsers */ }
          }
          lastDrawnIndex = idx;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      // Safety stop in case rAF stops firing (page hidden) - gives the recorder
      // one full intended duration plus a generous tail to flush
      setTimeout(finish, totalMs + 1000);
    });
  }

  static hasAnimation(extras: IDDBAvatarFrameExtras | null | undefined): boolean {
    if (!extras) return false;
    if ((extras as any).type === "sprite") return !!(extras as IDDBAvatarFrameSpriteExtras).animatedAvatarFrameUrl;
    return false;
  }

  static isSpriteExtras(extras: IDDBAvatarFrameExtras | null | undefined): extras is IDDBAvatarFrameSpriteExtras {
    return !!extras && (extras as any).type === "sprite";
  }

}
