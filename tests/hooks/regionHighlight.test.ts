// @vitest-environment jsdom
import {
  buildFragmentShader,
  buildVertexShader,
  DDB_HIGHLIGHT_UNIFORMS,
  getDDBHighlightShaderClass,
  missingContractNames,
  resetDDBHighlightShaderClass,
  verifyShaderProgram,
} from "../../src/hooks/canvas/DDBHighlightRegionShader";
import logger from "../../src/lib/Logger";
import {
  applyStyle,
  findHighlightMesh,
  onDrawRegion,
  onRefreshRegion,
  refreshAllRegionHighlights,
  restoreCoreStyle,
  syncRegionHighlight,
  tintFor,
} from "../../src/hooks/canvas/regionHighlight";
import { activityHighlightChoice, stampRegionHighlight } from "../../src/hooks/canvas/regionHighlightStamp";
import { previewCss, rgba } from "../../src/hooks/canvas/regionHighlightPreview";
import { createProfilePicker, installProfilePickerDelegate, refreshProfilePickers } from "../../src/hooks/canvas/regionHighlightPicker";
import { buildHighlightSummary, onRenderRegionConfig } from "../../src/hooks/canvas/regionConfigHighlight";
import DDBRegionHighlightConfig from "../../src/apps/DDBRegionHighlightConfig";
import { setupRegionHighlightProfiles } from "../../src/hooks/canvas/regionHighlightSetup";
import RegionHighlightProfiles from "../../src/lib/RegionHighlightProfiles";
import BehaviorHelper from "../../src/parser/enrichers/effects/BehaviorHelper";
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

function fakeRegion(highlight: IRegionHighlightFlag | undefined, color = "#00ff00") {
  return {
    id: "r1",
    document: { color, flags: highlight ? { ddbimporter: { highlight } } : {} },
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
      destroy = vi.fn();
    },
  };
});

afterEach(() => {
  delete (foundry.utils as any).Color;
  delete (globalThis as any).PIXI;
  delete (foundry as any).canvas;
  resetDDBHighlightShaderClass();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("DDBHighlightRegionShader", () => {
  it("adds the pattern uniforms and every pattern branch to the core shader", () => {
    const fragment = buildFragmentShader("highp", "CONSTS");
    expect(fragment).toContain("CONSTS");
    expect(fragment).toContain("uniform int pattern;");
    expect(fragment).toContain("uniform highp float period;");
    expect(fragment).toContain("uniform float thickness;");
    expect(fragment).toContain("uniform bool dashed;");
    expect(fragment).toContain("uniform highp float dashPeriod;");
    expect(fragment).toContain("float dash(float along, float aa)");
    expect(fragment).toContain("if ( !hatchEnabled ) return;");
    expect(fragment).toContain("pattern == 1 || pattern == 4");
    expect(fragment).toContain("pattern == 3");
    expect(fragment).toContain("pattern == 2");
    expect(fragment).toContain("pattern == 5");
    expect(fragment).toContain("pattern == 6");
    expect(fragment).toContain("mix(gapOpacity, 1.0, ink)");
    // the pattern coordinates come from the vertex stage as varyings already in periods
    const vertex = buildVertexShader("highp", "highp", "CONSTS");
    expect(vertex).toContain("uniform float angle;");
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
    const Shader = getDDBHighlightShaderClass({ gl })!;
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
    expect(getDDBHighlightShaderClass({ gl: fakeGl() })).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("no longer declares hatchEnabled"));
    // recorded: the sources are not re-checked and nothing is logged again
    (foundry as any).canvas = { rendering: { shaders: { HighlightRegionShader: FakeCoreShader } } };
    expect(getDDBHighlightShaderClass({ gl: fakeGl() })).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    resetDDBHighlightShaderClass();
    expect(getDDBHighlightShaderClass({ gl: fakeGl({ failLink: true }) })).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("did not compile (program failed to link: link error)"));
    resetDDBHighlightShaderClass();
    expect(getDDBHighlightShaderClass({ gl: fakeGl() })).not.toBeNull();
  });

  it("builds the subclass once from the live core shader and reports none without a canvas", () => {
    expect(getDDBHighlightShaderClass()).toBeNull();
    (foundry as any).canvas = { rendering: { shaders: { HighlightRegionShader: FakeCoreShader } } };
    const Shader = getDDBHighlightShaderClass()!;
    expect(Shader).not.toBeNull();
    expect(Object.getPrototypeOf(Shader)).toBe(FakeCoreShader);
    expect(Shader.defaultUniforms).toMatchObject({ hatchThickness: 1, ...DDB_HIGHLIGHT_UNIFORMS });
    expect(Shader._createFragmentShader()).toContain(FakeCoreShader.CONSTANTS);
    expect(Shader._createVertexShader()).toContain("precision highp float;");
    expect(getDDBHighlightShaderClass()).toBe(Shader);
  });
});

describe("applyStyle", () => {
  const style: IRegionHighlightStyle = {
    profile: "damage", pattern: "crosshatch", opacity: 0.7, gapOpacity: 0, borderOpacity: 0.7, spacing: 0.25, thickness: 0.2, edgeWidth: 0.25,
    dashed: false, dashLength: 0.25, angle: 45, border: false, borderWidth: 0.1, color: null,
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
    const Shader = getDDBHighlightShaderClass();
    expect(flaggedMesh.setShaderClass).toHaveBeenCalledWith(Shader);
    expect(flaggedMesh.alpha).toBe(RegionHighlightProfiles.get("aura")!.opacity);
    expect(flaggedMesh.tint).toBe(0x00ff00);
    expect(flaggedMesh.shader.uniforms).toMatchObject({ pattern: 0, period: RegionHighlightProfiles.get("aura")!.spacing * 100, thickness: 0.15, hatchThickness: 4 });
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
    region.document.flags = { ddbimporter: { highlight: { profile: "gone" } } };
    mesh.setShaderClass.mockClear();
    syncRegionHighlight(region as any);
    expect(mesh.setShaderClass).not.toHaveBeenCalled();
  });

  it.each([true, false])("preserves hatchEnabled=%s when assigning and clearing a profile on a drawn region", (hatchEnabled) => {
    const region = fakeRegion(undefined);
    region.controlled = !hatchEnabled;
    const mesh = fakeMesh(region);
    stubCanvas([region], [mesh]);
    onDrawRegion(region as unknown as TCoreRegionPlaceable);

    region.document.flags = { ddbimporter: { highlight: { profile: "status" } } };
    // Core refreshes the interaction state before the refreshRegion hook swaps shaders.
    mesh.shader.uniforms.hatchEnabled = hatchEnabled;
    onRefreshRegion(region as unknown as TCoreRegionPlaceable, { refreshState: true });
    expect(mesh.shaderClass).toBe(getDDBHighlightShaderClass());
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
    expect(band.alpha).toBe(RegionHighlightProfiles.get("aura")!.opacity);
    expect(band.zIndex).toBe(3);
    region.document.flags = { ddbimporter: { highlight: { profile: "aura", border: false } } };
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
    region.document.flags = { ddbimporter: { highlight: { profile: "status", border: "none" } } };
    onRefreshRegion(region as any, { refreshState: true });
    expect(band.destroy).toHaveBeenCalled();
  });

  it("asks every region to refresh", () => {
    const regions = [fakeRegion({ profile: "aura" }), fakeRegion(undefined)];
    stubCanvas(regions, []);
    refreshAllRegionHighlights();
    for (const region of regions) expect(region.renderFlags.set).toHaveBeenCalledWith({ refreshState: true, refreshGeometry: true });
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
    region.document.flags = { ddbimporter: { highlight: { profile: "status", pattern, border: true, borderOpacity: 0 } } };
    onRefreshRegion(region as any, { refreshState: true });
    expect(band.alpha).toBe(0);
  });
});

describe("placement stamp", () => {
  it.each(["hollowDots", "diamonds"] as const)("carries %s and explicit opacity zeroes from importer behavior to region flags", (pattern) => {
    const behavior = BehaviorHelper.highlight({ profile: "status", pattern, opacity: 0, gapOpacity: 0, borderOpacity: 0 });
    expect(behavior.config).toMatchObject({ opacity: 0, gapOpacity: 0, borderOpacity: 0 });
    const activity = { applicableBehaviors: [{ type: behavior.type, config: { ...behavior.config } }] };
    const data = [{ name: "test" }];
    stampRegionHighlight(activity, data);
    expect(foundry.utils.getProperty(data[0], "flags.ddbimporter.highlight"))
      .toEqual({ profile: "status", pattern, opacity: 0, gapOpacity: 0, borderOpacity: 0 });
  });

  it("prefers the appearance behavior, copying only filled overrides", () => {
    const activity = {
      applicableBehaviors: [
        { type: "ddbMacro", config: { highlightProfile: "damage" } },
        { type: "ddbHighlight", config: { profile: "aura", pattern: "", opacity: 0.4, spacing: null, thickness: "", edgeWidth: undefined, dashed: "dashed", dashLength: 0.5, angle: 90, border: "border", borderWidth: null, color: "#ff0000" } },
      ],
    };
    expect(activityHighlightChoice(activity)).toEqual({ profile: "aura", opacity: 0.4, dashed: "dashed", dashLength: 0.5, angle: 90, border: "border", color: "#ff0000" });
    expect(activityHighlightChoice({ behaviors: [{ type: "ddbHighlight", config: { profile: "aura", dashed: "" } }] })).toEqual({ profile: "aura" });
  });

  it("falls back to the trigger's profile, and to nothing", () => {
    expect(activityHighlightChoice({ behaviors: [{ type: "ddbMacro", config: { highlightProfile: "damage" } }] })).toEqual({ profile: "damage" });
    expect(activityHighlightChoice({ behaviors: [{ type: "ddbMacro", config: { highlightProfile: "" } }, { type: "applyActiveEffect" }] })).toBeNull();
    expect(activityHighlightChoice({ behaviors: [{ type: "ddbHighlight", config: { profile: "" } }] })).toBeNull();
    expect(activityHighlightChoice(null)).toBeNull();
  });

  it("stamps each region's creation data, leaving flags the caller already set", () => {
    const activity = { uuid: "Item.x.Activity.y", applicableBehaviors: [{ type: "ddbHighlight", config: { profile: "status" } }] };
    const regionData = [{ name: "a" }, { name: "b", flags: { ddbimporter: { highlight: { profile: "aura" } } } }];
    stampRegionHighlight(activity, regionData);
    expect(regionData[0]).toEqual({ name: "a", flags: { ddbimporter: { highlight: { profile: "status" } } } });
    expect(foundry.utils.getProperty(regionData[1], "flags.ddbimporter.highlight")).toEqual({ profile: "aura" });
    const untouched = [{ name: "c" }];
    stampRegionHighlight({ behaviors: [] }, untouched);
    expect(untouched).toEqual([{ name: "c" }]);
  });
});

describe("BehaviorHelper.highlight and defaults", () => {
  it("builds an appearance behavior named after the shipped profile", () => {
    expect(BehaviorHelper.highlight({ profile: "damage", opacity: 0.3 })).toMatchObject({
      type: "ddbHighlight",
      name: "Appearance: Ongoing Damage",
      level: { min: null, max: null },
      config: { profile: "damage", pattern: "", opacity: 0.3, spacing: null, thickness: null, edgeWidth: null, dashed: "", dashLength: null, angle: null, border: "", borderWidth: null, color: null },
    });
    expect(BehaviorHelper.highlight({ profile: "aura", angle: 0, border: true, borderWidth: 0.2 }).config).toMatchObject({ angle: 0, border: "border", borderWidth: 0.2 });
    expect(BehaviorHelper.highlight({ profile: "aura", border: false }).config).toMatchObject({ border: "none" });
    expect(BehaviorHelper.highlight({ profile: "custom", name: "Look" })).toMatchObject({ name: "Look", config: { profile: "custom" } });
    expect(BehaviorHelper.highlight({ profile: "aura", dashed: true, dashLength: 0.5 }).config).toMatchObject({ dashed: "dashed", dashLength: 0.5 });
    expect(BehaviorHelper.highlight({ profile: "aura", dashed: false }).config).toMatchObject({ dashed: "continuous" });
  });

  it("assigns aura, damage, status and minimal defaults from the activity's shape", () => {
    const activities: Record<string, any> = {
      aura: { target: { template: { type: "radius" } }, behaviors: [{ type: "applyActiveEffect" }] },
      damage: { target: { template: { type: "circle" } }, damage: { parts: [{}] }, behaviors: [{ type: "ddbMacro", config: {} }] },
      sibling: { target: { template: { type: "cylinder" } }, behaviors: [{ type: "ddbMacro", config: { activity: "hurt" } }] },
      hurt: { type: "damage", damage: { parts: [{}] } },
      status: { target: { template: { type: "cube" } }, behaviors: [{ type: "ddbMacro", config: {} }, { type: "applyActiveEffect" }] },
      terrain: { target: { template: { type: "cube" } }, behaviors: [{ type: "difficultTerrain" }] },
      chosen: { target: { template: { type: "radius" } }, behaviors: [{ type: "ddbHighlight", config: { profile: "custom" } }] },
      bare: { target: { template: { type: "circle" } }, behaviors: [] },
      none: { target: { template: { type: "circle" } } },
    };
    BehaviorHelper.assignHighlightDefaults(activities);
    const profile = (key: string) => activities[key].behaviors?.find((b: any) => b.type === "ddbHighlight")?.config.profile;
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
    BehaviorHelper.assignHighlightDefaults(activities, { documentTemplateType: "radius" });
    expect(activities.inherits.behaviors.at(-1).config.profile).toBe("aura");
    expect(activities.owns.behaviors.at(-1).config.profile).toBe("status");
  });
});

describe("preview css", () => {
  it("converts hex colours and passes others through", () => {
    expect(rgba("#ff0000", 0.5)).toBe("rgba(255, 0, 0, 0.5)");
    expect(rgba("#0f0", 1)).toBe("rgba(0, 255, 0, 1)");
    expect(rgba("red", 1)).toBe("red");
  });

  it("describes each pattern", () => {
    const base = { opacity: 0.5, gapOpacity: 0.3333, borderOpacity: null, spacing: 0.5, thickness: 0.2, edgeWidth: 0.25, color: null };
    expect(previewCss({ ...base, pattern: "hatch" }, "#ff6400")).toContain("repeating-linear-gradient(135deg, rgba(255, 100, 0, 1) 0 5px, rgba(255, 100, 0, 0.3333) 5px 25px)");
    expect(previewCss({ ...base, pattern: "hatch", angle: 0 }, "#ff6400")).toContain("repeating-linear-gradient(90deg");
    expect(previewCss({ ...base, pattern: "crosshatch" }, "#ff6400")).toContain("repeating-linear-gradient(225deg");
    expect(previewCss({ ...base, pattern: "dots", border: true, borderWidth: 0.2 }, "#ff6400")).toContain("--ddbi-border-width: 10px; --ddbi-border-color: rgba(255, 100, 0, 0.5)");
    expect(previewCss({ ...base, pattern: "edge", border: true }, "#ff6400")).not.toContain("outline");
    expect(previewCss({ ...base, pattern: "dots" }, "#ff6400")).toContain("background-size: 25px 25px");
    expect(previewCss({ ...base, pattern: "solid", color: "#000000" }, "#ff6400")).toContain("background: rgba(0, 0, 0, 1)");
    expect(previewCss({ ...base, pattern: "edge" }, "#ff6400")).toContain("--ddbi-border-width: 12.5px; --ddbi-border-color: rgba(255, 100, 0, 0.5)");
    expect(previewCss({ ...base, pattern: "solid" }, "#ff6400")).toContain("opacity: 0.5");
    // the enlarged single-square preview scales every length with its grid size
    expect(previewCss({ ...base, pattern: "hatch" }, "#ff6400", 150)).toContain("0 15px, rgba(255, 100, 0, 0.3333) 15px 75px)");
  });

  it("keeps the gap fill continuous and dashes only the ink of line patterns", () => {
    const base = { opacity: 0.5, gapOpacity: 0.3333, borderOpacity: null, spacing: 0.5, thickness: 0.2, edgeWidth: 0.25, color: null, dashed: true, dashLength: 0.5 };
    const hatch = previewCss({ ...base, pattern: "hatch" }, "#ff6400");
    expect(hatch).toContain("background: rgba(255, 100, 0, 0.3333)");
    expect(hatch).toContain("--ddbi-ink: repeating-linear-gradient(135deg, rgba(255, 100, 0, 1) 0 5px, transparent 5px 25px)");
    expect(hatch).toContain("--ddbi-mask: repeating-linear-gradient(45deg, black 0 25px, transparent 25px 50px)");
    expect(hatch).not.toContain("--ddbi-ink2");
    const cross = previewCss({ ...base, pattern: "crosshatch" }, "#ff6400");
    expect(cross).toContain("--ddbi-ink2: repeating-linear-gradient(225deg");
    expect(cross).toContain("--ddbi-mask2: repeating-linear-gradient(135deg");
    expect(previewCss({ ...base, pattern: "dots" }, "#ff6400")).not.toContain("--ddbi-mask");
    expect(previewCss({ ...base, pattern: "hatch", dashed: false }, "#ff6400")).not.toContain("--ddbi-mask");
  });

  it("previews transparent holes, diamonds and independent borders at both editor scales", () => {
    const base = { ...RegionHighlightProfiles.get("status")!, opacity: 0, gapOpacity: 0, border: true, borderOpacity: 0.8, thickness: 0.5, spacing: 1 };
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
});

describe("profile picker", () => {
  it("renders the world's profiles with a blank choice and opens the editor from the gear", () => {
    const open = vi.fn();
    setMockModules({ "ddb-importer": { api: { apps: { DDBRegionHighlightProfiles: { open } } } } });
    const picker = createProfilePicker({ name: "flags.ddbimporter.highlight.profile", value: "status", blank: "None" });
    const select = picker.querySelector("select")!;
    expect(select.name).toBe("flags.ddbimporter.highlight.profile");
    expect([...select.options].map((option) => option.value)).toEqual(["", "aura", "damage", "status", "minimal"]);
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
    setMockSettings({ "region-highlight-profiles": { fog: { name: "Fog", pattern: "dots", opacity: 0.4, spacing: 0.2, thickness: 0.3, edgeWidth: 0.25, color: null } } });
    refreshProfilePickers(root, "None");
    const select = root.querySelector("select")!;
    expect([...select.options].map((option) => option.value)).toEqual(["", "aura", "damage", "status", "minimal", "fog"]);
    expect(select.value).toBe("minimal");
  });
});

describe("region config summary box", () => {
  it("inserts one compact box after the highlight mode control, with no form inputs", () => {
    const element = document.createElement("form");
    element.innerHTML = "<div class=\"form-group\"><select name=\"highlightMode\"></select></div><div class=\"form-group\" id=\"after\"></div>";
    const doc = { color: "#00ff00", flags: { ddbimporter: { highlight: { profile: "damage", opacity: 0.25, dashed: "dashed", border: "none", angle: 90, color: "#123456" } } } };
    onRenderRegionConfig({ document: doc as any }, element);
    onRenderRegionConfig({ document: doc as any }, element);
    const boxes = element.querySelectorAll(".ddbi-highlight-fieldset");
    expect(boxes).toHaveLength(1);
    expect(boxes[0].nextElementSibling?.id).toBe("after");
    // the sheet's own submission must not carry the flag: the editor writes the document
    expect(boxes[0].querySelectorAll("input, select, color-picker")).toHaveLength(0);
    expect(boxes[0].querySelector(".ddbi-highlight-summary-text")!.textContent)
      .toBe("Ongoing Damage, dashed, no border, fill opacity 0.25, line angle 90°, colour #123456");
    expect(boxes[0].querySelector(".ddbi-highlight-swatch")).not.toBeNull();
  });

  it("opens the region editor from the configure button", () => {
    const open = vi.spyOn(DDBRegionHighlightConfig, "open").mockImplementation(() => ({}) as any);
    const doc = { color: "#00ff00", flags: { ddbimporter: { highlight: { profile: "aura" } } } };
    const box = buildHighlightSummary(doc as any);
    box.querySelector<HTMLButtonElement>("button.ddbi-highlight-configure")!.click();
    expect(open).toHaveBeenCalledWith(doc);
    open.mockRestore();
  });

  it("shows the Foundry default and no swatch for a region without a profile", () => {
    const box = buildHighlightSummary({ color: "#00ff00", flags: {} } as any);
    expect(box.querySelector(".ddbi-highlight-swatch")).toBeNull();
    expect(box.querySelector(".ddbi-highlight-summary-text")!.textContent).toBe("None (Foundry default)");
  });
});

describe("master switch", () => {
  it("is on unless the setting is explicitly false", () => {
    expect(RegionHighlightProfiles.enabled).toBe(true);
    setMockSettings({ "enable-region-highlight-profiles": true });
    expect(RegionHighlightProfiles.enabled).toBe(true);
    setMockSettings({ "enable-region-highlight-profiles": false });
    expect(RegionHighlightProfiles.enabled).toBe(false);
  });

  it("registers nothing when switched off and everything when on", () => {
    const on = vi.fn();
    vi.stubGlobal("Hooks", { on, callAll: vi.fn() });
    setMockSettings({ "enable-region-highlight-profiles": false });
    expect(setupRegionHighlightProfiles()).toBe(false);
    expect(on).not.toHaveBeenCalled();
    setMockSettings({ "enable-region-highlight-profiles": true });
    expect(setupRegionHighlightProfiles()).toBe(true);
    const hooks = on.mock.calls.map((call) => call[0]);
    for (const name of ["drawRegion", "refreshRegion", "destroyRegion", "updateRegion", "dnd5e.createMeasuredTemplate", "renderRegionConfig"]) {
      expect(hooks).toContain(name);
    }
  });

  it("stops the import defaults when switched off", () => {
    setMockSettings({ "enable-region-highlight-profiles": false });
    const activities: Record<string, any> = { aura: { target: { template: { type: "radius" } }, behaviors: [{ type: "applyActiveEffect" }] } };
    BehaviorHelper.assignHighlightDefaults(activities);
    expect(activities.aura.behaviors).toHaveLength(1);
  });
});
