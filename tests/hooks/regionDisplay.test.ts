// @vitest-environment jsdom
import {
  buildFragmentShader,
  buildVertexShader,
  DDB_DISPLAY_UNIFORMS,
  getDDBDisplayShaderClass,
  missingContractNames,
  patternDefineName,
  resetDDBDisplayShaderClass,
  verifyShaderProgram,
} from "../../src/hooks/canvas/DDBRegionDisplayShader";
import logger from "../../src/lib/Logger";
import {
  applyStyle,
  displaySignature,
  findHighlightMesh,
  onDrawRegion,
  onRefreshRegion,
  refreshAllRegionDisplays,
  insetPolygonTree,
  onDestroyRegion,
  restoreCoreStyle,
  syncRegionDisplay,
  tintFor,
} from "../../src/hooks/canvas/regionDisplay";
import { activityDisplayChoice, stampRegionDisplay } from "../../src/hooks/canvas/regionDisplayStamp";
import { previewCss, rgba } from "../../src/hooks/canvas/regionDisplayPreview";
import { createProfilePicker, installProfilePickerDelegate, refreshProfilePickers } from "../../src/hooks/canvas/regionDisplayPicker";
import { buildDisplaySummary, onRenderRegionConfig } from "../../src/hooks/canvas/regionConfigDisplay";
import DDBRegionDisplayConfig from "../../src/apps/DDBRegionDisplayConfig";
import { installBehaviorConfigureDelegate } from "../../src/hooks/canvas/regionDisplayBehaviorConfigure";
import { setupRegionDisplayProfiles } from "../../src/hooks/canvas/regionDisplaySetup";
import RegionDisplayProfiles from "../../src/lib/RegionDisplayProfiles";
import BehaviorHelper from "../../src/parser/enrichers/effects/BehaviorHelper";
import SRDEffects from "../../src/parser/enrichers/effects/SRDEffects";
import { REGION_DISPLAY_PATTERN_IDS } from "../../src/config/regionDisplayProfiles";
import { BEHAVIOR_CONFIGURE_CLASS } from "../../src/hooks/canvas/regionDisplaySummary";
import { useEnLocalization } from "../_fixtures/enLocalize";
import { setMockModules, setMockSettings } from "../_setup/foundryMocks";

/** A stand-in for foundry's HighlightRegionShader with the statics the subclass needs. */
class FakeCoreShader {
  static defaultUniforms = { tintAlpha: [1, 1, 1, 1], resolution: 1, hatchEnabled: false, hatchThickness: 1 };
  static CONSTANTS = "const float SQRT2 = 1.4142135623730951;";
  // the names the subclass checks for before it trusts the core class
  static _createVertexShader() {
    return "attribute vec2 aVertexPosition; uniform mat3 translationMatrix; uniform mat3 projectionMatrix;"
      + " uniform vec2 canvasDimensions; uniform vec4 sceneDimensions; uniform vec2 screenDimensions;";
  }
  static _createFragmentShader() {
    return "uniform vec4 tintAlpha; uniform float resolution; uniform bool hatchEnabled;";
  }
  static create() {
    return { uniforms: { ...this.defaultUniforms } };
  }
}

/** A WebGL context stand-in that compiles everything, or fails one stage. */
function fakeGl({ failCompile = false, failLink = false }: { failCompile?: boolean; failLink?: boolean } = {}) {
  const deleted: string[] = [];
  return {
    deleted,
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4,
    createShader: (type: number) => ({ type }),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: () => !failCompile,
    getShaderInfoLog: () => "syntax error",
    createProgram: () => ({ program: true }),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: () => !failLink,
    getProgramInfoLog: () => "link error",
    deleteShader: () => deleted.push("shader"),
    deleteProgram: () => deleted.push("program"),
  };
}

function fakeMesh(region: unknown, shaderClass: unknown = FakeCoreShader) {
  const mesh = {
    region,
    alpha: 0.5,
    tint: 0xffffff,
    visible: true,
    zIndex: 3,
    shader: { uniforms: { hatchEnabled: true, hatchThickness: 4 } as Record<string, unknown> },
    shaderClass,
    setShaderClass: vi.fn(function (this: any, cls: unknown) {
      this.shaderClass = cls;
      this.shader = { uniforms: { ...(cls as any).defaultUniforms } };
    }),
  };
  return mesh;
}

function fakeRegion(highlight: IRegionDisplayFlag | undefined, color = "#00ff00") {
  return {
    id: "r1",
    document: { color, flags: highlight ? { ddbimporter: { display: highlight } } : {} },
    controlled: false,
    hover: false,
    isPreview: false,
    visible: true,
    zIndex: 3,
    destroyed: false,
    animationState: { polygonTree: { drawShape: vi.fn() } },
    renderFlags: { set: vi.fn() },
  };
}

const metrics = { grid: 100, uiScale: 1 };

beforeEach(() => {
  (foundry.utils as any).Color = { from: (value: string) => parseInt(String(value).replace("#", ""), 16) };
  (globalThis as any).PIXI = {
    Program: { defaultVertexPrecision: "highp", defaultFragmentPrecision: "highp" },
    Graphics: class {
      alpha = 1;
      zIndex = 0;
      visible = true;
      eventMode = "";
      clear = vi.fn();
      lineStyle = vi.fn();
      beginFill = vi.fn();
      endFill = vi.fn();
      destroy = vi.fn();
    },
  };
});

afterEach(() => {
  delete (foundry.utils as any).Color;
  delete (globalThis as any).PIXI;
  delete (foundry as any).canvas;
  resetDDBDisplayShaderClass();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("DDBRegionDisplayShader", () => {
  it("adds the pattern uniforms and every pattern branch to the core shader", () => {
    const fragment = buildFragmentShader("highp", "CONSTS");
    expect(fragment).toContain("CONSTS");
    expect(fragment).toContain("uniform int pattern;");
    expect(fragment).toContain("uniform highp float period;");
    expect(fragment).toContain("uniform float thickness;");
    expect(fragment).toContain("uniform float crossRotation;");
    for (const uniform of ["crossLength", "waveAmplitude", "waveLength"]) {
      expect(fragment).toContain(`uniform float ${uniform};`);
    }
    expect(fragment).toContain("uniform bool dashed;");
    expect(fragment).toContain("uniform highp float dashPeriod;");
    expect(fragment).toContain("float dash(float along, float aa)");
    expect(fragment).toContain("if ( !hatchEnabled ) return;");
    // every pattern id is a define generated from the table, and every branch uses a name
    for (const [pattern, id] of Object.entries(REGION_DISPLAY_PATTERN_IDS)) {
      const name = patternDefineName(pattern as TRegionDisplayPattern);
      expect(fragment).toMatch(new RegExp(`^#define ${name} ${id}$`, "m"));
      // hatch is the fall-through branch, so it has no comparison of its own
      if (pattern !== "hatch") expect(fragment).toContain(`pattern == ${name}`);
    }
    expect(patternDefineName("hollowDots")).toBe("PATTERN_HOLLOW_DOTS");
    expect(fragment).not.toMatch(/pattern == \d/);
    expect(fragment).toContain("mix(gapOpacity, 1.0, ink)");
    // the pattern coordinates come from the vertex stage as varyings already in periods
    const vertex = buildVertexShader("highp", "highp", "CONSTS");
    expect(vertex).toContain("uniform float angle;");
    // the pattern offset shifts stripe and cell coordinates in the vertex stage, in periods
    expect(vertex).toContain("uniform float patternOffset;");
    expect(vertex).toContain("/ safePeriod + patternOffset;");
    expect(vertex).toContain("vec2 n = vec2(cos(angle), sin(angle));");
    for (const name of ["vStripe", "vDash", "vCell"]) {
      expect(vertex).toContain(`varying vec2 ${name};`);
      expect(fragment).toContain(`varying vec2 ${name};`);
    }
    expect(fragment).not.toContain("vPixelCoord");
    expect(fragment).toContain("stripe(vStripe.x, aa) * dash(vDash.x, dashAa)");
  });

  it.each(["highp", "mediump"])("matches shared uniform precision with a %s fragment stage", (precision) => {
    Object.assign(PIXI.Program, { defaultFragmentPrecision: precision });
    Object.assign(foundry, { canvas: { rendering: { shaders: { HighlightRegionShader: FakeCoreShader } } } });
    const gl = fakeGl();
    const Shader = getDDBDisplayShaderClass({ gl })!;
    const vertex = Shader._createVertexShader();
    const fragment = Shader._createFragmentShader();
    expect(vertex).toContain("precision highp float;");
    expect(fragment).toContain(`precision ${precision} float;`);
    for (const name of ["period", "dashPeriod"]) {
      const declaration = `uniform ${precision} float ${name};`;
      expect(vertex).toContain(declaration);
      expect(fragment).toContain(declaration);
    }
    expect(gl.shaderSource).toHaveBeenCalledWith(expect.anything(), vertex);
    expect(gl.shaderSource).toHaveBeenCalledWith(expect.anything(), fragment);
  });

  it.each([false, true])("keeps extension directives ahead of declarations through PIXI's version handling (WebGL2=%s)", (webgl2) => {
    const version = webgl2 ? "#version 300 es" : "#version 100";
    const vertex = buildVertexShader("highp", "mediump", "", webgl2).trim();
    const fragment = buildFragmentShader("mediump", "", webgl2).trim();
    // PIXI skips its SHADER_NAME/precision preamble only when the vertex has a version directive.
    expect(vertex.startsWith(version + "\n")).toBe(true);
    expect(fragment.startsWith(version + "\n")).toBe(true);
    if (!webgl2) expect(fragment.lastIndexOf("#extension")).toBeLessThan(fragment.indexOf("precision mediump float;"));
  });

  it("compiles and links a throwaway program and always releases it", () => {
    const good = fakeGl();
    expect(verifyShaderProgram(good, "v", "f")).toEqual({ ok: true });
    expect(good.deleted).toEqual(["shader", "shader", "program"]);
    const bad = fakeGl({ failCompile: true });
    expect(verifyShaderProgram(bad, "v", "f")).toEqual({ ok: false, error: "vertex shader failed to compile: syntax error" });
    expect(bad.deleted).toEqual(["shader"]);
    const unlinked = fakeGl({ failLink: true });
    expect(verifyShaderProgram(unlinked, "v", "f").error).toBe("program failed to link: link error");
    expect(missingContractNames("uniform vec4 tintAlpha;", ["tintAlpha", "resolution"])).toEqual(["resolution"]);
  });

  it("falls back to the core shader, once, when core's sources drop a name or the program will not compile", () => {
    const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    class Renamed extends FakeCoreShader {
      static override _createFragmentShader() {
        return "uniform vec4 tintAlpha; uniform float resolution;";
      }
    }
    (foundry as any).canvas = { rendering: { shaders: { HighlightRegionShader: Renamed } } };
    expect(getDDBDisplayShaderClass({ gl: fakeGl() })).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("no longer declares hatchEnabled"));
    // recorded: the sources are not re-checked and nothing is logged again
    (foundry as any).canvas = { rendering: { shaders: { HighlightRegionShader: FakeCoreShader } } };
    expect(getDDBDisplayShaderClass({ gl: fakeGl() })).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    resetDDBDisplayShaderClass();
    expect(getDDBDisplayShaderClass({ gl: fakeGl({ failLink: true }) })).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("did not compile (program failed to link: link error)"));
    resetDDBDisplayShaderClass();
    expect(getDDBDisplayShaderClass({ gl: fakeGl() })).not.toBeNull();
  });

  it("builds the subclass once from the live core shader and reports none without a canvas", () => {
    expect(getDDBDisplayShaderClass()).toBeNull();
    (foundry as any).canvas = { rendering: { shaders: { HighlightRegionShader: FakeCoreShader } } };
    const Shader = getDDBDisplayShaderClass()!;
    expect(Shader).not.toBeNull();
    expect(Object.getPrototypeOf(Shader)).toBe(FakeCoreShader);
    expect(Shader.defaultUniforms).toMatchObject({ hatchThickness: 1, ...DDB_DISPLAY_UNIFORMS });
    expect(Shader._createFragmentShader()).toContain(FakeCoreShader.CONSTANTS);
    expect(Shader._createVertexShader()).toContain("precision highp float;");
    expect(getDDBDisplayShaderClass()).toBe(Shader);
  });
});

describe("applyStyle", () => {
  const style: IRegionDisplayStyle = {
    textureSrc: "", textureColorMode: "original", textureAnchor: "scene", textureFit: "stretch",
    profile: "damage", pattern: "crosshatch", opacity: 0.7, gapOpacity: 0, borderOpacity: 0.7, spacing: 0.25, thickness: 0.2, edgeWidth: 0.25,
    dashed: false, dashLength: 0.25, angle: 45, crossRotation: 0, crossLength: 1, waveAmplitude: 0.25, waveLength: 1, offset: 0, border: false, borderWidth: 0.1, color: null,
  };

  it("writes alpha, tint and the pattern uniforms without touching hatchEnabled", () => {
    const mesh = fakeMesh(null);
    applyStyle(mesh as any, style, 0x00ff00, metrics);
    expect(mesh.alpha).toBe(0.7);
    expect(mesh.tint).toBe(0x00ff00);
    expect(mesh.shader.uniforms).toMatchObject({ hatchEnabled: true, pattern: 2, period: 25, thickness: 0.2, gapOpacity: 0, hatchThickness: 4, dashed: false, dashPeriod: 50 });
    expect(mesh.shader.uniforms.angle).toBeCloseTo(Math.PI / 4);
  });

  it("converts the line angle to radians", () => {
    const mesh = fakeMesh(null);
    applyStyle(mesh as any, { ...style, angle: 90 }, 0x00ff00, metrics);
    expect(mesh.shader.uniforms.angle).toBeCloseTo(Math.PI / 2);
  });

  it("sets cross rotation independently of the line angle", () => {
    const mesh = fakeMesh(null);
    applyStyle(mesh as unknown as TCoreRegionMesh, { ...style, pattern: "crosses", crossRotation: 45, angle: 90 }, 0x00ff00, metrics);
    expect(mesh.shader.uniforms.crossRotation).toBeCloseTo(Math.PI / 4);
    expect(mesh.shader.uniforms.angle).toBeCloseTo(Math.PI / 2);
    applyStyle(mesh as unknown as TCoreRegionMesh, { ...style, pattern: "crosses", crossRotation: 0 }, 0x00ff00, metrics);
    expect(mesh.shader.uniforms.crossRotation).toBe(0);
    applyStyle(mesh as unknown as TCoreRegionMesh, { ...style, crossLength: 2, waveAmplitude: 0, waveLength: 0.5 }, 0x00ff00, metrics);
    expect(mesh.shader.uniforms).toMatchObject({ crossLength: 2, waveAmplitude: 0, waveLength: 0.5 });
  });

  it("writes the dash uniforms as one dash plus one gap in pixels", () => {
    const mesh = fakeMesh(null);
    applyStyle(mesh as any, { ...style, dashed: true, dashLength: 0.5 }, 0x00ff00, metrics);
    expect(mesh.shader.uniforms).toMatchObject({ dashed: true, dashPeriod: 100 });
  });

  it("uses the profile colour when set and fades the fill for the edge band", () => {
    const mesh = fakeMesh(null);
    applyStyle(mesh as any, { ...style, pattern: "edge", color: "#123456" }, 0x00ff00, metrics);
    expect(mesh.tint).toBe(0x123456);
    expect(mesh.alpha).toBeCloseTo(0.105);
    expect(mesh.shader.uniforms.pattern).toBe(4);
    expect(tintFor("not a colour", 7)).toBe(7);
  });

  it("restores the core shader, alpha and tint", () => {
    (foundry as any).canvas = { rendering: { shaders: { HighlightRegionShader: FakeCoreShader } } };
    const mesh = fakeMesh(null, "ddb");
    mesh.alpha = 0.9;
    restoreCoreStyle(mesh as any, 0x00ff00, { grid: 100, uiScale: 2 });
    expect(mesh.setShaderClass).toHaveBeenCalledWith(FakeCoreShader);
    expect(mesh.alpha).toBe(0.5);
    expect(mesh.tint).toBe(0x00ff00);
    expect(mesh.shader.uniforms.hatchThickness).toBe(8);
  });
});

describe("region sync", () => {
  function stubCanvas(regions: any[], meshes: any[], band?: any[]) {
    const children = [...meshes, ...(band ?? [])];
    const highlights = { children, addChild: vi.fn((child: any) => {
      children.push(child);
      return child;
    }) };
    vi.stubGlobal("canvas", { dimensions: { size: 100, uiScale: 1 }, regions: { _highlights: highlights, placeables: regions } });
    (foundry as any).canvas = { rendering: { shaders: { HighlightRegionShader: FakeCoreShader } } };
    return highlights;
  }

  it("finds the region's mesh in the layer's highlight container", () => {
    const region = fakeRegion({ profile: "aura" });
    const other = fakeMesh({});
    const mesh = fakeMesh(region);
    expect(findHighlightMesh(region as any, { _highlights: { children: [other, mesh] } as any, placeables: [] })).toBe(mesh);
    expect(findHighlightMesh(region as any, null)).toBeNull();
  });

  it("installs the DDB shader on draw for a flagged region and leaves an unflagged one alone", () => {
    const flagged = fakeRegion({ profile: "aura" });
    const plain = fakeRegion(undefined);
    const flaggedMesh = fakeMesh(flagged);
    const plainMesh = fakeMesh(plain);
    stubCanvas([flagged, plain], [flaggedMesh, plainMesh]);
    onDrawRegion(flagged as any);
    onDrawRegion(plain as any);
    const Shader = getDDBDisplayShaderClass();
    expect(flaggedMesh.setShaderClass).toHaveBeenCalledWith(Shader);
    expect(flaggedMesh.alpha).toBe(RegionDisplayProfiles.get("aura")!.opacity);
    expect(flaggedMesh.tint).toBe(0x00ff00);
    expect(flaggedMesh.shader.uniforms).toMatchObject({ pattern: 0, period: RegionDisplayProfiles.get("aura")!.spacing * 100, thickness: 0.15, hatchThickness: 4 });
    expect(plainMesh.setShaderClass).not.toHaveBeenCalled();
    expect(plainMesh.alpha).toBe(0.5);
  });

  it("re-applies after a state refresh and restores core once the flag is gone", () => {
    const region = fakeRegion({ profile: "status" });
    const mesh = fakeMesh(region);
    stubCanvas([region], [mesh]);
    onDrawRegion(region as any);
    // core's _refreshState just reset these
    mesh.alpha = 0.5;
    mesh.shader.uniforms.hatchEnabled = false;
    onRefreshRegion(region as any, { refreshState: true });
    expect(mesh.alpha).toBe(0.5);
    expect(mesh.shader.uniforms.pattern).toBe(3);
    expect(mesh.shader.uniforms.hatchEnabled).toBe(false);
    mesh.setShaderClass.mockClear();
    region.document.flags = {};
    onRefreshRegion(region as any, { refreshState: true });
    expect(mesh.setShaderClass).toHaveBeenCalledWith(FakeCoreShader);
    expect(mesh.alpha).toBe(0.5);
    // unknown profiles fall back to the core look too
    region.document.flags = { ddbimporter: { display: { profile: "gone" } } };
    mesh.setShaderClass.mockClear();
    syncRegionDisplay(region as any);
    expect(mesh.setShaderClass).not.toHaveBeenCalled();
  });

  it.each([true, false])("preserves hatchEnabled=%s when assigning and clearing a profile on a drawn region", (hatchEnabled) => {
    const region = fakeRegion(undefined);
    region.controlled = !hatchEnabled;
    const mesh = fakeMesh(region);
    stubCanvas([region], [mesh]);
    onDrawRegion(region as unknown as TCoreRegionPlaceable);

    region.document.flags = { ddbimporter: { display: { profile: "status" } } };
    // Core refreshes the interaction state before the refreshRegion hook swaps shaders.
    mesh.shader.uniforms.hatchEnabled = hatchEnabled;
    onRefreshRegion(region as unknown as TCoreRegionPlaceable, { refreshState: true });
    expect(mesh.shaderClass).toBe(getDDBDisplayShaderClass());
    expect(mesh.shader.uniforms.hatchEnabled).toBe(hatchEnabled);

    region.document.flags = {};
    mesh.shader.uniforms.hatchEnabled = hatchEnabled;
    onRefreshRegion(region as unknown as TCoreRegionPlaceable, { refreshState: true });
    expect(mesh.shaderClass).toBe(FakeCoreShader);
    expect(mesh.shader.uniforms.hatchEnabled).toBe(hatchEnabled);
  });

  it("draws an inner stroke band for the edge pattern and drops it when the pattern changes", () => {
    const region = fakeRegion({ profile: "aura", pattern: "edge", edgeWidth: 0.5 });
    const mesh = fakeMesh(region);
    const highlights = stubCanvas([region], [mesh]);
    onDrawRegion(region as any);
    expect(highlights.addChild).toHaveBeenCalledTimes(1);
    const band = highlights.addChild.mock.calls[0][0];
    expect(band.lineStyle).toHaveBeenCalledWith({ width: 50, color: 0x00ff00, alpha: 1, alignment: 0 });
    expect(region.animationState.polygonTree.drawShape).toHaveBeenCalledWith(band);
    expect(band.alpha).toBe(RegionDisplayProfiles.get("aura")!.opacity);
    expect(band.zIndex).toBe(3);
    region.document.flags = { ddbimporter: { display: { profile: "aura", border: false } } };
    onRefreshRegion(region as any, { refreshState: true });
    expect(band.destroy).toHaveBeenCalled();
  });

  it("draws a border band for a fill pattern that asks for one, at full fill alpha", () => {
    const region = fakeRegion({ profile: "status", border: "border", borderWidth: 0.2 });
    const mesh = fakeMesh(region);
    const highlights = stubCanvas([region], [mesh]);
    onDrawRegion(region as any);
    expect(mesh.alpha).toBe(0.5);
    expect(mesh.shader.uniforms.pattern).toBe(3);
    expect(highlights.addChild).toHaveBeenCalledTimes(1);
    const band = highlights.addChild.mock.calls[0][0];
    expect(band.lineStyle).toHaveBeenCalledWith({ width: 20, color: 0x00ff00, alpha: 1, alignment: 0 });
    region.document.flags = { ddbimporter: { display: { profile: "status", border: "none" } } };
    onRefreshRegion(region as any, { refreshState: true });
    expect(band.destroy).toHaveBeenCalled();
  });

  it("asks only the styled regions to re-style, without a geometry refresh", () => {
    const regions = [fakeRegion({ profile: "aura" }), fakeRegion(undefined)];
    stubCanvas(regions, []);
    refreshAllRegionDisplays();
    expect(regions[0].renderFlags.set).toHaveBeenCalledWith({ refreshState: true });
    expect(regions[1].renderFlags.set).not.toHaveBeenCalled();
  });

  it("keys the cached style on the choice, the region colour, the grid and the profile store", () => {
    const flag: IRegionDisplayFlag = { profile: "aura", opacity: 0.4 };
    const base = displaySignature(flag, "#00ff00", metrics, 1);
    expect(displaySignature({ ...flag }, "#00ff00", { ...metrics }, 1)).toBe(base);
    expect(displaySignature({ ...flag, opacity: 0.5 }, "#00ff00", metrics, 1)).not.toBe(base);
    expect(displaySignature(flag, "#ff0000", metrics, 1)).not.toBe(base);
    expect(displaySignature(flag, "#00ff00", { grid: 50, uiScale: 1 }, 1)).not.toBe(base);
    expect(displaySignature(flag, "#00ff00", { grid: 100, uiScale: 2 }, 1)).not.toBe(base);
    expect(displaySignature(flag, "#00ff00", metrics, 2)).not.toBe(base);
  });

  it("only redraws the band while a region moves, and restyles once something it depends on changes", () => {
    const region = fakeRegion({ profile: "status", border: "border", borderWidth: 0.2 });
    const mesh = fakeMesh(region);
    const highlights = stubCanvas([region], [mesh]);
    onDrawRegion(region as any);
    const band = highlights.addChild.mock.calls[0][0];
    const resolve = vi.spyOn(RegionDisplayProfiles, "resolve");
    const setShaderClass = mesh.setShaderClass.mock.calls.length;
    // a sentinel alpha shows whether the style was written again
    mesh.alpha = 0.99;
    // a region following a token gets a geometry-only refresh every animation frame
    for (let frame = 0; frame < 5; frame++) onRefreshRegion(region as any, { refreshGeometry: true });
    expect(resolve).not.toHaveBeenCalled();
    expect(mesh.alpha).toBe(0.99);
    expect(mesh.setShaderClass).toHaveBeenCalledTimes(setShaderClass);
    // the band follows the shape, so it is redrawn every frame
    expect(band.lineStyle).toHaveBeenCalledTimes(6);
    // core's state refresh resets the tint: the cached style is written back without a lookup
    onRefreshRegion(region as any, { refreshState: true });
    expect(resolve).not.toHaveBeenCalled();
    expect(mesh.alpha).toBe(0.5);
    // a changed choice is picked up even by a geometry-only refresh
    mesh.alpha = 0.99;
    region.document.flags = { ddbimporter: { display: { profile: "status", border: "border", borderWidth: 0.2, opacity: 0.3 } } };
    onRefreshRegion(region as any, { refreshGeometry: true });
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(mesh.alpha).toBe(0.3);
    // so is a new region colour
    region.document.color = "#0000ff";
    onRefreshRegion(region as any, { refreshGeometry: true });
    expect(resolve).toHaveBeenCalledTimes(2);
    expect(mesh.tint).toBe(0x0000ff);
    // a profile edit makes every cached style stale
    refreshAllRegionDisplays();
    onRefreshRegion(region as any, { refreshGeometry: true });
    expect(resolve).toHaveBeenCalledTimes(3);
    onRefreshRegion(region as any, { refreshGeometry: true });
    expect(resolve).toHaveBeenCalledTimes(3);
  });

  it("remembers a missing profile while moving, and forgets everything once the region is destroyed or redrawn", () => {
    const region = fakeRegion({ profile: "gone" });
    const mesh = fakeMesh(region);
    stubCanvas([region], [mesh]);
    const resolve = vi.spyOn(RegionDisplayProfiles, "resolve");
    onDrawRegion(region as any);
    for (let frame = 0; frame < 5; frame++) onRefreshRegion(region as any, { refreshGeometry: true });
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(mesh.setShaderClass).not.toHaveBeenCalled();
    onDestroyRegion(region as any);
    onRefreshRegion(region as any, { refreshGeometry: true });
    expect(resolve).toHaveBeenCalledTimes(2);
    onDrawRegion(region as any);
    expect(resolve).toHaveBeenCalledTimes(3);
  });

  it.each(["dots", "edge"] as const)("keeps a visible %s border with an invisible fill", (pattern) => {
    const region = fakeRegion({ profile: "status", pattern, opacity: 0, gapOpacity: 0, border: true, borderOpacity: 0.8 });
    const mesh = fakeMesh(region);
    const highlights = stubCanvas([region], [mesh]);
    onDrawRegion(region as any);
    expect(mesh.alpha).toBe(0);
    expect(mesh.shader.uniforms.gapOpacity).toBe(0);
    const band = highlights.addChild.mock.calls[0][0];
    expect(band.alpha).toBe(0.8);
    region.document.flags = { ddbimporter: { display: { profile: "status", pattern, border: true, borderOpacity: 0 } } };
    onRefreshRegion(region as any, { refreshState: true });
    expect(band.alpha).toBe(0);
  });

  describe("fill inside the band", () => {
    /** Clipper and the polygon tree as a Foundry client has them, recording each offset. */
    function stubClipper() {
      const deltas: number[] = [];
      const paths: unknown[] = [];
      const drawShape = vi.fn();
      vi.stubGlobal("ClipperLib", {
        ClipperOffset: class {
          AddPaths(added: unknown) {
            paths.push(added);
          }
          Execute(_solution: unknown, delta: number) {
            deltas.push(delta);
          }
        },
        PolyTree: class {},
        JoinType: { jtMiter: 2 },
        EndType: { etClosedPolygon: 4 },
      });
      (CONST as any).CLIPPER_SCALING_FACTOR = 100;
      (foundry as any).data.PolygonTree = { fromClipperPolyTree: vi.fn(() => ({ drawShape })) };
      return { deltas, paths, drawShape };
    }

    afterEach(() => {
      delete (CONST as any).CLIPPER_SCALING_FACTOR;
      delete (foundry as any).data.PolygonTree;
    });

    function borderedRegion(flag: IRegionDisplayFlag) {
      const region = fakeRegion(flag);
      const paths = [[{ X: 0, Y: 0 }, { X: 30000, Y: 0 }, { X: 30000, Y: 30000 }]];
      Object.assign(region.animationState.polygonTree, { clipperPaths: paths });
      const mesh = fakeMesh(region) as ReturnType<typeof fakeMesh> & { mask?: unknown };
      return { region, mesh, paths };
    }

    it("masks the fill to the region shrunk by the border width, tucked half a pixel under the band", () => {
      const clipper = stubClipper();
      const { region, mesh, paths } = borderedRegion({ profile: "status", border: "border", borderWidth: 0.2 });
      const highlights = stubCanvas([region], [mesh]);
      onDrawRegion(region as any);
      // band first, then the mask beside it
      expect(highlights.addChild).toHaveBeenCalledTimes(2);
      const mask = highlights.addChild.mock.calls[1][0];
      expect(mesh.mask).toBe(mask);
      // a 0.2 square border on a 100 px grid is 20 px; the fill stops 19.5 px in, in Clipper units
      expect(clipper.deltas).toEqual([-1950]);
      expect(clipper.paths[0]).toBe(paths);
      expect(mask.beginFill).toHaveBeenCalledWith(0xffffff, 1);
      expect(clipper.drawShape).toHaveBeenCalledWith(mask);
      expect(mask.endFill).toHaveBeenCalled();
    });

    it("reuses the mask on a state refresh and recomputes it for new geometry or a new width", () => {
      const clipper = stubClipper();
      const { region, mesh } = borderedRegion({ profile: "status", border: "border", borderWidth: 0.2 });
      stubCanvas([region], [mesh]);
      onDrawRegion(region as any);
      onRefreshRegion(region as any, { refreshState: true });
      expect(clipper.deltas).toHaveLength(1);
      onRefreshRegion(region as any, { refreshShapes: true });
      expect(clipper.deltas).toHaveLength(2);
      region.document.flags = { ddbimporter: { display: { profile: "status", border: "border", borderWidth: 0.5 } } };
      onRefreshRegion(region as any, { refreshState: true });
      expect(clipper.deltas.at(-1)).toBe(-4950);
    });

    it("contains the edge pattern's faint fill inside its band too", () => {
      const clipper = stubClipper();
      const { region, mesh } = borderedRegion({ profile: "status", pattern: "edge", edgeWidth: 0.25 });
      stubCanvas([region], [mesh]);
      onDrawRegion(region as any);
      expect(clipper.deltas).toEqual([-2450]);
      expect(mesh.mask).toBeTruthy();
    });

    it("takes the mask off when the border goes, when the flag goes, and when the region is destroyed", () => {
      stubClipper();
      const { region, mesh } = borderedRegion({ profile: "status", border: "border", borderWidth: 0.2 });
      const highlights = stubCanvas([region], [mesh]);
      onDrawRegion(region as any);
      const mask = highlights.addChild.mock.calls[1][0];
      region.document.flags = { ddbimporter: { display: { profile: "status", border: "none" } } };
      onRefreshRegion(region as any, { refreshState: true });
      expect(mesh.mask).toBeNull();
      expect(mask.destroy).toHaveBeenCalled();

      region.document.flags = { ddbimporter: { display: { profile: "status", border: "border", borderWidth: 0.2 } } };
      onRefreshRegion(region as any, { refreshState: true });
      const second = mesh.mask as { destroy: ReturnType<typeof vi.fn> };
      region.document.flags = {};
      onRefreshRegion(region as any, { refreshState: true });
      expect(mesh.mask).toBeNull();
      expect(second.destroy).toHaveBeenCalled();

      region.document.flags = { ddbimporter: { display: { profile: "status", border: "border", borderWidth: 0.2 } } };
      onRefreshRegion(region as any, { refreshState: true });
      const third = mesh.mask as { destroy: ReturnType<typeof vi.fn> };
      onDestroyRegion(region as any);
      expect(third.destroy).toHaveBeenCalled();
    });

    it("leaves the fill unmasked without a border, or outside a Foundry client", () => {
      const { region, mesh } = borderedRegion({ profile: "status", border: "border", borderWidth: 0.2 });
      const highlights = stubCanvas([region], [mesh]);
      // no Clipper: the band still draws, the fill keeps running to the edge
      onDrawRegion(region as any);
      expect(highlights.addChild).toHaveBeenCalledTimes(1);
      expect(mesh.mask).toBeUndefined();
      expect(insetPolygonTree(region.animationState.polygonTree as any, 10)).toBeNull();

      stubClipper();
      const plain = borderedRegion({ profile: "status", border: "none" });
      const plainHighlights = stubCanvas([plain.region], [plain.mesh]);
      onDrawRegion(plain.region as any);
      expect(plainHighlights.addChild).not.toHaveBeenCalled();
      expect(plain.mesh.mask).toBeUndefined();
    });
  });
});

describe("placement stamp", () => {
  it.each(["stretch", "contain"] as const)("stamps Fill Image sizing %s from the importer helper", (textureFit) => {
    const behavior = BehaviorHelper.display({ profile: "status", pattern: "imageStretch", textureFit });
    const data = [{}];
    stampRegionDisplay({ applicableBehaviors: [{ type: behavior.type, config: { ...behavior.config } }] }, data);
    expect(foundry.utils.getProperty(data[0], "flags.ddbimporter.display"))
      .toEqual({ profile: "status", pattern: "imageStretch", textureFit });
  });

  it("stamps independent cross length and wave controls, including zero wave height", () => {
    const behavior = BehaviorHelper.display({ profile: "status", pattern: "waves", crossLength: 2.5, waveAmplitude: 0, waveLength: 0.5 });
    const data = [{}];
    stampRegionDisplay({ applicableBehaviors: [{ type: behavior.type, config: { ...behavior.config } }] }, data);
    expect(foundry.utils.getProperty(data[0], "flags.ddbimporter.display"))
      .toEqual({ profile: "status", pattern: "waves", crossLength: 2.5, waveAmplitude: 0, waveLength: 0.5 });
  });

  it.each([0, 45])("preserves a cross rotation override of %s through the import helper and placement", (crossRotation) => {
    const behavior = BehaviorHelper.display({ profile: "status", pattern: "crosses", crossRotation });
    const activity = { applicableBehaviors: [{ type: behavior.type, config: { ...behavior.config } }] };
    const data = [{ name: "crosses" }];
    stampRegionDisplay(activity, data);
    expect(foundry.utils.getProperty(data[0], "flags.ddbimporter.display"))
      .toEqual({ profile: "status", pattern: "crosses", crossRotation });
  });

  it.each(["hollowDots", "diamonds", "crosses", "checkerboard", "waves", "chevrons"] as const)("carries %s and explicit opacity zeroes from importer behavior to region flags", (pattern) => {
    const behavior = BehaviorHelper.display({ profile: "status", pattern, opacity: 0, gapOpacity: 0, borderOpacity: 0 });
    expect(behavior.config).toMatchObject({ opacity: 0, gapOpacity: 0, borderOpacity: 0 });
    const activity = { applicableBehaviors: [{ type: behavior.type, config: { ...behavior.config } }] };
    const data = [{ name: "test" }];
    stampRegionDisplay(activity, data);
    expect(foundry.utils.getProperty(data[0], "flags.ddbimporter.display"))
      .toEqual({ profile: "status", pattern, opacity: 0, gapOpacity: 0, borderOpacity: 0 });
  });

  it("prefers the appearance behavior, copying only filled overrides", () => {
    const activity = {
      applicableBehaviors: [
        { type: "ddbMacro", config: { displayProfile: "damage" } },
        { type: "ddbDisplay", config: { profile: "aura", pattern: "", opacity: 0.4, spacing: null, thickness: "", edgeWidth: undefined, dashed: "dashed", dashLength: 0.5, angle: 90, border: "border", borderWidth: null, color: "#ff0000" } },
      ],
    };
    expect(activityDisplayChoice(activity)).toEqual({ profile: "aura", opacity: 0.4, dashed: "dashed", dashLength: 0.5, angle: 90, border: "border", color: "#ff0000" });
    expect(activityDisplayChoice({ behaviors: [{ type: "ddbDisplay", config: { profile: "aura", dashed: "" } }] })).toEqual({ profile: "aura" });
  });

  it("falls back to the trigger's profile, and to nothing", () => {
    expect(activityDisplayChoice({ behaviors: [{ type: "ddbMacro", config: { displayProfile: "damage" } }] })).toEqual({ profile: "damage" });
    expect(activityDisplayChoice({ behaviors: [{ type: "ddbMacro", config: { displayProfile: "" } }, { type: "applyActiveEffect" }] })).toBeNull();
    expect(activityDisplayChoice({ behaviors: [{ type: "ddbDisplay", config: { profile: "" } }] })).toBeNull();
    expect(activityDisplayChoice(null)).toBeNull();
  });

  it("stamps each region's creation data, leaving flags the caller already set", () => {
    const activity = { uuid: "Item.x.Activity.y", applicableBehaviors: [{ type: "ddbDisplay", config: { profile: "status" } }] };
    const regionData = [{ name: "a" }, { name: "b", flags: { ddbimporter: { display: { profile: "aura" } } } }];
    stampRegionDisplay(activity, regionData);
    expect(regionData[0]).toEqual({ name: "a", flags: { ddbimporter: { display: { profile: "status" } } } });
    expect(foundry.utils.getProperty(regionData[1], "flags.ddbimporter.display")).toEqual({ profile: "aura" });
    const untouched = [{ name: "c" }];
    stampRegionDisplay({ behaviors: [] }, untouched);
    expect(untouched).toEqual([{ name: "c" }]);
  });
});

describe("BehaviorHelper.display and defaults", () => {
  it("builds an appearance behavior named after the shipped profile", () => {
    expect(BehaviorHelper.display({ profile: "damage", opacity: 0.3 })).toMatchObject({
      type: "ddbDisplay",
      name: "Region Display: Ongoing Damage",
      level: { min: null, max: null },
      config: { profile: "damage", pattern: "", opacity: 0.3, spacing: null, thickness: null, edgeWidth: null, dashed: "", dashLength: null, angle: null, border: "", borderWidth: null, color: null },
    });
    expect(BehaviorHelper.display({ profile: "aura", angle: 0, border: true, borderWidth: 0.2 }).config).toMatchObject({ angle: 0, border: "border", borderWidth: 0.2 });
    expect(BehaviorHelper.display({ profile: "aura", border: false }).config).toMatchObject({ border: "none" });
    expect(BehaviorHelper.display({ profile: "custom", name: "Look" })).toMatchObject({ name: "Look", config: { profile: "custom" } });
    expect(BehaviorHelper.display({ profile: "aura", dashed: true, dashLength: 0.5 }).config).toMatchObject({ dashed: "dashed", dashLength: 0.5 });
    expect(BehaviorHelper.display({ profile: "aura", dashed: false }).config).toMatchObject({ dashed: "continuous" });
  });

  it("assigns aura, damage, status and minimal defaults from the activity's shape", () => {
    const activities: Record<string, any> = {
      aura: { target: { template: { type: "radius" } }, behaviors: [{ type: "applyActiveEffect" }] },
      damage: { target: { template: { type: "circle" } }, damage: { parts: [{}] }, behaviors: [{ type: "ddbMacro", config: {} }] },
      sibling: { target: { template: { type: "cylinder" } }, behaviors: [{ type: "ddbMacro", config: { activity: "hurt" } }] },
      hurt: { type: "damage", damage: { parts: [{}] } },
      status: { target: { template: { type: "cube" } }, behaviors: [{ type: "ddbMacro", config: {} }, { type: "applyActiveEffect" }] },
      terrain: { target: { template: { type: "cube" } }, behaviors: [{ type: "difficultTerrain" }] },
      chosen: { target: { template: { type: "radius" } }, behaviors: [{ type: "ddbDisplay", config: { profile: "custom" } }] },
      bare: { target: { template: { type: "circle" } }, behaviors: [] },
      none: { target: { template: { type: "circle" } } },
    };
    BehaviorHelper.assignDisplayDefaults(activities);
    const profile = (key: string) => activities[key].behaviors?.find((b: any) => b.type === "ddbDisplay")?.config.profile;
    expect(profile("aura")).toBe("aura");
    expect(profile("damage")).toBe("damage");
    expect(profile("sibling")).toBe("damage");
    expect(profile("status")).toBe("status");
    expect(profile("terrain")).toBe("minimal");
    expect(profile("chosen")).toBe("custom");
    expect(activities.chosen.behaviors).toHaveLength(1);
    expect(activities.bare.behaviors).toEqual([]);
    expect(activities.none.behaviors).toBeUndefined();
    expect(activities.hurt.behaviors).toBeUndefined();
  });

  it("falls back to the document's template for activities that inherit their target", () => {
    const activities: Record<string, any> = {
      inherits: { target: { template: { type: "" } }, behaviors: [{ type: "applyActiveEffect" }] },
      owns: { target: { override: true, template: { type: "" } }, behaviors: [{ type: "applyActiveEffect" }] },
    };
    BehaviorHelper.assignDisplayDefaults(activities, { documentTemplateType: "radius" });
    expect(activities.inherits.behaviors.at(-1).config.profile).toBe("aura");
    expect(activities.owns.behaviors.at(-1).config.profile).toBe("status");
  });

  it("picks the system preset for a lone damage type or status", () => {
    const cube = { target: { template: { type: "cube" } } };
    const trigger = (activity: string) => ({ type: "ddbMacro", config: { activity } });
    const effects: any[] = [
      { _id: "proneFx", statuses: ["prone"] },
      { _id: "macroFx", system: { changes: [{ key: "macro.StatusEffect", value: "restrained" }] } },
      { _id: "twoFx", statuses: ["charmed", "incapacitated"] },
    ];
    const standaloneEffects: any[] = [{ name: "Webbed", statuses: ["restrained"] }];
    const activities: Record<string, any> = {
      acid: { ...cube, type: "save", damage: { parts: [{ types: ["acid"] }, { types: ["acid"] }] }, behaviors: [trigger("")] },
      mixed: { ...cube, behaviors: [trigger("acidHit"), trigger("fireHit")] },
      acidHit: { type: "damage", damage: { parts: [{ types: ["acid"] }] } },
      fireHit: { type: "damage", damage: { parts: [{ types: ["fire"] }] } },
      choice: { ...cube, damage: { parts: [{ types: ["cold", "fire"] }] }, behaviors: [trigger("")] },
      untyped: { ...cube, type: "attack", behaviors: [trigger("")] },
      homebrew: { ...cube, damage: { parts: [{ types: ["sonic"] }] }, behaviors: [trigger("")] },
      damageAndProne: { ...cube, behaviors: [trigger("knockdown")] },
      knockdown: { type: "save", damage: { parts: [{ types: ["thunder"] }] }, effects: [{ _id: "proneFx" }] },
      prone: { ...cube, behaviors: [trigger("topple")] },
      topple: { type: "save", effects: [{ _id: "proneFx" }] },
      srd: { ...cube, behaviors: [{ type: "applyActiveEffect", config: { effects: [SRDEffects.condition("blinded")] } }] },
      standalone: { ...cube, behaviors: [{ type: "applyActiveEffect", config: { effects: ["Webbed"] } }] },
      macroStatus: { ...cube, effects: [{ _id: "macroFx" }], behaviors: [{ type: "difficultTerrain" }] },
      twoStatuses: { ...cube, behaviors: [trigger("charm")] },
      charm: { type: "save", effects: [{ _id: "twoFx" }] },
      sameStatusTwice: { ...cube, effects: [{ _id: "proneFx" }], behaviors: [trigger("topple")] },
      unnamed: { ...cube, behaviors: [{ type: "applyActiveEffect", config: { effects: ["Compendium.world.fx.ActiveEffect.x"] } }] },
      auraDamage: { target: { template: { type: "radius" } }, damage: { parts: [{ types: ["acid"] }] }, behaviors: [trigger("")] },
    };
    BehaviorHelper.assignDisplayDefaults(activities, { effects, standaloneEffects });
    const profile = (key: string) => activities[key].behaviors?.find((b: any) => b.type === "ddbDisplay")?.config.profile;
    expect(profile("acid")).toBe("damage-acid");
    expect(profile("mixed")).toBe("damage");
    expect(profile("choice")).toBe("damage");
    expect(profile("untyped")).toBe("damage");
    expect(profile("homebrew")).toBe("damage");
    expect(profile("damageAndProne")).toBe("damage-thunder");
    expect(profile("prone")).toBe("status-prone");
    expect(profile("srd")).toBe("status-blinded");
    expect(profile("standalone")).toBe("status-restrained");
    expect(profile("macroStatus")).toBe("status-restrained");
    expect(profile("twoStatuses")).toBe("status");
    expect(profile("sameStatusTwice")).toBe("status-prone");
    expect(profile("unnamed")).toBe("status");
    expect(profile("auraDamage")).toBe("aura");
  });

  it("finds a trigger's sibling by name, as the placed region does", () => {
    const cube = { target: { template: { type: "cube" } } };
    const named = (args: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
      type: "ddbMacro",
      config: { function: "useActivity", activity: "", args, ...extra },
    });
    const effects: any[] = [{ _id: "proneFx", name: "Knocked Down", statuses: ["prone"] }];
    const activities: Record<string, any> = {
      // Spike Growth: the Cast places the area and names its damage sibling
      cast: { ...cube, name: "Cast", type: "utility", behaviors: [{ type: "difficultTerrain" }, named({ activityName: "Movement Damage" })] },
      movement: { name: "Movement Damage", type: "damage", damage: { parts: [{ types: ["piercing"] }] } },
      prefix: { ...cube, name: "Place", behaviors: [named({ activityName: "Frost" })] },
      frost: { name: "Frost Burst (Upcast)", type: "save", damage: { parts: [{ types: ["cold"] }] } },
      choice: { ...cube, name: "Aura", behaviors: [named({ activityChoices: ["Movement Damage", "Frost Burst"] })] },
      byArgsId: { ...cube, name: "Topple Zone", behaviors: [named({ activityId: "topple" })] },
      topple: { name: "Topple", type: "save", effects: [{ _id: "proneFx" }] },
      macro: { ...cube, name: "Macro", behaviors: [named({ activityName: "Movement Damage" }, { function: "someMacro" })] },
      byUuid: { ...cube, name: "Uuid", behaviors: [{ type: "applyActiveEffect", config: { effects: ["Item.x.ActiveEffect.proneFx"] } }] },
    };
    BehaviorHelper.assignDisplayDefaults(activities, { effects });
    const profile = (key: string) => activities[key].behaviors?.find((b: any) => b.type === "ddbDisplay")?.config.profile;
    expect(profile("cast")).toBe("damage-piercing");
    expect(profile("prefix")).toBe("damage-cold");
    expect(profile("choice")).toBe("damage");
    expect(profile("byArgsId")).toBe("status-prone");
    expect(profile("macro")).toBe("minimal");
    expect(profile("byUuid")).toBe("status-prone");
  });

  it("styles an area with no behaviors by its damage or status, and otherwise leaves it alone", () => {
    const effects: any[] = [{ _id: "proneFx", statuses: ["prone"] }];
    const activities: Record<string, any> = {
      fireball: { type: "save", target: { template: { type: "sphere" } }, damage: { parts: [{ types: ["fire"] }] } },
      thunderclap: { type: "save", target: { template: { type: "radius" } }, damage: { parts: [{ types: ["thunder"] }] } },
      inherits: { type: "save", target: { template: { type: "" } }, damage: { parts: [{ types: ["cold"] }] } },
      topple: { type: "save", target: { template: { type: "cone" } }, effects: [{ _id: "proneFx" }], behaviors: [] },
      fog: { type: "utility", target: { template: { type: "sphere" } } },
      heal: { type: "heal", target: { template: { type: "sphere" } }, healing: { types: ["healing"] } },
      single: { type: "damage", target: { override: true, template: { type: "" } }, damage: { parts: [{ types: ["fire"] }] } },
    };
    BehaviorHelper.assignDisplayDefaults(activities, { effects, documentTemplateType: "cone" });
    const profile = (key: string) => activities[key].behaviors?.find((b: any) => b.type === "ddbDisplay")?.config.profile;
    expect(profile("fireball")).toBe("damage-fire");
    // a one-shot emanation is a burst, not an aura
    expect(profile("thunderclap")).toBe("damage-thunder");
    expect(profile("inherits")).toBe("damage-cold");
    expect(profile("topple")).toBe("status-prone");
    expect(activities.fog.behaviors).toBeUndefined();
    expect(activities.heal.behaviors).toBeUndefined();
    expect(activities.single.behaviors).toBeUndefined();
  });

  it("counts the placing activity's own damage without a trigger", () => {
    const activities: Record<string, any> = {
      burn: {
        target: { template: { type: "line" } },
        damage: { parts: [{ types: ["fire"] }] },
        behaviors: [{ type: "applyActiveEffect", config: { effects: [SRDEffects.condition("prone")] } }],
      },
    };
    BehaviorHelper.assignDisplayDefaults(activities);
    expect(activities.burn.behaviors.at(-1).config.profile).toBe("damage-fire");
  });
});

describe("preview css", () => {
  it("lengthens cross arms without widening them and includes long diagonal neighbours", () => {
    const base = { ...RegionDisplayProfiles.get("status")!, pattern: "crosses" as const, thickness: 0.6, crossLength: 3, crossRotation: 45 };
    const svg = decodeURIComponent(previewCss(base, "#00ff00"));
    expect(svg).toContain("x=\"-40\" y=\"40\" width=\"180\" height=\"20\"");
    expect(svg).toContain("x=\"40\" y=\"-40\" width=\"20\" height=\"180\"");
    expect(svg).toContain("translate(200 -200)");
    const diamond = { ...base, pattern: "diamonds" as const };
    expect(previewCss(diamond, "#00ff00")).toBe(previewCss({ ...diamond, crossLength: 1 }, "#00ff00"));
  });

  it("adjusts wave height and wavelength independently of spacing, angle, dashes and offset", () => {
    const base = { ...RegionDisplayProfiles.get("status")!, pattern: "waves" as const, spacing: 1,
      thickness: 0.2, waveAmplitude: 0.5, waveLength: 2, angle: 30, dashed: true, dashLength: 0.4, offset: 0.5 };
    for (const grid of [50, 150]) {
      const css = previewCss(base, "#00ff00", grid);
      const svg = decodeURIComponent(css.match(/svg\+xml,([^"]+)"/)![1]);
      expect(svg).toContain(`id="lines" width="${grid}" height="${grid * 2}"`);
      expect(svg).toContain("preserveAspectRatio=\"none\"");
      expect(svg).toContain("L90 25");
      expect(svg).toContain(`id="dashes" width="1" height="${grid * 0.8}"`);
      expect(css).not.toContain("--ddbi-background-position");
      const flat = decodeURIComponent(previewCss({ ...base, waveAmplitude: 0 }, "#00ff00", grid).match(/svg\+xml,([^"]+)"/)![1]);
      expect(flat).toContain("L40 25");
    }
    const chevron = { ...base, pattern: "chevrons" as const };
    expect(previewCss(chevron, "#00ff00")).toBe(previewCss({ ...chevron, waveAmplitude: 0, waveLength: 0.25 }, "#00ff00"));
  });

  it.each(["waves", "chevrons"] as const)("previews %s with rotated seamless bands, scalable dashes and independent borders", (pattern) => {
    const base = { ...RegionDisplayProfiles.get("status")!, pattern, spacing: 0.5, thickness: 0.2,
      angle: 30, dashed: true, dashLength: 0.3, opacity: 0, gapOpacity: 0.25, border: true, borderOpacity: 0.8 };
    for (const grid of [50, 150]) {
      const css = previewCss(base, "#00ff00", grid);
      const svg = decodeURIComponent(css.match(/data:image\/svg\+xml,([^"]+)/)![1]);
      expect(svg).toContain(`width="${grid * 0.5}" height="${grid * 0.5}" patternUnits="userSpaceOnUse"`);
      expect(svg).toContain("patternTransform=\"rotate(30)\"");
      expect(svg).toContain(`id="dashes" width="1" height="${grid * 0.6}"`);
      expect(svg).toContain(`<rect width="1" height="${grid * 0.3 / 2}"/>`);
      expect(svg).toContain("mask=\"url(#dash-mask)\"");
      expect(svg).toContain("fill=\"rgba(0, 255, 0, 0.25)\"");
      expect(css).toContain("--ddbi-fill-opacity: 0");
      expect(css).toContain("--ddbi-border-color: rgba(0, 255, 0, 0.8)");
      expect(svg).toContain(pattern === "waves" ? "L65 25" : "M65 0 L15 50 L65 100 L85 100 L35 50 L85 0Z");
      const continuous = decodeURIComponent(previewCss({ ...base, dashed: false }, "#00ff00", grid)
        .match(/data:image\/svg\+xml,([^"]+)/)![1]);
      expect(continuous).not.toContain("dash-mask");
      const full = decodeURIComponent(previewCss({ ...base, thickness: 1 }, "#00ff00", grid)
        .match(/data:image\/svg\+xml,([^"]+)/)![1]);
      expect(full).toContain("<rect width=\"100\" height=\"100\"/>");
      expect(full).not.toContain("<use");
      expect(previewCss({ ...base, crossRotation: 45 }, "#00ff00", grid)).toBe(css);
    }
  });

  it("converts hex colours and passes others through", () => {
    expect(rgba("#ff0000", 0.5)).toBe("rgba(255, 0, 0, 0.5)");
    expect(rgba("#0f0", 1)).toBe("rgba(0, 255, 0, 1)");
    expect(rgba("red", 1)).toBe("red");
  });

  it("describes each pattern", () => {
    const base = { opacity: 0.5, gapOpacity: 0.3333, borderOpacity: null, spacing: 0.5, thickness: 0.2, edgeWidth: 0.25, color: null };
    // lines are centred in their period as on the canvas: a 5px line in a 25px period starts at 10px
    expect(previewCss({ ...base, pattern: "hatch" }, "#ff6400")).toContain("repeating-linear-gradient(135deg, rgba(255, 100, 0, 1) 10px 15px, rgba(255, 100, 0, 0.3333) 15px 35px)");
    expect(previewCss({ ...base, pattern: "hatch", angle: 0 }, "#ff6400")).toContain("repeating-linear-gradient(90deg");
    expect(previewCss({ ...base, pattern: "crosshatch" }, "#ff6400")).toContain("repeating-linear-gradient(225deg");
    expect(previewCss({ ...base, pattern: "dots", border: true, borderWidth: 0.2 }, "#ff6400")).toContain("--ddbi-border-width: 10px; --ddbi-border-color: rgba(255, 100, 0, 0.5)");
    expect(previewCss({ ...base, pattern: "edge", border: true }, "#ff6400")).not.toContain("outline");
    expect(previewCss({ ...base, pattern: "dots" }, "#ff6400")).toContain("background-size: 25px 25px");
    expect(previewCss({ ...base, pattern: "solid", color: "#000000" }, "#ff6400")).toContain("background: rgba(0, 0, 0, 1)");
    expect(previewCss({ ...base, pattern: "edge" }, "#ff6400")).toContain("--ddbi-border-width: 12.5px; --ddbi-border-color: rgba(255, 100, 0, 0.5)");
    expect(previewCss({ ...base, pattern: "solid" }, "#ff6400")).toContain("opacity: 0.5");
    // the enlarged single-square preview scales every length with its grid size
    expect(previewCss({ ...base, pattern: "hatch" }, "#ff6400", 150)).toContain("30px 45px, rgba(255, 100, 0, 0.3333) 45px 105px)");
  });

  it("shifts every pattern towards the origin by the offset share of the period", () => {
    const base = { opacity: 0.5, gapOpacity: 0, borderOpacity: null, spacing: 0.5, thickness: 0.2, edgeWidth: 0.25, color: null, offset: 0.5 };
    // half a 25px period: symbols move from cell centres onto the grid lines
    expect(previewCss({ ...base, pattern: "dots" }, "#ff6400")).toContain("--ddbi-background-position: -12.5px -12.5px");
    expect(previewCss({ ...base, pattern: "crosses" }, "#ff6400")).toContain("--ddbi-background-position: -12.5px -12.5px");
    expect(previewCss({ ...base, pattern: "hatch" }, "#ff6400")).toContain("rgba(255, 100, 0, 1) -2.5px 2.5px, rgba(255, 100, 0, 0) 2.5px 22.5px)");
    const waves = previewCss({ ...base, pattern: "waves" }, "#ff6400");
    const svg = decodeURIComponent(waves.match(/svg\+xml,([^"]+)"/)![1]);
    expect(svg).toContain("patternTransform=\"rotate(45) translate(-12.5 -12.5)\"");
    expect(previewCss({ ...base, pattern: "dots", offset: 0 }, "#ff6400")).not.toContain("--ddbi-background-position");
  });

  it("keeps the gap fill continuous and dashes only the ink of line patterns", () => {
    const base = { opacity: 0.5, gapOpacity: 0.3333, borderOpacity: null, spacing: 0.5, thickness: 0.2, edgeWidth: 0.25, color: null, dashed: true, dashLength: 0.5 };
    const hatch = previewCss({ ...base, pattern: "hatch" }, "#ff6400");
    expect(hatch).toContain("background: rgba(255, 100, 0, 0.3333)");
    expect(hatch).toContain("--ddbi-ink: repeating-linear-gradient(135deg, rgba(255, 100, 0, 1) 10px 15px, transparent 15px 35px)");
    // a dash is centred on each dash-period boundary, as in the shader
    expect(hatch).toContain("--ddbi-mask: repeating-linear-gradient(45deg, black -12.5px 12.5px, transparent 12.5px 37.5px)");
    expect(hatch).not.toContain("--ddbi-ink2");
    const cross = previewCss({ ...base, pattern: "crosshatch" }, "#ff6400");
    expect(cross).toContain("--ddbi-ink2: repeating-linear-gradient(225deg");
    expect(cross).toContain("--ddbi-mask2: repeating-linear-gradient(135deg");
    expect(previewCss({ ...base, pattern: "dots" }, "#ff6400")).not.toContain("--ddbi-mask");
    expect(previewCss({ ...base, pattern: "hatch", dashed: false }, "#ff6400")).not.toContain("--ddbi-mask");
  });

  it("previews transparent holes, diamonds and independent borders at both editor scales", () => {
    const base = { ...RegionDisplayProfiles.get("status")!, opacity: 0, gapOpacity: 0, border: true, borderOpacity: 0.8, thickness: 0.5, spacing: 1 };
    for (const grid of [50, 150]) {
      const ring = previewCss({ ...base, pattern: "hollowDots" }, "#00ff00", grid);
      expect(ring).toContain(`radial-gradient(circle, rgba(0, 255, 0, 0) ${grid * 0.15}px`);
      expect(ring).toContain("--ddbi-fill-opacity: 0");
      expect(ring).toContain("--ddbi-border-color: rgba(0, 255, 0, 0.8)");
      const diamond = decodeURIComponent(previewCss({ ...base, pattern: "diamonds" }, "#00ff00", grid));
      expect(diamond).toContain("d=\"M50 25 L75 50 L50 75 L25 50Z\"");
      expect(diamond).toContain(`--ddbi-background-size: ${grid}px ${grid}px`);
    }
    expect(previewCss({ ...base, pattern: "edge", gapOpacity: 1 }, "#00ff00"))
      .toContain("--ddbi-background: rgba(0, 255, 0, 0.15)");
  });

  it("previews plus-shaped crosses at both editor scales with independent gap and border opacity", () => {
    const base = { ...RegionDisplayProfiles.get("status")!, pattern: "crosses" as const, thickness: 0.6, spacing: 0.5, gapOpacity: 0.25, opacity: 0, border: true, borderOpacity: 0.8 };
    for (const grid of [50, 150]) {
      const css = previewCss(base, "#00ff00", grid);
      const tile = decodeURIComponent(css);
      expect(tile).toContain("x=\"20\" y=\"40\" width=\"60\" height=\"20\"");
      expect(tile).toContain("x=\"40\" y=\"20\" width=\"20\" height=\"60\"");
      expect(tile).toContain("fill=\"rgba(0, 255, 0, 0.25)\"");
      expect(css).toContain(`--ddbi-background-size: ${grid * 0.5}px ${grid * 0.5}px`);
      expect(css).toContain("--ddbi-fill-opacity: 0");
      expect(css).toContain("--ddbi-border-color: rgba(0, 255, 0, 0.8)");
      expect(previewCss({ ...base, dashed: true, angle: 90 }, "#00ff00", grid)).toBe(css);
    }
  });

  it("sizes each checkerboard square by spacing and ignores symbol and line controls", () => {
    const base = { ...RegionDisplayProfiles.get("status")!, pattern: "checkerboard" as const, spacing: 0.5, gapOpacity: 0 };
    for (const grid of [50, 150]) {
      const css = previewCss(base, "#00ff00", grid);
      expect(css).toContain("conic-gradient(from 90deg, rgba(0, 255, 0, 1) 25%, rgba(0, 255, 0, 0) 0 50%");
      expect(css).toContain(`--ddbi-background-size: ${grid}px ${grid}px`);
      expect(previewCss({ ...base, thickness: 1, dashed: true, angle: 90 }, "#00ff00", grid)).toBe(css);
    }
  });

  it("rotates cross preview symbols around their centres and includes arms from adjacent tiles", () => {
    const base = { ...RegionDisplayProfiles.get("status")!, pattern: "crosses" as const, thickness: 1, crossRotation: 15 };
    for (const grid of [50, 150]) {
      const svg = decodeURIComponent(previewCss(base, "#00ff00", grid));
      expect(svg).toContain("rotate(15 50 50)");
      for (const offset of ["0 0", "-100 0", "100 0", "0 -100", "0 100"]) {
        expect(svg).toContain(`translate(${offset})`);
      }
      expect(svg).toContain(`--ddbi-background-size: ${base.spacing * grid}px ${base.spacing * grid}px`);
    }
    const other = { ...base, pattern: "diamonds" as const };
    expect(previewCss(other, "#00ff00")).toBe(previewCss({ ...other, crossRotation: 0 }, "#00ff00"));
  });
});

describe("profile picker", () => {
  const user = game.user as unknown as { can?: (permission: string) => boolean };
  beforeEach(() => {
    user.can = vi.fn(() => true);
  });
  afterEach(() => {
    delete user.can;
  });

  it("offers the editor gear only to a user who may change world settings", () => {
    user.can = vi.fn(() => false);
    const picker = createProfilePicker({ name: "p", value: "status", blank: "None" });
    expect(picker.querySelector("select")!.value).toBe("status");
    expect(picker.querySelector("button")).toBeNull();
    expect(user.can).toHaveBeenCalledWith("SETTINGS_MODIFY");
  });

  it("renders the world's profiles with a blank choice and opens the editor from the gear", () => {
    const open = vi.fn();
    setMockModules({ "ddb-importer": { api: { apps: { DDBRegionDisplayProfiles: { open } } } } });
    const picker = createProfilePicker({ name: "flags.ddbimporter.display.profile", value: "status", blank: "None" });
    const select = picker.querySelector("select")!;
    expect(select.name).toBe("flags.ddbimporter.display.profile");
    expect([...select.options].map((option) => option.value)).toEqual(["", ...RegionDisplayProfiles.builtins.map((profile) => profile.id)]);
    expect(select.value).toBe("status");
    // the selection must survive a round trip through HTML, which dnd5e's sheet does to behavior fields
    const holder = document.createElement("div");
    holder.innerHTML = picker.outerHTML;
    expect(holder.querySelector("select")!.value).toBe("status");
    document.body.append(holder);
    installProfilePickerDelegate();
    holder.querySelector("button")!.click();
    expect(open).toHaveBeenCalledWith({ profileId: "status" });
    holder.remove();
  });

  it("refreshes pickers in place after the store changes, keeping the selection", () => {
    const root = document.createElement("div");
    root.append(createProfilePicker({ name: "p", value: "minimal", blank: "None" }));
    setMockSettings({ "region-display-profiles": { fog: { name: "Fog", pattern: "dots", opacity: 0.4, spacing: 0.2, thickness: 0.3, edgeWidth: 0.25, color: null } } });
    refreshProfilePickers(root, "None");
    const select = root.querySelector("select")!;
    expect([...select.options].map((option) => option.value)).toEqual(["", ...RegionDisplayProfiles.builtins.map((profile) => profile.id), "fog"]);
    expect(select.value).toBe("minimal");
  });
});

describe("region config summary box", () => {
  let restoreLocalization: () => void;
  beforeEach(() => {
    restoreLocalization = useEnLocalization();
  });
  afterEach(() => restoreLocalization());

  it("inserts one compact box after the highlight mode control, with no form inputs", () => {
    const element = document.createElement("form");
    element.innerHTML = "<div class=\"form-group\"><select name=\"highlightMode\"></select></div><div class=\"form-group\" id=\"after\"></div>";
    const doc = { color: "#00ff00", flags: { ddbimporter: { display: { profile: "damage", opacity: 0.25, dashed: "dashed", border: "none", angle: 90, color: "#123456" } } } };
    onRenderRegionConfig({ document: doc as any }, element);
    onRenderRegionConfig({ document: doc as any }, element);
    const boxes = element.querySelectorAll(".ddbi-display-region-fieldset");
    expect(boxes).toHaveLength(1);
    expect(boxes[0].nextElementSibling?.id).toBe("after");
    // the sheet's own submission must not carry the flag: the editor writes the document
    expect(boxes[0].querySelectorAll("input, select, color-picker")).toHaveLength(0);
    expect(boxes[0].querySelector(".ddbi-display-region-summary-text")!.textContent)
      .toBe("Ongoing Damage, dashed, no border, fill opacity 0.25, line angle 90°, colour #123456");
    expect(boxes[0].querySelector(".ddbi-display-region-swatch")).not.toBeNull();
  });

  it("opens the region editor from the configure button", () => {
    const open = vi.spyOn(DDBRegionDisplayConfig, "open").mockImplementation(() => ({}) as any);
    const doc = { color: "#00ff00", flags: { ddbimporter: { display: { profile: "aura" } } } };
    const box = buildDisplaySummary(doc as any);
    box.querySelector<HTMLButtonElement>("button.ddbi-display-region-configure")!.click();
    expect(open).toHaveBeenCalledWith(doc);
    open.mockRestore();
  });

  it("routes a behavior row's Configure button to the editor through the sheet it sits in", () => {
    const open = vi.spyOn(DDBRegionDisplayConfig, "openForBehavior").mockImplementation(() => ({}) as any);
    const sheet = document.createElement("div");
    sheet.innerHTML = `<li data-behavior-id="bbb"><div class="ddbi-display-region-behavior"><button type="button" class="ddbi-display-region-configure ${BEHAVIOR_CONFIGURE_CLASS}">Configure</button></div></li>`;
    document.body.append(sheet);
    const activity = { uuid: "Item.x.Activity.y" };
    foundry.applications.instances.set("sheet", { element: sheet, activity } as any);
    installBehaviorConfigureDelegate();
    sheet.querySelector("button")!.click();
    expect(open).toHaveBeenCalledWith(activity, "bbb");
    foundry.applications.instances.delete("sheet");
    sheet.remove();
    open.mockRestore();
  });

  it("shows the Foundry default and no swatch for a region without a profile", () => {
    const box = buildDisplaySummary({ color: "#00ff00", flags: {} } as any);
    expect(box.querySelector(".ddbi-display-region-swatch")).toBeNull();
    expect(box.querySelector(".ddbi-display-region-summary-text")!.textContent).toBe("None (Foundry default)");
  });

  it("leaves the configure button out of a sheet the user cannot edit", () => {
    const sheet = () => {
      const element = document.createElement("form");
      element.innerHTML = "<div class=\"form-group\"><select name=\"highlightMode\"></select></div>";
      return element;
    };
    const doc = { color: "#00ff00", isOwner: true, flags: { ddbimporter: { display: { profile: "aura" } } } };
    const locked = sheet();
    onRenderRegionConfig({ document: doc as any, isEditable: false }, locked);
    expect(locked.querySelector(".ddbi-display-region-summary-text")).not.toBeNull();
    expect(locked.querySelector(".ddbi-display-region-fieldset button")).toBeNull();
    // without the sheet's verdict, ownership of the region decides
    const owned = sheet();
    onRenderRegionConfig({ document: doc as any }, owned);
    expect(owned.querySelector(".ddbi-display-region-fieldset button")).not.toBeNull();
    const foreign = sheet();
    onRenderRegionConfig({ document: { ...doc, isOwner: false } as any }, foreign);
    expect(foreign.querySelector(".ddbi-display-region-summary-text")).not.toBeNull();
    expect(foreign.querySelector(".ddbi-display-region-fieldset button")).toBeNull();
  });
});

describe("master switch", () => {
  it("is on unless the setting is explicitly false", () => {
    expect(RegionDisplayProfiles.enabled).toBe(true);
    setMockSettings({ "enable-region-display-profiles": true });
    expect(RegionDisplayProfiles.enabled).toBe(true);
    setMockSettings({ "enable-region-display-profiles": false });
    expect(RegionDisplayProfiles.enabled).toBe(false);
  });

  it("registers nothing when switched off and everything when on", () => {
    const on = vi.fn();
    vi.stubGlobal("Hooks", { on, once: vi.fn(), callAll: vi.fn() });
    setMockSettings({ "enable-region-display-profiles": false });
    expect(setupRegionDisplayProfiles()).toBe(false);
    expect(on).not.toHaveBeenCalled();
    setMockSettings({ "enable-region-display-profiles": true });
    expect(setupRegionDisplayProfiles()).toBe(true);
    const hooks = on.mock.calls.map((call) => call[0]);
    for (const name of ["drawRegion", "refreshRegion", "destroyRegion", "updateRegion", "dnd5e.createMeasuredTemplate", "renderRegionConfig"]) {
      expect(hooks).toContain(name);
    }
  });

  it("stops the import defaults when switched off", () => {
    setMockSettings({ "enable-region-display-profiles": false });
    const activities: Record<string, any> = { aura: { target: { template: { type: "radius" } }, behaviors: [{ type: "applyActiveEffect" }] } };
    BehaviorHelper.assignDisplayDefaults(activities);
    expect(activities.aura.behaviors).toHaveLength(1);
  });
});
