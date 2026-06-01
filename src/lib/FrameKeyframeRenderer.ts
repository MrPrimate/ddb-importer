import { logger, utils, DDBProxy, FileHelper } from "./_module";

// Renders DDB's bespoke @keyframes-driven frame animations (fishSwim,
// eyeballBlink/2, mtofPlanet1/2, mtofGears) by interpreting a subset of
// CSS transform + background-position over time on a Canvas2D, capturing
// the result into an animated WebM via MediaRecorder.

interface KeyframeRendererInput {
  baseFrameUrl: string;
  extras: IDDBAvatarFrameKeyframeExtras;
}

interface LoadedLayer {
  spec: IDDBAvatarFrameKeyframeLayer;
  image: HTMLImageElement;
  bgWidthCss: number; // background-image displayed width in CSS px
  bgHeightCss: number;
}

interface ParsedTransform {
  translateX: number; // px in layer-local space
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotateRad: number;
  flipX: boolean; // rotateY(180deg) approximation
}

const OUTPUT_SIZE = 400;
const TARGET_FPS = 30;
const LOOP_DURATION_CAP_MS = 30_000;
const MIME_PREFS = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

export default class FrameKeyframeRenderer {

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
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    }
  }

  // Parse a CSS transform value list into a flat set of numbers. Supports the
  // primitives DDB actually uses: translate/translate3d, translateX/Y,
  // scale/scaleX/scaleY, rotate, rotateY (treated as horizontal flip when
  // |angle| >= 90deg).
  static parseTransform(value: string | null | undefined, layerWidth: number, layerHeight: number): ParsedTransform {
    const out: ParsedTransform = { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1, rotateRad: 0, flipX: false };
    if (!value) return out;
    const fnRe = /([a-zA-Z]+[a-zA-Z0-9]*)\(([^)]*)\)/g;
    let m;
    while ((m = fnRe.exec(value)) !== null) {
      const fn = m[1].toLowerCase();
      const args = m[2].split(",").map((s) => s.trim());
      switch (fn) {
        case "translate":
        case "translate3d": {
          const tx = FrameKeyframeRenderer._parseLength(args[0], layerWidth);
          const ty = FrameKeyframeRenderer._parseLength(args[1] || "0", layerHeight);
          out.translateX += tx;
          out.translateY += ty;
          break;
        }
        case "translatex":
          out.translateX += FrameKeyframeRenderer._parseLength(args[0], layerWidth);
          break;
        case "translatey":
          out.translateY += FrameKeyframeRenderer._parseLength(args[0], layerHeight);
          break;
        case "translatez":
          // 2D canvas has no Z axis; safely ignore
          break;
        case "scale":
          out.scaleX *= parseFloat(args[0]);
          out.scaleY *= args[1] != null ? parseFloat(args[1]) : parseFloat(args[0]);
          break;
        case "scalex":
          out.scaleX *= parseFloat(args[0]);
          break;
        case "scaley":
          out.scaleY *= parseFloat(args[0]);
          break;
        case "rotate":
        case "rotatez": {
          out.rotateRad += FrameKeyframeRenderer._parseAngle(args[0]);
          break;
        }
        case "rotatey": {
          const a = FrameKeyframeRenderer._parseAngle(args[0]);
          // Treat any rotateY beyond 90 degrees magnitude as a horizontal flip
          // (canvas is 2D, so we approximate). DDB only uses 0 or 180 degrees.
          if (Math.abs(a) >= Math.PI / 2) out.flipX = !out.flipX;
          break;
        }
        default:
          // unknown function - ignore
          break;
      }
    }
    return out;
  }

  static _parseLength(token: string, basis: number): number {
    if (!token) return 0;
    const t = token.trim();
    if (t.endsWith("%")) return (parseFloat(t) / 100) * basis;
    if (t.endsWith("px")) return parseFloat(t);
    if (t === "0") return 0;
    const f = parseFloat(t);
    return Number.isNaN(f) ? 0 : f;
  }

  static _parseAngle(token: string): number {
    if (!token) return 0;
    const t = token.trim();
    if (t.endsWith("deg")) return (parseFloat(t) * Math.PI) / 180;
    if (t.endsWith("turn")) return parseFloat(t) * 2 * Math.PI;
    if (t.endsWith("rad")) return parseFloat(t);
    return (parseFloat(t) * Math.PI) / 180;
  }

  static parseTransformOrigin(value: string | null | undefined, layerWidth: number, layerHeight: number): { x: number; y: number } {
    if (!value) return { x: layerWidth / 2, y: layerHeight / 2 };
    const parts = value.trim().split(/\s+/);
    const x = FrameKeyframeRenderer._parseLengthOrKeyword(parts[0], layerWidth, "x");
    const y = parts[1] != null
      ? FrameKeyframeRenderer._parseLengthOrKeyword(parts[1], layerHeight, "y")
      : layerHeight / 2;
    return { x, y };
  }

  static _parseLengthOrKeyword(token: string, basis: number, _axis: "x" | "y"): number {
    if (!token) return basis / 2;
    const t = token.trim().toLowerCase();
    if (t === "left" || t === "top") return 0;
    if (t === "right" || t === "bottom") return basis;
    if (t === "center") return basis / 2;
    return FrameKeyframeRenderer._parseLength(t, basis);
  }

  // Find the keyframe pair surrounding `pct` and produce an interpolated
  // transform string + interpolated bgPosition. For steps(1) timing we snap
  // to the lower keyframe (no interpolation).
  static sampleKeyframes(steps: IDDBAvatarFrameKeyframeStep[], pct: number, timingFunction: string) {
    if (steps.length === 0) return { transform: null as string | null, backgroundPosition: null as string | null, opacity: 1 };
    if (steps.length === 1) {
      const d = steps[0].decls;
      return { transform: d.transform ?? null, backgroundPosition: d.backgroundPosition ?? null, opacity: d.opacity ?? 1 };
    }
    // Find left/right pair
    let left = steps[0];
    let right = steps[steps.length - 1];
    for (let i = 0; i < steps.length - 1; i++) {
      if (steps[i].pct <= pct && steps[i + 1].pct >= pct) {
        left = steps[i];
        right = steps[i + 1];
        break;
      }
    }
    const isSteps = (/^steps\(/i).test(timingFunction || "");
    if (isSteps) {
      return {
        transform: left.decls.transform ?? null,
        backgroundPosition: left.decls.backgroundPosition ?? null,
        opacity: left.decls.opacity ?? 1,
      };
    }
    const range = right.pct - left.pct;
    const t = range > 0 ? (pct - left.pct) / range : 0;
    return {
      transform: FrameKeyframeRenderer._interpTransform(left.decls.transform, right.decls.transform, t),
      backgroundPosition: FrameKeyframeRenderer._interpBgPosition(left.decls.backgroundPosition, right.decls.backgroundPosition, t),
      opacity: FrameKeyframeRenderer._interpNumber(left.decls.opacity, right.decls.opacity, t, 1),
    };
  }

  // Interpolate two transform value strings by tokenising their numeric args
  // pairwise. Falls back to the left value when shapes differ (functions out
  // of order, etc).
  static _interpTransform(a: string | undefined, b: string | undefined, t: number): string | null {
    if (a == null && b == null) return null;
    if (a == null) return b!;
    if (b == null) return a;
    const fnsA = FrameKeyframeRenderer._tokeniseTransform(a);
    const fnsB = FrameKeyframeRenderer._tokeniseTransform(b);
    if (fnsA.length !== fnsB.length) return a;
    const out: string[] = [];
    for (let i = 0; i < fnsA.length; i++) {
      const fa = fnsA[i]; const fb = fnsB[i];
      if (fa.fn !== fb.fn || fa.args.length !== fb.args.length) return a;
      const blended = fa.args.map((av, j) => FrameKeyframeRenderer._blendArg(av, fb.args[j], t));
      out.push(`${fa.fn}(${blended.join(",")})`);
    }
    return out.join(" ");
  }

  static _tokeniseTransform(value: string): { fn: string; args: string[] }[] {
    const fnRe = /([a-zA-Z]+[a-zA-Z0-9]*)\(([^)]*)\)/g;
    const out: { fn: string; args: string[] }[] = [];
    let m;
    while ((m = fnRe.exec(value)) !== null) {
      out.push({ fn: m[1].toLowerCase(), args: m[2].split(",").map((s) => s.trim()) });
    }
    return out;
  }

  static _blendArg(a: string, b: string, t: number): string {
    const ua = FrameKeyframeRenderer._unit(a);
    const ub = FrameKeyframeRenderer._unit(b);
    if (ua !== ub) return a;
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (Number.isNaN(na) || Number.isNaN(nb)) return a;
    const blended = na + (nb - na) * t;
    return `${blended}${ua}`;
  }

  static _unit(s: string): string {
    const m = s.trim().match(/(-?[\d.]+)([a-z%]*)/i);
    return m ? m[2] : "";
  }

  static _interpBgPosition(a: string | undefined, b: string | undefined, t: number): string | null {
    if (a == null) return b ?? null;
    if (b == null) return a;
    const pa = a.trim().split(/\s+/);
    const pb = b.trim().split(/\s+/);
    if (pa.length !== pb.length) return a;
    const out = pa.map((s, i) => FrameKeyframeRenderer._blendArg(s, pb[i], t));
    return out.join(" ");
  }

  static _interpNumber(a: number | undefined, b: number | undefined, t: number, def: number): number {
    const av = a ?? def;
    const bv = b ?? def;
    return av + (bv - av) * t;
  }

  static lcm(a: number, b: number): number {
    const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));
    return Math.abs(a * b) / gcd(Math.round(a), Math.round(b));
  }

  static computeLoopDurationMs(extras: IDDBAvatarFrameKeyframeExtras): number {
    const durations: number[] = [];
    for (const l of extras.layers) {
      if (l.animation?.durationMs && l.animation.durationMs > 0) durations.push(l.animation.durationMs);
    }
    if (extras.baseAnimation?.durationMs && extras.baseAnimation.durationMs > 0) {
      durations.push(extras.baseAnimation.durationMs);
    }
    if (durations.length === 0) return 5000;
    let lcm = Math.round(durations[0]);
    for (let i = 1; i < durations.length; i++) lcm = FrameKeyframeRenderer.lcm(lcm, Math.round(durations[i]));
    return Math.min(lcm, LOOP_DURATION_CAP_MS);
  }

  // Draw one frame at time T (ms within the loop). All coordinates are
  // expressed in CSS px relative to the avatar root (same as DDB's CSS),
  // then scaled into the output canvas using the container's extents.
  static drawFrame(
    ctx: CanvasRenderingContext2D,
    outputSize: number,
    baseImage: HTMLImageElement | null,
    extras: IDDBAvatarFrameKeyframeExtras,
    layers: LoadedLayer[],
    timeMs: number,
  ) {
    ctx.clearRect(0, 0, outputSize, outputSize);
    const { container } = extras;
    const scale = outputSize / Math.max(container.width, container.height);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-container.left, -container.top);
    if (baseImage) FrameKeyframeRenderer._drawBase(ctx, baseImage, extras, timeMs);
    for (const layer of layers) {
      FrameKeyframeRenderer._drawLayer(ctx, layer, extras, timeMs);
    }
    ctx.restore();
  }

  static _drawBase(ctx: CanvasRenderingContext2D, baseImage: HTMLImageElement, extras: IDDBAvatarFrameKeyframeExtras, timeMs: number) {
    const { container, baseAnimation } = extras;
    const w = container.width;
    const h = container.height;
    const left = container.left;
    const top = container.top;
    if (!baseAnimation) {
      ctx.drawImage(baseImage, left, top, w, h);
      return;
    }
    const dur = baseAnimation.durationMs ?? 1000;
    const pct = ((timeMs % dur) / dur) * 100;
    const steps = extras.keyframes[baseAnimation.name] || [];
    const sample = FrameKeyframeRenderer.sampleKeyframes(steps, pct, baseAnimation.timingFunction);
    const t = FrameKeyframeRenderer.parseTransform(sample.transform, w, h);
    const origin = FrameKeyframeRenderer.parseTransformOrigin(extras.baseTransformOrigin, w, h);
    ctx.save();
    // Translate to base position, then apply transform around the origin
    ctx.translate(left, top);
    ctx.translate(origin.x, origin.y);
    ctx.translate(t.translateX, t.translateY);
    if (t.flipX) ctx.scale(-1, 1);
    ctx.scale(t.scaleX, t.scaleY);
    ctx.rotate(t.rotateRad);
    ctx.translate(-origin.x, -origin.y);
    ctx.drawImage(baseImage, 0, 0, w, h);
    ctx.restore();
  }

  static _drawLayer(ctx: CanvasRenderingContext2D, layer: LoadedLayer, extras: IDDBAvatarFrameKeyframeExtras, timeMs: number) {
    const spec = layer.spec;
    const w = spec.width ?? 0;
    const h = spec.height ?? 0;
    if (!w || !h) return;
    const left = spec.left ?? 0;
    const top = spec.top ?? 0;
    const anim = spec.animation;
    // Static layer (no animation): draw with only the initial transform.
    let keyTransform = { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1, rotateRad: 0, flipX: false };
    let opacity = 1;
    let bgPos = spec.bgPosition;
    if (anim) {
      const dur = anim.durationMs ?? 1000;
      const localPct = ((timeMs % dur) / dur) * 100;
      const steps = extras.keyframes[anim.name] || [];
      const sample = FrameKeyframeRenderer.sampleKeyframes(steps, localPct, anim.timingFunction);
      keyTransform = FrameKeyframeRenderer.parseTransform(sample.transform, w, h);
      opacity = sample.opacity ?? 1;
      bgPos = sample.backgroundPosition ?? spec.bgPosition;
    }
    const initial = FrameKeyframeRenderer.parseTransform(spec.transformInitial, w, h);
    const origin = FrameKeyframeRenderer.parseTransformOrigin(spec.transformOrigin, w, h);
    ctx.save();
    ctx.globalAlpha *= opacity;
    ctx.translate(left, top);
    ctx.translate(origin.x, origin.y);
    ctx.translate(initial.translateX + keyTransform.translateX, initial.translateY + keyTransform.translateY);
    if (initial.flipX !== keyTransform.flipX) ctx.scale(-1, 1);
    ctx.scale(initial.scaleX * keyTransform.scaleX, initial.scaleY * keyTransform.scaleY);
    ctx.rotate(initial.rotateRad + keyTransform.rotateRad);
    ctx.translate(-origin.x, -origin.y);
    FrameKeyframeRenderer._drawLayerImage(ctx, layer, w, h, bgPos);
    ctx.restore();
  }

  static _drawLayerImage(ctx: CanvasRenderingContext2D, layer: LoadedLayer, w: number, h: number, bgPos: string | null | undefined) {
    const img = layer.image;
    const dw = layer.bgWidthCss;
    const dh = layer.bgHeightCss;
    // Source rectangle in the image's natural coords; map to css px via dw/dh
    const sxFraction = FrameKeyframeRenderer._bgPositionFraction(bgPos, "x", dw, w);
    const syFraction = FrameKeyframeRenderer._bgPositionFraction(bgPos, "y", dh, h);
    // bg-size scales natural to displayed dw/dh; source px per displayed px:
    const sourceScaleX = img.naturalWidth / dw;
    const sourceScaleY = img.naturalHeight / dh;
    const sx = sxFraction * sourceScaleX;
    const sy = syFraction * sourceScaleY;
    const sliceW = w * sourceScaleX;
    const sliceH = h * sourceScaleY;
    // Clamp to image bounds defensively
    const sx2 = Math.max(0, Math.min(sx, img.naturalWidth - 1));
    const sy2 = Math.max(0, Math.min(sy, img.naturalHeight - 1));
    const sw = Math.max(1, Math.min(sliceW, img.naturalWidth - sx2));
    const sh = Math.max(1, Math.min(sliceH, img.naturalHeight - sy2));
    try {
      ctx.drawImage(img, sx2, sy2, sw, sh, 0, 0, w, h);
    } catch {
      // ignore draw errors (e.g. tainted canvas)
    }
  }

  // Return the source offset (in displayed-bg CSS px) for a given bg-position
  // value on a given axis. Supports "X%" and "Xpx" tokens; defaults to 0.
  static _bgPositionFraction(bgPos: string | null | undefined, axis: "x" | "y", bgDisplayed: number, layerSize: number): number {
    if (!bgPos) return 0;
    const parts = bgPos.trim().split(/\s+/);
    const token = axis === "x" ? parts[0] : (parts[1] ?? "0");
    if (!token) return 0;
    if (token.endsWith("%")) {
      const pct = parseFloat(token) / 100;
      // CSS bg-position % is positioned along (bgDisplayed - layerSize)
      return pct * Math.max(0, bgDisplayed - layerSize);
    }
    if (token.endsWith("px")) return parseFloat(token);
    return 0;
  }

  // Resolve a layer's bgSize string into displayed width/height in CSS px.
  static resolveBgSize(bgSize: string | null | undefined, layer: IDDBAvatarFrameKeyframeLayer, naturalWidth: number, naturalHeight: number): { w: number; h: number } {
    const w = layer.width ?? naturalWidth;
    const h = layer.height ?? naturalHeight;
    if (!bgSize || bgSize === "auto") return { w: naturalWidth, h: naturalHeight };
    if (bgSize === "contain") {
      const scale = Math.min(w / naturalWidth, h / naturalHeight);
      return { w: naturalWidth * scale, h: naturalHeight * scale };
    }
    if (bgSize === "cover") {
      const scale = Math.max(w / naturalWidth, h / naturalHeight);
      return { w: naturalWidth * scale, h: naturalHeight * scale };
    }
    const parts = bgSize.trim().split(/\s+/);
    const px = (tok: string, fallback: number) => {
      if (!tok || tok === "auto") return fallback;
      const m = tok.match(/^(-?[\d.]+)px$/i);
      return m ? parseFloat(m[1]) : fallback;
    };
    const dw = px(parts[0], naturalWidth);
    // If only one value given, height scales proportionally
    const dh = parts[1] != null ? px(parts[1], naturalHeight) : naturalHeight * (dw / naturalWidth);
    return { w: dw, h: dh };
  }

  static async buildWebM(input: KeyframeRendererInput): Promise<Blob | null> {
    const mime = FrameKeyframeRenderer.pickMimeType();
    if (!mime) {
      logger.warn("FrameKeyframeRenderer: no supported WebM mime, skipping");
      return null;
    }

    let baseImage: HTMLImageElement | null = null;
    if (input.baseFrameUrl) {
      try {
        baseImage = await FrameKeyframeRenderer.loadImage(input.baseFrameUrl);
      } catch (err) {
        logger.warn("FrameKeyframeRenderer: base load failed", err);
      }
    }

    const loaded: LoadedLayer[] = [];
    for (const layerSpec of input.extras.layers) {
      if (!layerSpec.imageUrl) continue;
      try {
        const image = await FrameKeyframeRenderer.loadImage(layerSpec.imageUrl);
        const sized = FrameKeyframeRenderer.resolveBgSize(layerSpec.bgSize, layerSpec, image.naturalWidth, image.naturalHeight);
        loaded.push({ spec: layerSpec, image, bgWidthCss: sized.w, bgHeightCss: sized.h });
      } catch (err) {
        logger.warn(`FrameKeyframeRenderer: layer ${layerSpec.idx} load failed`, err);
      }
    }
    if (loaded.length === 0) {
      logger.warn("FrameKeyframeRenderer: no layers loaded");
      return null;
    }

    const loopMs = FrameKeyframeRenderer.computeLoopDurationMs(input.extras);

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return null;

    const stream: MediaStream = (canvas as any).captureStream(TARGET_FPS);
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

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

      FrameKeyframeRenderer.drawFrame(ctx, OUTPUT_SIZE, baseImage, input.extras, loaded, 0);
      recorder.start();
      const startedAt = performance.now();

      // rAF + elapsed-time anchor: see FrameAnimator.buildWebM for rationale.
      const tick = () => {
        if (finished) return;
        const elapsed = performance.now() - startedAt;
        if (elapsed >= loopMs) {
          finish();
          return;
        }
        FrameKeyframeRenderer.drawFrame(ctx, OUTPUT_SIZE, baseImage, input.extras, loaded, elapsed);
        if (supportsRequestFrame) {
          try {
            videoTrack.requestFrame();
          } catch { /* not all browsers */ }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      setTimeout(finish, loopMs + 1000);
    });
  }

  static isKeyframeExtras(extras: IDDBAvatarFrameExtras | null | undefined): extras is IDDBAvatarFrameKeyframeExtras {
    return !!extras && (extras as any).type === "keyframe";
  }

}
