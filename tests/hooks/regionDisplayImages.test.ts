// @vitest-environment jsdom
import { REGION_DISPLAY_DEFAULTS, REGION_DISPLAY_PATTERN_IDS } from "../../src/config/regionDisplayProfiles";
import RegionDisplayProfiles from "../../src/lib/RegionDisplayProfiles";
import { flagFromBehaviorConfig, behaviorConfigFromFlag } from "../../src/hooks/canvas/regionDisplaySummary";
import { previewCss } from "../../src/hooks/canvas/regionDisplayPreview";
import { imageDimensions, imageFillDimensions, loadDisplayTexture } from "../../src/hooks/canvas/regionDisplayTexture";
import { applyStyle, onDrawRegion, onDestroyRegion, onRefreshRegion } from "../../src/hooks/canvas/regionDisplay";
import { imagePreviewData, paintImagePreview, paintImagePreviews, disposeImagePreviews } from "../../src/hooks/canvas/regionDisplayImagePreview";
import { imageFormContext } from "../../src/apps/lib/regionDisplayImageForm";
import { resetDDBDisplayShaderClass } from "../../src/hooks/canvas/DDBRegionDisplayShader";
import { setMockSettings } from "../_setup/foundryMocks";

class Shader {
  static defaultUniforms = {};
  static CONSTANTS = "";
  static _createVertexShader() {
    return "aVertexPosition translationMatrix projectionMatrix canvasDimensions sceneDimensions screenDimensions"; 
  }
  static _createFragmentShader() {
    return "tintAlpha resolution hatchEnabled"; 
  }
}

beforeEach(() => {
  vi.stubGlobal("PIXI", { Program: { defaultVertexPrecision: "highp", defaultFragmentPrecision: "highp" }, Texture: { WHITE: {} } });
  Object.assign(foundry, { canvas: { rendering: { shaders: { HighlightRegionShader: Shader } }, loadTexture: vi.fn() } });
  Object.assign(foundry.utils, { Color: { from: () => 0xff0000 } });
  setMockSettings({ "ddb-importer.region-display-profiles": {} });
});

afterEach(() => {
  vi.unstubAllGlobals(); vi.restoreAllMocks(); resetDDBDisplayShaderClass(); 
});

it("round-trips image overrides and defaults the image fields a stored profile omits", () => {
  const flag: IRegionDisplayFlag = { profile: "status", pattern: "imagePoints", textureSrc: "icons/svg/acid.svg", textureColorMode: "region", textureAnchor: "region" };
  expect(flagFromBehaviorConfig(behaviorConfigFromFlag(flag))).toEqual(flag);
  expect(RegionDisplayProfiles.resolve(flag)).toMatchObject(flag);
  expect(RegionDisplayProfiles.normalize({ id: "old" })).toMatchObject({ textureSrc: "", textureColorMode: "original", textureAnchor: "scene" });
  expect(RegionDisplayProfiles.applicable({ ...flag, pattern: "hatch" })).not.toHaveProperty("textureSrc");
  expect(RegionDisplayProfiles.applicable({ ...flag, pattern: "imageStretch" })).not.toHaveProperty("textureAnchor");
});

it("fits wide/tall points within their spacing and preserves tile proportions", () => {
  expect(imageDimensions("imagePoints", 2, 100, 0.5)).toEqual({ width: 50, height: 25 });
  expect(imageDimensions("imagePoints", 0.5, 100, 0.5)).toEqual({ width: 25, height: 50 });
  expect(imageDimensions("imageTile", 2, 100, 0.5)).toEqual({ width: 100, height: 50 });
});

it("fits and centres wide/tall fill images without distorting them, while stretch covers the bounds", () => {
  expect(imageFillDimensions("contain", 2, 100, 100)).toEqual({ x: 0, y: 25, width: 100, height: 50 });
  expect(imageFillDimensions("contain", 0.5, 100, 100)).toEqual({ x: 25, y: 0, width: 50, height: 100 });
  expect(imageFillDimensions("contain", 2, 200, 50)).toEqual({ x: 50, y: 0, width: 100, height: 50 });
  expect(imageFillDimensions("stretch", 2, 100, 100)).toEqual({ x: 0, y: 0, width: 100, height: 100 });
});

it("inherits fit choices, defaults to stretch and only shows sizing for Fill Image", () => {
  setMockSettings({ "region-display-profiles": { custom: { pattern: "imageStretch", textureFit: "contain" } } });
  for (const blank of [undefined, null, ""] as const) {
    expect(RegionDisplayProfiles.resolve({ profile: "custom", textureFit: blank })?.textureFit).toBe("contain");
  }
  const flag: IRegionDisplayFlag = { profile: "custom", textureFit: "stretch" };
  const style = RegionDisplayProfiles.resolve(flag)!;
  expect(style.textureFit).toBe("stretch");
  expect(flagFromBehaviorConfig(behaviorConfigFromFlag(flag))).toEqual(flag);
  expect(RegionDisplayProfiles.normalize({ pattern: "imageStretch" }).textureFit).toBe("stretch");
  expect(RegionDisplayProfiles.applicable({ ...flag, pattern: "imageTile" })).not.toHaveProperty("textureFit");
  expect(imageFormContext(style, flag, true)).toMatchObject({ showTextureFit: true, showTextureAnchor: false });
  expect(imageFormContext({ ...style, pattern: "imagePoints" }, flag, true)).toMatchObject({ showTextureFit: false, showTextureAnchor: true });
  const mesh = { shader: { uniforms: {} } } as TCoreRegionMesh;
  applyStyle(mesh, { ...style, textureFit: "contain" }, "#ff0000", { grid: 100, uiScale: 1 });
  expect(mesh.shader.uniforms.imageContain).toBe(true);
  applyStyle(mesh, style, "#ff0000", { grid: 100, uiScale: 1 });
  expect(mesh.shader.uniforms.imageContain).toBe(false);
});

it("serializes image previews with the same controls and a hatch fallback", () => {
  const css = previewCss({ ...REGION_DISPLAY_DEFAULTS, pattern: "imagePoints", textureSrc: "icons/svg/acid.svg" }, "#ff0000");
  expect(css).toContain("repeating-linear-gradient");
  expect(css).not.toContain("--ddbi-image-preview");
  const encoded = imagePreviewData({ ...REGION_DISPLAY_DEFAULTS, id: "test", name: "Not serialized", pattern: "imagePoints" }, "#ff0000", 50);
  expect(encoded).not.toContain("Not serialized");
  expect(JSON.parse(encoded).style).toMatchObject({ pattern: "imagePoints", textureColorMode: "original" });
});

it("shares a pending request and ignores a destroyed region's completion", async () => {
  let finish!: (texture: unknown) => void;
  const loader = vi.fn(() => new Promise((resolve) => {
    finish = resolve; 
  }));
  Object.assign(foundry.canvas, { loadTexture: loader });
  const region = {
    destroyed: false, document: { color: "#ff0000", flags: { ddbimporter: { display: { profile: "status", pattern: "imageTile", textureSrc: "one.png" } } } },
    animationState: {}, renderFlags: { set: vi.fn() },
  };
  const mesh = { region, shader: { uniforms: {} as Record<string, unknown> }, setShaderClass: vi.fn() };
  vi.stubGlobal("canvas", { regions: { _highlights: { children: [mesh] } }, dimensions: { size: 100 } });
  onDrawRegion(region as unknown as TCoreRegionPlaceable);
  const request = loadDisplayTexture("one.png");
  expect(loader).toHaveBeenCalledTimes(1);
  expect(mesh.shader.uniforms.imageReady).toBe(false);
  onDestroyRegion(region as unknown as TCoreRegionPlaceable);
  finish({ valid: true, width: 200, height: 100 });
  await request;
  expect(region.renderFlags.set).not.toHaveBeenCalled();
});

it("discards earlier image choices, applies loaded aspect ratio and releases the sampler", async () => {
  const finishes = new Map<string, (texture: unknown) => void>();
  Object.assign(foundry.canvas, { loadTexture: vi.fn((src: string) => new Promise((resolve) => {
    finishes.set(src, resolve); 
  })) });
  const flag = { profile: "status", pattern: "imagePoints", textureSrc: "a.png" };
  const region = { destroyed: false, document: { color: "#ff0000", flags: { ddbimporter: { display: flag } } }, animationState: {}, renderFlags: { set: vi.fn() } };
  const mesh = { region, shader: { uniforms: {} as Record<string, unknown> }, setShaderClass: vi.fn() };
  vi.stubGlobal("canvas", { regions: { _highlights: { children: [mesh] } }, dimensions: { size: 100 } });
  const placeable = region as unknown as TCoreRegionPlaceable;
  onDrawRegion(placeable);
  const a = loadDisplayTexture("a.png");
  flag.textureSrc = "b.png";
  onRefreshRegion(placeable, { refreshState: true });
  const b = loadDisplayTexture("b.png");
  finishes.get("a.png")!({ valid: true, width: 100, height: 100 });
  await a;
  expect(region.renderFlags.set).not.toHaveBeenCalled();
  const texture = { valid: true, width: 200, height: 100 };
  finishes.get("b.png")!(texture);
  await b;
  onRefreshRegion(placeable, { refreshState: true });
  expect(mesh.shader.uniforms).toMatchObject({ imageReady: true, imageAspect: 2, imageSampler: texture, pattern: REGION_DISPLAY_PATTERN_IDS.imagePoints });
  flag.pattern = "dots";
  onRefreshRegion(placeable, { refreshState: true });
  expect(mesh.shader.uniforms.imageReady).toBe(false);
  expect(mesh.shader.uniforms.imageSampler).not.toBe(texture);
});

it("negative-caches failed images during live edits, then allows recovery", async () => {
  const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
  const loader = vi.fn().mockRejectedValue(new Error("Missing"));
  Object.assign(foundry.canvas, { loadTexture: loader });
  for (let i = 0; i < 20; i++) expect(await loadDisplayTexture("missing-review.png")).toBeNull();
  expect(loader).toHaveBeenCalledTimes(1);
  clock.mockReturnValue(61_001);
  loader.mockResolvedValue({ valid: true });
  expect(await loadDisplayTexture("missing-review.png")).toMatchObject({ valid: true });
  expect(loader).toHaveBeenCalledTimes(2);
});

it("reuses destination-sized symbols and paints dense repeats with one pattern fill", async () => {
  const draw = vi.fn();
  const pattern = { setTransform: vi.fn() };
  const context = { drawImage: draw, createPattern: vi.fn(() => pattern), fillRect: vi.fn(), scale: vi.fn(), beginPath: vi.fn(), rect: vi.fn(), clip: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.stubGlobal("DOMMatrix", class {});
  Object.assign(foundry.canvas, { loadTexture: vi.fn().mockResolvedValue({ valid: true, width: 512, height: 512, baseTexture: { resource: { source: document.createElement("img") } } }) });
  const root = document.createElement("div");
  document.body.append(root);
  const make = () => {
    const element = document.createElement("div");
    element.innerHTML = "<span class=\"ddbi-display-region-fill\"></span>";
    element.dataset.imagePreview = imagePreviewData({ ...REGION_DISPLAY_DEFAULTS, id: "x", name: "x", pattern: "imagePoints", textureSrc: "cached-symbol.png", spacing: 0.05 }, "#00ff00", 150);
    element.getBoundingClientRect = () => ({ width: 300, height: 300 } as DOMRect);
    root.append(element);
    return element;
  };
  await paintImagePreview(make());
  expect(draw).toHaveBeenCalledTimes(2); // one small symbol and one repeat cell
  expect(draw.mock.calls[0].slice(-2)).toEqual([4, 4]);
  await paintImagePreview(make());
  expect(draw).toHaveBeenCalledTimes(3); // a replaced DOM element reuses the cached symbol
  expect(context.createPattern).toHaveBeenCalledTimes(2);
  expect(context.fillRect).toHaveBeenCalledTimes(4); // background plus one pattern per preview
  root.remove();
});

it("releases sheet observers and ignores loads completed after disposal", async () => {
  let frame: FrameRequestCallback | undefined;
  const observer = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
  vi.stubGlobal("ResizeObserver", class {
    constructor() {
      return observer; 
    } 
  });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frame = callback; return 1; 
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  let finish!: (value: unknown) => void;
  Object.assign(foundry.canvas, { loadTexture: vi.fn(() => new Promise((resolve) => {
    finish = resolve; 
  })) });
  const root = document.createElement("div");
  root.innerHTML = "<div class=\"ddbi-display-region-preview\"><span class=\"ddbi-display-region-fill\"></span></div>";
  const element = root.firstElementChild as HTMLElement;
  element.dataset.imagePreview = imagePreviewData({ ...REGION_DISPLAY_DEFAULTS, id: "x", name: "x", pattern: "imagePoints", textureSrc: "disposed-preview.png" }, "#00ff00", 150);
  element.getBoundingClientRect = () => ({ width: 100, height: 100 } as DOMRect);
  document.body.append(root);
  paintImagePreviews(root);
  frame!(0);
  expect(observer.observe).toHaveBeenCalledWith(element);
  disposeImagePreviews(root);
  expect(observer.disconnect).toHaveBeenCalledTimes(1);
  finish({ valid: true });
  await loadDisplayTexture("disposed-preview.png");
  expect(element.querySelector("canvas")).toBeNull();
  root.remove();
});
